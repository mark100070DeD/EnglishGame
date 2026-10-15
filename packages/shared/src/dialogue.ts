/**
 * Contract between the game client and the backend dialogue API.
 * Both sides import these types, so a change here is checked on both ends.
 */

/** Office kinds. The backend will pick LLM behaviour (prompt, rules) per kind. */
export const OFFICE_KINDS = ['speaking', 'writing', 'error-review', 'support'] as const;
export type OfficeKind = (typeof OFFICE_KINDS)[number];

export type ChatRole = 'user' | 'npc';

export interface ChatMessageDto {
  role: ChatRole;
  text: string;
}

export interface DialogueMessageRequest {
  /** Client-generated id of one conversation with one NPC. */
  conversationId: string;
  officeKind: OfficeKind;
  npcId: string;
  message: string;
  /** Previous messages of the conversation, oldest first, excluding `message`. */
  history: ChatMessageDto[];
}

export interface DialogueMessageResponse {
  reply: ChatMessageDto;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

export const DIALOGUE_LIMITS = {
  messageMaxLength: 2000,
  historyMaxItems: 50,
} as const;

export const API_ROUTES = {
  /** Lightweight liveness probe (Render health check, uptime monitors). */
  health: '/health',
  dialogueMessage: '/api/dialogue/message',
} as const;
