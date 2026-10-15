/**
 * Turns a SessionReport into renderer-agnostic sections and splits them into
 * "printed pages" (~one A4 page each). The in-game view and the Markdown export
 * both render these pages, so they always agree on content and page breaks.
 */
import type { Correction, SessionReport } from './report';

export type ReportLine =
  | { kind: 'correction'; wrong: string; correct: string; note?: string }
  | { kind: 'quote'; text: string; comment: string }
  | { kind: 'bullet'; text: string }
  | { kind: 'text'; text: string }
  | { kind: 'subheading'; text: string };

export interface ReportSection {
  id: string;
  title: string;
  lines: ReportLine[];
}

export interface ReportPageSection extends ReportSection {
  /** True when the section started on a previous page. */
  continued: boolean;
}

export interface ReportPage {
  number: number;
  total: number;
  sections: ReportPageSection[];
}

/** Roughly one A4 page of body text at ~80 characters per line. */
const PAGE_LINE_BUDGET = 46;
const CHARS_PER_LINE = 80;
const SECTION_HEADER_COST = 2;
const PAGE_HEADER_COST = 4;

export function buildReportSections(report: SessionReport): ReportSection[] {
  const c = report.content;
  const corrections = (items: readonly Correction[]): ReportLine[] =>
    items.map(({ wrong, correct }) => ({ kind: 'correction', wrong, correct }));

  const fromSession = c.grammarMistakes.filter((m) => m.source === 'session');
  const practice = c.grammarMistakes.filter((m) => m.source === 'practice');
  const grammar: ReportLine[] = [...corrections(fromSession)];
  if (practice.length > 0) {
    grammar.push({ kind: 'subheading', text: 'Для тренировки' }, ...corrections(practice));
  }
  if (grammar.length === 0) grammar.push({ kind: 'text', text: 'Грамматических ошибок не найдено — так держать!' });

  const native: ReportLine[] = c.nativeWords.map((w) => ({
    kind: 'correction',
    wrong: w.original,
    correct: w.english,
    note: w.language === 'uk' ? 'укр.' : 'рус.',
  }));
  if (c.nativeWordsNote) native.push({ kind: 'text', text: c.nativeWordsNote });

  const tenses: ReportLine[] = c.tenseIssues.flatMap((issue) => [
    { kind: 'subheading', text: issue.tense } as const,
    { kind: 'text', text: issue.problem } as const,
    ...corrections(issue.examples),
  ]);
  if (tenses.length === 0) tenses.push({ kind: 'text', text: 'Времена использованы верно.' });

  const minor = corrections(c.articleAndMinorMistakes);
  if (minor.length === 0) minor.push({ kind: 'text', text: 'Ошибок с артиклями не найдено.' });

  const highlights: ReportLine[] = c.highlights.map((h) => ({ kind: 'quote', text: h.quote, comment: h.comment }));

  return [
    { id: 'grammar', title: '1. Грамматические ошибки', lines: grammar },
    { id: 'native', title: '2. Слова на русском и украинском', lines: native },
    { id: 'tenses', title: '3. Ошибки во временах', lines: tenses },
    { id: 'minor', title: '4. Артикли и мелкие ошибки', lines: minor },
    { id: 'highlights', title: '5. Что получилось хорошо', lines: highlights },
    { id: 'summary', title: 'Итог', lines: [{ kind: 'text', text: c.summary }] },
    {
      id: 'recommendations',
      title: 'Как подготовиться к следующей сессии',
      lines: c.recommendations.map((text) => ({ kind: 'bullet', text })),
    },
  ].filter((section) => section.lines.length > 0) as ReportSection[];
}

/** Packs sections into pages; a section that does not fit continues on the next page. */
export function paginateReport(sections: readonly ReportSection[]): ReportPage[] {
  const pages: ReportPageSection[][] = [[]];
  let used = PAGE_HEADER_COST;

  const current = () => pages[pages.length - 1]!;
  const newPage = () => {
    pages.push([]);
    used = PAGE_HEADER_COST;
  };

  for (const section of sections) {
    let part: ReportPageSection | null = null;

    for (const line of section.lines) {
      const cost = lineCost(line) + (part ? 0 : SECTION_HEADER_COST);
      if (used + cost > PAGE_LINE_BUDGET && current().length > 0) {
        newPage();
        part = null;
      }
      if (!part) {
        part = { ...section, lines: [], continued: section.lines.indexOf(line) > 0 };
        current().push(part);
        used += SECTION_HEADER_COST;
      }
      part.lines.push(line);
      used += lineCost(line);
    }
  }

  return pages.map((sectionsOnPage, i) => ({ number: i + 1, total: pages.length, sections: sectionsOnPage }));
}

export function reportToMarkdown(report: SessionReport): string {
  const pages = paginateReport(buildReportSections(report));
  const date = report.finishedAt.slice(0, 10);

  return pages
    .map((page) => {
      const header = [
        `# Отчёт по сессии — ${report.topic}`,
        `${date} · ${report.npcName} · ${report.durationMinutes} мин · уровень ${report.level}` +
          (page.total > 1 ? ` · часть ${page.number} из ${page.total}` : ''),
        '',
      ];
      const body = page.sections.flatMap((section) => [
        `## ${section.title}${section.continued ? ' (продолжение)' : ''}`,
        '',
        ...section.lines.map(lineToMarkdown),
        '',
      ]);
      return [...header, ...body].join('\n').replace(/\n{3,}/g, '\n\n').trimEnd();
    })
    .join('\n\n---\n\n');
}

function lineToMarkdown(line: ReportLine): string {
  switch (line.kind) {
    case 'correction':
      return `- ~~${line.wrong}~~ → **${line.correct}**${line.note ? ` _(${line.note})_` : ''}`;
    case 'quote':
      return `- «${line.text}»${line.comment ? ` — ${line.comment}` : ''}`;
    case 'bullet':
      return `- ${line.text}`;
    // A blank line before plain blocks keeps them from merging into a preceding list item.
    case 'subheading':
      return `\n**${line.text}**\n`;
    case 'text':
      return `\n${line.text}\n`;
  }
}

function lineCost(line: ReportLine): number {
  const text =
    line.kind === 'correction'
      ? `${line.wrong} → ${line.correct}`
      : line.kind === 'quote'
        ? `${line.text} — ${line.comment}`
        : line.text;
  return Math.max(1, Math.ceil(text.length / CHARS_PER_LINE));
}
