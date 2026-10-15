import 'dotenv/config';
import { z } from 'zod';

const EnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3001),
  HOST: z.string().default('127.0.0.1'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  /** "auto": Claude if ANTHROPIC_API_KEY is set, otherwise the echo stub. */
  DIALOGUE_PROVIDER: z.enum(['auto', 'echo', 'anthropic']).default('auto'),
  ANTHROPIC_API_KEY: z
    .string()
    .optional()
    .transform((value) => value?.trim() || undefined),
  LLM_MODEL: z.string().min(1).default('claude-opus-5-5'),
  /** Where finished reports are stored as JSON files. Relative paths resolve from the working directory. */
  REPORTS_DIR: z.string().min(1).default('data/reports'),
  /** Sessions without activity for this long are dropped from memory. */
  SESSION_IDLE_MINUTES: z.coerce.number().int().positive().default(120),
  /** API requests per minute allowed from one IP. */
  RATE_LIMIT_PER_MINUTE: z.coerce.number().int().positive().default(40),
  /**
   * Comma-separated browser origins allowed to call the API from another domain,
   * e.g. "https://english-office.vercel.app". "*" matches any part of a hostname label:
   * "https://english-office*.vercel.app" also allows Vercel preview deployments.
   * Unset = no cross-origin access (local dev goes through the Vite proxy).
   */
  CORS_ORIGINS: z
    .string()
    .optional()
    .transform((value) => (value ?? '').split(',').map((origin) => origin.trim()).filter(Boolean)),
  /**
   * Directory with the built client (client/dist). When set, the server also serves the game
   * as a single service. Relative paths resolve from the working directory.
   */
  STATIC_DIR: z.string().min(1).optional(),
});

export type Env = z.infer<typeof EnvSchema>;

export const env: Env = EnvSchema.parse(process.env);
