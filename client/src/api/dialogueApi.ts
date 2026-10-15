import {
  API_ROUTES,
  apiPath,
  type FinishSessionResponse,
  type SendMessageRequest,
  type SendMessageResponse,
  type StartSessionRequest,
  type StartSessionResponse,
} from '@english-office/shared';
import { postJson } from './httpClient';

/** Transport for conversation sessions. Game systems depend on this, not on fetch. */
export interface DialogueGateway {
  startSession(request: StartSessionRequest): Promise<StartSessionResponse>;
  sendMessage(sessionId: string, request: SendMessageRequest): Promise<SendMessageResponse>;
  finishSession(sessionId: string): Promise<FinishSessionResponse>;
}

export const httpDialogueGateway: DialogueGateway = {
  startSession: (request) => postJson(API_ROUTES.sessions, request),
  sendMessage: (sessionId, request) => postJson(apiPath(API_ROUTES.sessionMessages, { sessionId }), request),
  finishSession: (sessionId) => postJson(apiPath(API_ROUTES.sessionFinish, { sessionId })),
};
