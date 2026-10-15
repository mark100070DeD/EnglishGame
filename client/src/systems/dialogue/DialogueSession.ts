import type { ChatRole, OfficeKind, SessionReport } from '@english-office/shared';
import type { DialogueGateway } from '../../api/dialogueApi';

/** "system" messages (errors, notices) are shown in the chat but never sent to the backend. */
export type ChatMessageRole = ChatRole | 'system';

export interface ChatMessage {
  readonly id: number;
  readonly role: ChatMessageRole;
  readonly text: string;
}

/**
 * idle → starting → active → finishing → finished.
 * A failed start returns to idle; a failed finish returns to active.
 */
export type DialoguePhase = 'idle' | 'starting' | 'active' | 'finishing' | 'finished';

export interface DialogueSessionState {
  readonly phase: DialoguePhase;
  readonly topic: string | null;
  readonly messages: readonly ChatMessage[];
  /** Waiting for the NPC's reply to a message. */
  readonly pending: boolean;
  readonly report: SessionReport | null;
}

export interface DialogueSessionOptions {
  officeKind: OfficeKind;
  npcId: string;
  npcName: string;
}

type Listener = (state: DialogueSessionState) => void;

/**
 * One conversation with one NPC as seen by the client. The server owns the transcript,
 * topic and rules; this class tracks UI state and talks to the gateway.
 */
export class DialogueSession {
  private state: DialogueSessionState = { phase: 'idle', topic: null, messages: [], pending: false, report: null };
  private readonly listeners = new Set<Listener>();
  private sessionId: string | null = null;
  private nextMessageId = 1;

  constructor(
    private readonly options: DialogueSessionOptions,
    private readonly gateway: DialogueGateway,
  ) {}

  getState(): DialogueSessionState {
    return this.state;
  }

  /** Calls the listener immediately with the current state. Returns an unsubscribe function. */
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  /** Starts the server session (picks the topic, gets the NPC's opening). No-op unless idle. */
  async start(): Promise<void> {
    if (this.state.phase !== 'idle') return;
    this.update({ phase: 'starting' });
    try {
      const { sessionId, topic, opening } = await this.gateway.startSession(this.options);
      this.sessionId = sessionId;
      this.update({ phase: 'active', topic });
      this.append(opening.role, opening.text);
    } catch (error) {
      this.update({ phase: 'idle' });
      this.append('system', errorText(error));
    }
  }

  async send(rawText: string): Promise<void> {
    const text = rawText.trim();
    if (!text || this.state.pending || this.state.phase !== 'active' || !this.sessionId) return;

    this.append('user', text);
    this.update({ pending: true });
    try {
      const { reply } = await this.gateway.sendMessage(this.sessionId, { message: text });
      this.append(reply.role, reply.text);
    } catch (error) {
      this.append('system', errorText(error));
    } finally {
      this.update({ pending: false });
    }
  }

  /** Ends the session and fetches the report. */
  async finish(): Promise<void> {
    if (this.state.phase !== 'active' || this.state.pending || !this.sessionId) return;
    this.update({ phase: 'finishing' });
    try {
      const { report } = await this.gateway.finishSession(this.sessionId);
      this.update({ phase: 'finished', report });
    } catch (error) {
      this.update({ phase: 'active' });
      this.append('system', errorText(error));
    }
  }

  private append(role: ChatMessageRole, text: string): void {
    this.update({ messages: [...this.state.messages, { id: this.nextMessageId++, role, text }] });
  }

  private update(patch: Partial<DialogueSessionState>): void {
    this.state = { ...this.state, ...patch };
    for (const listener of this.listeners) listener(this.state);
  }
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong';
}
