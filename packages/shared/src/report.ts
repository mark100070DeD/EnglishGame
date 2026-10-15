/**
 * Post-session report: structured data is the source of truth. Every presentation
 * (in-game view, Markdown, a future Notion export) is rendered from it.
 */
import type { OfficeKind } from './dialogue';

export const REPORT_SCHEMA_VERSION = 1;

export type NativeLanguage = 'ru' | 'uk';

export interface Correction {
  wrong: string;
  correct: string;
}

export interface GrammarMistake extends Correction {
  /** "session" = taken from the player's own phrases, "practice" = an extra training example. */
  source: 'session' | 'practice';
}

export interface NativeWord {
  /** Word or phrase the player said in Russian or Ukrainian. */
  original: string;
  language: NativeLanguage;
  english: string;
}

export interface TenseIssue {
  tense: string;
  /** What exactly the player mixes up, in plain words. */
  problem: string;
  examples: Correction[];
}

export interface Highlight {
  /** The player's phrase, quoted verbatim. */
  quote: string;
  comment: string;
}

/** Report body, produced by the dialogue provider (LLM or stub). */
export interface ReportContent {
  grammarMistakes: GrammarMistake[];
  nativeWords: NativeWord[];
  /** Comment for the native-words section; a warm note when the player stayed in English. */
  nativeWordsNote: string;
  tenseIssues: TenseIssue[];
  articleAndMinorMistakes: Correction[];
  highlights: Highlight[];
  summary: string;
  recommendations: string[];
}

export interface SessionReport {
  schemaVersion: typeof REPORT_SCHEMA_VERSION;
  id: string;
  sessionId: string;
  officeKind: OfficeKind;
  npcId: string;
  npcName: string;
  topic: string;
  level: string;
  startedAt: string;
  finishedAt: string;
  durationMinutes: number;
  playerTurns: number;
  /** Which provider produced the content, e.g. "anthropic:claude-opus-5-5" or "echo". */
  generatedBy: string;
  content: ReportContent;
}
