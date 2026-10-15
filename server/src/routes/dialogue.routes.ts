import {
  API_ROUTES,
  DIALOGUE_LIMITS,
  OFFICE_KINDS,
  type DialogueMessageRequest,
  type DialogueMessageResponse,
} from '@english-office/shared';
import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import type { DialogueProvider } from '../services/dialogue/DialogueProvider';
import { sendError } from './errors';

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'npc']),
  text: z.string().max(DIALOGUE_LIMITS.messageMaxLength * 2),
});

const MessageBodySchema = z.object({
  conversationId: z.string().min(1).max(100),
  officeKind: z.enum(OFFICE_KINDS),
  npcId: z.string().min(1).max(100),
  message: z.string().trim().min(1).max(DIALOGUE_LIMITS.messageMaxLength),
  history: z.array(ChatMessageSchema).max(DIALOGUE_LIMITS.historyMaxItems),
});

export interface DialogueRoutesOptions {
  provider: DialogueProvider;
}

export const dialogueRoutes: FastifyPluginAsync<DialogueRoutesOptions> = async (app, { provider }) => {
  app.post(API_ROUTES.dialogueMessage, async (request, reply) => {
    const parsed = MessageBodySchema.safeParse(request.body);
    if (!parsed.success) {
      const details = parsed.error.issues.map((i) => `${i.path.join('.') || 'body'}: ${i.message}`);
      return sendError(reply, 400, 'BAD_REQUEST', details.join('; '));
    }

    const body: DialogueMessageRequest = parsed.data;
    const text = await provider.generateReply(
      {
        conversationId: body.conversationId,
        officeKind: body.officeKind,
        npcId: body.npcId,
        history: body.history,
      },
      body.message,
    );

    const response: DialogueMessageResponse = { reply: { role: 'npc', text } };
    return response;
  });
};
