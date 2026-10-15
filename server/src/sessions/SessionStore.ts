import type { OfficeKind, SessionReport } from '@english-office/shared';
import type { TranscriptEntry } from '../services/dialogue/DialogueProvider';

export interface DialogueSessionRecord {
  id: string;
  officeKind: OfficeKind;
  npcId: string;
  npcName: string;
  topic: string;
  level: string;
  tensePlan: string[];
  startedAt: Date;
  lastActivityAt: Date;
  transcript: TranscriptEntry[];
  /** A request for this session is being processed (prevents overlapping turns). */
  busy: boolean;
  report: SessionReport | null;
}

/**
 * In-memory session storage with idle expiry. Sessions live only as long as the process:
 * a restart ends conversations in progress (finished reports are kept by the ReportRepository).
 */
export class SessionStore {
  private readonly sessions = new Map<string, DialogueSessionRecord>();
  private readonly sweepTimer: NodeJS.Timeout;

  constructor(private readonly idleMs: number) {
    this.sweepTimer = setInterval(() => this.sweep(), Math.min(idleMs, 10 * 60_000));
    this.sweepTimer.unref();
  }

  add(session: DialogueSessionRecord): void {
    this.sessions.set(session.id, session);
  }

  get(id: string): DialogueSessionRecord | undefined {
    return this.sessions.get(id);
  }

  close(): void {
    clearInterval(this.sweepTimer);
  }

  private sweep(now = Date.now()): void {
    for (const [id, session] of this.sessions) {
      if (!session.busy && now - session.lastActivityAt.getTime() > this.idleMs) this.sessions.delete(id);
    }
  }
}
