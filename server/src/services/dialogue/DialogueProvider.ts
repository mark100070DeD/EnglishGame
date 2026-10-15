import type { ChatMessageDto, OfficeKind } from '@english-office/shared';

export interface DialogueContext {
  conversationId: string;
  officeKind: OfficeKind;
  npcId: string;
  history: readonly ChatMessageDto[];
}

/**
 * Produces NPC replies. Routes depend only on this interface,
 * so swapping the echo stub for a real LLM provider touches no HTTP code.
 */
export interface DialogueProvider {
  readonly name: string;
  generateReply(context: DialogueContext, userMessage: string): Promise<string>;
}
