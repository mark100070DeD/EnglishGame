import { API_ROUTES, reportToMarkdown } from '@english-office/shared';
import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import type { ReportRepository } from '../reports/ReportRepository';
import { ApiProblem } from '../sessions/ApiProblem';
import { parseOrThrow } from './validation';

const ReportParamsSchema = z.object({ reportId: z.string().uuid() });

export interface ReportRoutesOptions {
  reports: ReportRepository;
}

export const reportRoutes: FastifyPluginAsync<ReportRoutesOptions> = async (app, { reports }) => {
  const load = async (params: unknown) => {
    const { reportId } = parseOrThrow(ReportParamsSchema, params);
    const report = await reports.get(reportId);
    if (!report) throw new ApiProblem(404, 'REPORT_NOT_FOUND', 'Report not found');
    return report;
  };

  app.get(API_ROUTES.report, async (request) => load(request.params));

  app.get(API_ROUTES.reportMarkdown, async (request, reply) => {
    const report = await load(request.params);
    return reply.type('text/markdown; charset=utf-8').send(reportToMarkdown(report));
  });
};
