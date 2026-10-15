import type { ChatMessageDto, ChatRole, OfficeKind } from '@english-office/shared';
import type { DialogueGateway } from '../../api/dialogueApi';

/** "system" messages (errors, notices) are shown in the chat but never sent to the backend. */
export type ChatMessageRole = ChatRole | 'system';

export interface ChatMessage {
  readonly id: number;
  readonly role: ChatMessageRole;
  readonly text: string;
}

export interface DialogueSessionState {
  readonly messages: readonly ChatMessage[];
  readonly pending: boolean;
}

export interface DialogueSessionOptions {
  officeKind: OfficeKind;
  npcId: string;
  greeting?: string;
}

type Listener = (state: DialogueSessionState) => void;

/**
 * One conversation with one NPC: message history, request state and backend calls.
 * UI-agnostic — views subscribe to state changes and call send().
 */
export class DialogueSession {
  private state: DialogueSessionState = { messages: [], pending: false };
  private readonly listeners = new Set<Listener>();
  private readonly conversationId = crypto.randomUUID();
  private nextMessageId = 1;

  constructor(
    private readonly options: DialogueSessionOptions,
    private readonly gateway: DialogueGateway,
  ) {
    if (options.greeting) this.append('npc', options.greeting);
  }

  getState(): DialogueSessionState {
    return this.state;
  }

  /** Calls the listener immediately with the current state. Returns an unsubscribe function. */
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  async send(rawText: string): Promise<void> {
    const text = rawText.trim();
    if (!text || this.state.pending) return;

    const history = this.toHistory();
    this.append('user', text);
    this.update({ pending: true });

    try {
      const response = await this.gateway.sendMessage({
        conversationId: this.conversationId,
        officeKind: this.options.officeKind,
        npcId: this.options.npcId,
        message: text,
        history,
      });
      this.append(response.reply.role, response.reply.text);
    } catch (error) {
      this.append('system', error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      this.update({ pending: false });
    }
  }

  private toHistory(): ChatMessageDto[] {
    return this.state.messages
      .filter((m): m is ChatMessage & { role: ChatRole } => m.role !== 'system')
      .map(({ role, text }) => ({ role, text }));
  }

  private append(role: ChatMessageRole, text: string): void {
    this.update({ messages: [...this.state.messages, { id: this.nextMessageId++, role, text }] });
  }

  private update(patch: Partial<DialogueSessionState>): void {
    this.state = { ...this.state, ...patch };
    for (const listener of this.listeners) listener(this.state);
  }
}
