import type { z } from 'zod';
import { ApiProblem } from '../sessions/ApiProblem';

/** Parses request data or throws a 400 ApiProblem listing the invalid fields. */
export function parseOrThrow<T extends z.ZodTypeAny>(schema: T, value: unknown): z.infer<T> {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => `${i.path.join('.') || 'body'}: ${i.message}`);
    throw new ApiProblem(400, 'BAD_REQUEST', details.join('; '));
  }
  return parsed.data;
}
