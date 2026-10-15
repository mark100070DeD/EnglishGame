import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { SessionReport } from '@english-office/shared';

/**
 * Storage for finished reports. Notion, a database or any other destination
 * is added as another implementation of this interface.
 */
export interface ReportRepository {
  save(report: SessionReport): Promise<void>;
  get(id: string): Promise<SessionReport | null>;
}

const ID_PATTERN = /^[0-9a-f-]{36}$/i;

/** One JSON file per report. On hosts with an ephemeral disk the files disappear on restart/redeploy. */
export class FileReportRepository implements ReportRepository {
  constructor(private readonly directory: string) {}

  async save(report: SessionReport): Promise<void> {
    await mkdir(this.directory, { recursive: true });
    await writeFile(this.filePath(report.id), JSON.stringify(report, null, 2), 'utf8');
  }

  async get(id: string): Promise<SessionReport | null> {
    if (!ID_PATTERN.test(id)) return null;
    try {
      return JSON.parse(await readFile(this.filePath(id), 'utf8')) as SessionReport;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw error;
    }
  }

  private filePath(id: string): string {
    return path.join(this.directory, `${id}.json`);
  }
}
