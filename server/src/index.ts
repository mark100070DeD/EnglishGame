import { buildApp } from './app';
import { env } from './config/env';
import { createDialogueProvider } from './services/dialogue/createDialogueProvider';

const app = buildApp({
  dialogueProvider: createDialogueProvider(env),
  logLevel: env.LOG_LEVEL,
  corsOrigins: env.CORS_ORIGINS,
  staticDir: env.STATIC_DIR,
});

try {
  await app.listen({ port: env.PORT, host: env.HOST });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
