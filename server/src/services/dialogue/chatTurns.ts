import type { OfficeMode } from '../../offices/OfficeMode';
import type { ConversationContext } from './DialogueProvider';

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Conversation history in LLM terms. It always starts with the synthetic "learner entered"
 * instruction, so the history begins with a user turn and keeps a stable prefix.
 */
export function buildChatTurns(ctx: ConversationContext, mode: OfficeMode): ChatTurn[] {
  return [
    { role: 'user', content: mode.openingInstruction(ctx) },
    ...ctx.transcript.map(
      (entry): ChatTurn => ({ role: entry.role === 'user' ? 'user' : 'assistant', content: entry.text }),
    ),
  ];
}
