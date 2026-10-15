import { randomUUID } from 'node:crypto';
import {
  DIALOGUE_LIMITS,
  REPORT_SCHEMA_VERSION,
  type ChatRole,
  type SessionReport,
  type StartSessionRequest,
  type StartSessionResponse,
} from '@english-office/shared';
import type { FastifyBaseLogger } from 'fastify';
import type { OfficeMode } from '../offices/OfficeMode';
import { getOfficeMode } from '../offices/registry';
import type { ReportRepository } from '../reports/ReportRepository';
import { sanitizeReportContent } from '../reports/sanitizeReport';
import {
  DialogueRefusalError,
  type ConversationContext,
  type DialogueProvider,
  type TranscriptEntry,
} from '../services/dialogue/DialogueProvider';
import { ApiProblem } from './ApiProblem';
import type { DialogueSessionRecord, SessionStore } from './SessionStore';

export interface SessionServiceDeps {
  store: SessionStore;
  provider: DialogueProvider;
  reports: ReportRepository;
  log: FastifyBaseLogger;
}

/** Runs a conversation session: start, turns, and the report at the end. */
export class SessionService {
  constructor(private readonly deps: SessionServiceDeps) {}

  async start(request: StartSessionRequest): Promise<StartSessionResponse> {
    const mode = getOfficeMode(request.officeKind);
    if (!mode) throw new ApiProblem(400, 'OFFICE_NOT_AVAILABLE', `The "${request.officeKind}" office is not open yet`);

    const now = new Date();
    const session: DialogueSessionRecord = {
      id: randomUUID(),
      officeKind: request.officeKind,
      npcId: request.npcId,
      npcName: request.npcName,
      topic: mode.pickTopic(),
      level: mode.level,
      tensePlan: mode.createTensePlan(),
      startedAt: now,
      lastActivityAt: now,
      transcript: [],
      busy: false,
      report: null,
    };

    const opening = await this.runTurn(session, mode, null, (ctx) => this.deps.provider.openSession(ctx, mode));
    this.deps.store.add(session);
    return { sessionId: session.id, topic: session.topic, opening: { role: 'npc', text: opening } };
  }

  async send(sessionId: string, message: string): Promise<string> {
    const { session, mode } = this.requireSession(sessionId);
    if (session.report) throw new ApiProblem(409, 'SESSION_FINISHED', 'This session is already finished');
    if (playerTurns(session) >= DIALOGUE_LIMITS.maxPlayerTurns) {
      throw new ApiProblem(409, 'SESSION_LIMIT', 'This session is long enough — finish it to get your report');
    }
    return this.runTurn(session, mode, message, (ctx) => this.deps.provider.reply(ctx, mode));
  }

  async finish(sessionId: string): Promise<SessionReport> {
    const { session, mode } = this.requireSession(sessionId);
    if (session.report) return session.report;

    return this.exclusive(session, async () => {
      const finishedAt = new Date();
      const ctx = this.context(session, mode, session.transcript, finishedAt);
      const playerLines = session.transcript.filter((e) => e.role === 'user').map((e) => e.text);

      let content;
      try {
        content = await this.deps.provider.generateReport(ctx, mode);
      } catch (error) {
        this.deps.log.error({ err: error, sessionId }, 'Report generation failed');
        throw new ApiProblem(502, 'REPORT_FAILED', 'Could not prepare the report right now. Please try again.');
      }

      const report: SessionReport = {
        schemaVersion: REPORT_SCHEMA_VERSION,
        id: randomUUID(),
        sessionId: session.id,
        officeKind: session.officeKind,
        npcId: session.npcId,
        npcName: session.npcName,
        topic: session.topic,
        level: session.level,
        startedAt: session.startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
        durationMinutes: ctx.elapsedMinutes,
        playerTurns: ctx.playerTurns,
        generatedBy: this.deps.provider.name,
        content: sanitizeReportContent(content, playerLines),
      };

      await this.deps.reports.save(report);
      session.report = report;
      return report;
    });
  }

  /**
   * Produces the next NPC line. The transcript is only updated after the provider succeeds,
   * so a failed request can simply be retried.
   */
  private async runTurn(
    session: DialogueSessionRecord,
    mode: OfficeMode,
    playerMessage: string | null,
    produce: (ctx: ConversationContext) => Promise<string>,
  ): Promise<string> {
    return this.exclusive(session, async () => {
      const now = new Date();
      const pending: TranscriptEntry[] = playerMessage
        ? [...session.transcript, entry('user', playerMessage, now)]
        : session.transcript;
      const ctx = this.context(session, mode, pending, now);

      let line: string;
      try {
        line = await produce(ctx);
      } catch (error) {
        if (error instanceof DialogueRefusalError) {
          line = mode.fallbackLine(ctx);
        } else {
          this.deps.log.error({ err: error, sessionId: session.id }, 'Dialogue provider failed');
          throw new ApiProblem(502, 'NPC_UNAVAILABLE', `${session.npcName} can't answer right now. Please try again.`);
        }
      }

      session.transcript = [...pending, entry('npc', line, new Date())];
      return line;
    });
  }

  private context(
    session: DialogueSessionRecord,
    mode: OfficeMode,
    transcript: readonly TranscriptEntry[],
    now: Date,
  ): ConversationContext {
    const turns = transcript.filter((e) => e.role === 'user').length;
    return {
      sessionId: session.id,
      officeKind: session.officeKind,
      npcName: session.npcName,
      topic: session.topic,
      level: session.level,
      tenseFocus: mode.tenseFocusAt(session.tensePlan, turns),
      transcript,
      elapsedMinutes: Math.max(1, Math.round((now.getTime() - session.startedAt.getTime()) / 60_000)),
      playerTurns: turns,
    };
  }

  private requireSession(sessionId: string): { session: DialogueSessionRecord; mode: OfficeMode } {
    const session = this.deps.store.get(sessionId);
    const mode = session && getOfficeMode(session.officeKind);
    if (!session || !mode) {
      throw new ApiProblem(404, 'SESSION_NOT_FOUND', 'Session not found or expired. Start a new conversation.');
    }
    return { session, mode };
  }

  /** One request per session at a time; keeps the transcript consistent. */
  private async exclusive<T>(session: DialogueSessionRecord, task: () => Promise<T>): Promise<T> {
    if (session.busy) throw new ApiProblem(409, 'SESSION_BUSY', 'Please wait for the previous answer');
    session.busy = true;
    try {
      return await task();
    } finally {
      session.busy = false;
      session.lastActivityAt = new Date();
    }
  }
}

function entry(role: ChatRole, text: string, at: Date): TranscriptEntry {
  return { role, text, at: at.toISOString() };
}

function playerTurns(session: DialogueSessionRecord): number {
  return session.transcript.filter((e) => e.role === 'user').length;
}
