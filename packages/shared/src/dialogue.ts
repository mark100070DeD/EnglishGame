/**
 * Contract between the game client and the backend dialogue API.
 * Both sides import these types, so a change here is checked on both ends.
 */
import type { SessionReport } from './report';

/** Office kinds. The backend picks LLM behaviour (rules, prompts, report) per kind. */
export const OFFICE_KINDS = ['speaking', 'writing', 'error-review', 'support'] as const;
export type OfficeKind = (typeof OFFICE_KINDS)[number];

export type ChatRole = 'user' | 'npc';

export interface ChatMessageDto {
  role: ChatRole;
  text: string;
}

export interface StartSessionRequest {
  officeKind: OfficeKind;
  npcId: string;
  /** Display name the NPC introduces itself with. */
  npcName: string;
}

export interface StartSessionResponse {
  sessionId: string;
  /** The single topic of this session. */
  topic: string;
  /** First NPC line: greeting + topic + first question. */
  opening: ChatMessageDto;
}

export interface SendMessageRequest {
  message: string;
}

export interface SendMessageResponse {
  reply: ChatMessageDto;
}

export interface FinishSessionResponse {
  report: SessionReport;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

export const DIALOGUE_LIMITS = {
  messageMaxLength: 1000,
  /** Hard stop for one session (a 30-minute talk is far below this). */
  maxPlayerTurns: 120,
} as const;

/** Route patterns; `:name` segments are filled with apiPath(). */
export const API_ROUTES = {
  health: '/health',
  sessions: '/api/sessions',
  sessionMessages: '/api/sessions/:sessionId/messages',
  sessionFinish: '/api/sessions/:sessionId/finish',
  report: '/api/reports/:reportId',
  reportMarkdown: '/api/reports/:reportId/markdown',
} as const;

export function apiPath(route: string, params: Readonly<Record<string, string>>): string {
  return route.replace(/:([a-zA-Z]+)/g, (_, name: string) => {
    const value = params[name];
    if (value === undefined) throw new Error(`Missing route param "${name}" for ${route}`);
    return encodeURIComponent(value);
  });
}
