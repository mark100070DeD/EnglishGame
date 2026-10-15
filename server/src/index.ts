import { buildApp } from './app';
import { env } from './config/env';
import { FileReportRepository } from './reports/ReportRepository';
import { createDialogueProvider } from './services/dialogue/createDialogueProvider';

const dialogueProvider = createDialogueProvider(env);

const app = buildApp({
  dialogueProvider,
  reports: new FileReportRepository(env.REPORTS_DIR),
  logLevel: env.LOG_LEVEL,
  sessionIdleMinutes: env.SESSION_IDLE_MINUTES,
  rateLimitPerMinute: env.RATE_LIMIT_PER_MINUTE,
  corsOrigins: env.CORS_ORIGINS,
  staticDir: env.STATIC_DIR,
});

try {
  await app.listen({ port: env.PORT, host: env.HOST });
  app.log.info(`Dialogue provider: ${dialogueProvider.name}`);
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
