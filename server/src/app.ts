import path from 'node:path';
import fastifyCors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import { API_ROUTES } from '@english-office/shared';
import Fastify, { type FastifyInstance } from 'fastify';
import { toOriginMatchers } from './config/corsOrigins';
import { dialogueRoutes } from './routes/dialogue.routes';
import { sendError } from './routes/errors';
import type { DialogueProvider } from './services/dialogue/DialogueProvider';

export interface AppDependencies {
  dialogueProvider: DialogueProvider;
  logLevel: string;
  /** Origin patterns allowed to call the API cross-origin (see env CORS_ORIGINS). */
  corsOrigins: readonly string[];
  /** Built client directory to serve alongside the API (optional single-service mode). */
  staticDir?: string;
}

export function buildApp(deps: AppDependencies): FastifyInstance {
  const app = Fastify({ logger: { level: deps.logLevel } });

  if (deps.corsOrigins.length > 0) {
    app.register(fastifyCors, { origin: toOriginMatchers(deps.corsOrigins), methods: ['GET', 'POST'] });
  }

  // Liveness probe for Render and uptime monitors: no dependencies, answers instantly.
  // Fastify also answers HEAD on this route automatically.
  app.get(API_ROUTES.health, { logLevel: 'warn' }, async () => ({ status: 'ok' }));

  app.register(dialogueRoutes, { provider: deps.dialogueProvider });

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

  app.setNotFoundHandler((request, reply) => {
    const isApi = request.url.startsWith('/api/');
    if (staticRoot && !isApi && request.method === 'GET') return reply.sendFile('index.html');
    return sendError(reply, 404, 'NOT_FOUND', `Route ${request.method} ${request.url} not found`);
  });

  return app;
}
