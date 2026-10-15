import type { ApiErrorResponse } from '@english-office/shared';
import type { FastifyReply } from 'fastify';

export function sendError(reply: FastifyReply, status: number, code: string, message: string) {
  const body: ApiErrorResponse = { error: { code, message } };
  return reply.status(status).send(body);
}
