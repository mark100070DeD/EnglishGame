import path from 'node:path';
import fastifyCors from '@fastify/cors';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import { API_ROUTES } from '@english-office/shared';
import Fastify, { type FastifyInstance } from 'fastify';
import { toOriginMatchers } from './config/corsOrigins';
import type { ReportRepository } from './reports/ReportRepository';
import { sendError } from './routes/errors';
import { reportRoutes } from './routes/reports.routes';
import { sessionRoutes } from './routes/sessions.routes';
import type { DialogueProvider } from './services/dialogue/DialogueProvider';
import { ApiProblem } from './sessions/ApiProblem';
import { SessionService } from './sessions/SessionService';
import { SessionStore } from './sessions/SessionStore';

export interface AppDependencies {
  dialogueProvider: DialogueProvider;
  reports: ReportRepository;
  logLevel: string;
  sessionIdleMinutes: number;
  rateLimitPerMinute: number;
  /** Origin patterns allowed to call the API cross-origin (see env CORS_ORIGINS). */
  corsOrigins: readonly string[];
  /** Built client directory to serve alongside the API (optional single-service mode). */
  staticDir?: string;
}

export function buildApp(deps: AppDependencies): FastifyInstance {
  // Behind Render's proxy: use X-Forwarded-For so rate limits apply per real client IP.
  const app = Fastify({ logger: { level: deps.logLevel }, trustProxy: true });

  if (deps.corsOrigins.length > 0) {
    app.register(fastifyCors, { origin: toOriginMatchers(deps.corsOrigins), methods: ['GET', 'POST'] });
  }

  // Liveness probe for Render and uptime monitors: no dependencies, answers instantly.
  // Fastify also answers HEAD on this route automatically.
  app.get(API_ROUTES.health, { logLevel: 'warn' }, async () => ({ status: 'ok' }));

  // Every LLM call costs money: cap requests per client IP.
  app.register(fastifyRateLimit, {
    max: deps.rateLimitPerMinute,
    timeWindow: '1 minute',
    allowList: (request) => request.url === API_ROUTES.health,
    errorResponseBuilder: (_request, context) =>
      new ApiProblem(429, 'RATE_LIMITED', `Too many requests. Please try again in ${context.after}.`),
  });

  const store = new SessionStore(deps.sessionIdleMinutes * 60_000);
  app.addHook('onClose', async () => store.close());
  const sessions = new SessionService({
    store,
    provider: deps.dialogueProvider,
    reports: deps.reports,
    log: app.log,
  });

  app.register(sessionRoutes, { sessions });
  app.register(reportRoutes, { reports: deps.reports });

  const staticRoot = deps.staticDir ? path.resolve(deps.staticDir) : null;
  if (staticRoot) {
    app.register(fastifyStatic, {
      root: staticRoot,
      cacheControl: false,
      setHeaders: (res, filePath) => {
        // Vite puts content-hashed files in /assets: safe to cache forever. index.html must stay fresh.
        const immutable = filePath.includes(`${path.sep}assets${path.sep}`);
        res.setHeader('Cache-Control', immutable ? 'public, max-age=31536000, immutable' : 'no-cache');
      },
    });
  }

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ApiProblem) return sendError(reply, error.status, error.code, error.message);

    const status = typeof (error as { statusCode?: unknown }).statusCode === 'number'
      ? (error as { statusCode: number }).statusCode
      : 500;
    if (status < 500) {
      return sendError(reply, status, 'BAD_REQUEST', error instanceof Error ? error.message : 'Bad request');
    }
    request.log.error({ err: error }, 'Unhandled error');
    return sendError(reply, 500, 'INTERNAL_ERROR', 'Something went wrong on the server');
  });

  app.setNotFoundHandler((request, reply) => {
    const isApi = request.url.startsWith('/api/');
    if (staticRoot && !isApi && request.method === 'GET') return reply.sendFile('index.html');
    return sendError(reply, 404, 'NOT_FOUND', `Route ${request.method} ${request.url} not found`);
  });

  return app;
}
