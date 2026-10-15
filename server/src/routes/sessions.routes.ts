import {
  API_ROUTES,
  DIALOGUE_LIMITS,
  OFFICE_KINDS,
  type FinishSessionResponse,
  type SendMessageResponse,
  type StartSessionRequest,
} from '@english-office/shared';
import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import type { SessionService } from '../sessions/SessionService';
import { parseOrThrow } from './validation';

const StartBodySchema = z.object({
  officeKind: z.enum(OFFICE_KINDS),
  npcId: z.string().min(1).max(100),
  npcName: z.string().trim().min(1).max(60),
});

const MessageBodySchema = z.object({
  message: z.string().trim().min(1).max(DIALOGUE_LIMITS.messageMaxLength),
});

const SessionParamsSchema = z.object({ sessionId: z.string().uuid() });

export interface SessionRoutesOptions {
  sessions: SessionService;
}

export const sessionRoutes: FastifyPluginAsync<SessionRoutesOptions> = async (app, { sessions }) => {
  app.post(API_ROUTES.sessions, async (request) => {
    const body: StartSessionRequest = parseOrThrow(StartBodySchema, request.body);
    return sessions.start(body);
  });

  app.post(API_ROUTES.sessionMessages, async (request): Promise<SendMessageResponse> => {
    const { sessionId } = parseOrThrow(SessionParamsSchema, request.params);
    const { message } = parseOrThrow(MessageBodySchema, request.body);
    const text = await sessions.send(sessionId, message);
    return { reply: { role: 'npc', text } };
  });

  app.post(API_ROUTES.sessionFinish, async (request): Promise<FinishSessionResponse> => {
    const { sessionId } = parseOrThrow(SessionParamsSchema, request.params);
    return { report: await sessions.finish(sessionId) };
  });
};
