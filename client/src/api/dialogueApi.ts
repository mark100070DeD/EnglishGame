import {
  API_ROUTES,
  type DialogueMessageRequest,
  type DialogueMessageResponse,
} from '@english-office/shared';
import { postJson } from './httpClient';

/** Transport for dialogue messages. Game systems depend on this, not on fetch. */
export interface DialogueGateway {
  sendMessage(request: DialogueMessageRequest): Promise<DialogueMessageResponse>;
}

export const httpDialogueGateway: DialogueGateway = {
  sendMessage: (request) => postJson<DialogueMessageResponse>(API_ROUTES.dialogueMessage, request),
};
