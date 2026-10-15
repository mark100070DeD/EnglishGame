import type { ChatRole, OfficeKind, ReportContent } from '@english-office/shared';
import type { OfficeMode } from '../../offices/OfficeMode';

export interface TranscriptEntry {
  role: ChatRole;
  text: string;
  at: string;
}

/** Everything a provider needs to produce the next NPC line or the report. */
export interface ConversationContext {
  sessionId: string;
  officeKind: OfficeKind;
  npcName: string;
  topic: string;
  level: string;
  /** Grammar tense the conversation should currently steer towards. */
  tenseFocus: string;
  transcript: readonly TranscriptEntry[];
  elapsedMinutes: number;
  playerTurns: number;
}

/**
 * Produces NPC lines and post-session reports. Office-specific behaviour (rules, prompts)
 * comes from the OfficeMode; the provider only knows how to run it on a backend (LLM or stub).
 */
export interface DialogueProvider {
  readonly name: string;
  openSession(context: ConversationContext, mode: OfficeMode): Promise<string>;
  reply(context: ConversationContext, mode: OfficeMode): Promise<string>;
  generateReport(context: ConversationContext, mode: OfficeMode): Promise<ReportContent>;
}

/** The model declined to answer (safety classifier). Callers replace the line with a neutral one. */
export class DialogueRefusalError extends Error {
  constructor() {
    super('The model declined to respond');
    this.name = 'DialogueRefusalError';
  }
}
