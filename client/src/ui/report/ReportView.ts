import {
  buildReportSections,
  paginateReport,
  reportToMarkdown,
  type ReportLine,
  type ReportPage,
  type SessionReport,
} from '@english-office/shared';
import { createElement } from '../dom';

/**
 * Post-session report, shown page by page (one page ≈ one printed page),
 * with a Markdown download that can be pasted straight into Notion.
 */
export class ReportView {
  readonly element = createElement('div', 'report');
  private readonly pages: ReportPage[];
  private readonly body = createElement('div', 'report__body');
  private readonly pager = createElement('div', 'report__pager');
  private pageIndex = 0;

  constructor(private readonly report: SessionReport) {
    this.pages = paginateReport(buildReportSections(report));
    this.element.append(this.buildHeader(), this.body, this.pager);
    this.renderPage();
  }

  private buildHeader(): HTMLElement {
    const { topic, npcName, durationMinutes, level } = this.report;
    const header = createElement('header', 'report__header');
    header.append(
      createElement('h3', 'report__title', `Отчёт: ${topic}`),
      createElement('p', 'report__meta', `${npcName} · ${durationMinutes} мин · уровень ${level}`),
    );

    const download = createElement('button', 'report__download', 'Скачать .md');
    download.type = 'button';
    download.addEventListener('click', () => this.downloadMarkdown());
    header.append(download);
    return header;
  }

  private renderPage(): void {
    const page = this.pages[this.pageIndex];
    if (!page) return;

    this.body.replaceChildren(
      ...page.sections.map((section) => {
        const block = createElement('section', 'report__section');
        block.append(createElement('h4', 'report__section-title', section.title + (section.continued ? ' (продолжение)' : '')));
        const list = createElement('ul', 'report__lines');
        list.append(...section.lines.map(renderLine));
        block.append(list);
        return block;
      }),
    );
    this.body.scrollTop = 0;
    this.renderPager();
  }

  private renderPager(): void {
    if (this.pages.length <= 1) {
      this.pager.replaceChildren();
      return;
    }
    const prev = createElement('button', 'report__page-btn', '←');
    const next = createElement('button', 'report__page-btn', '→');
    prev.type = next.type = 'button';
    prev.disabled = this.pageIndex === 0;
    next.disabled = this.pageIndex === this.pages.length - 1;
    prev.addEventListener('click', () => this.goTo(this.pageIndex - 1));
    next.addEventListener('click', () => this.goTo(this.pageIndex + 1));
    this.pager.replaceChildren(
      prev,
      createElement('span', 'report__page-label', `Часть ${this.pageIndex + 1} из ${this.pages.length}`),
      next,
    );
  }

  private goTo(index: number): void {
    this.pageIndex = Math.max(0, Math.min(this.pages.length - 1, index));
    this.renderPage();
  }

  private downloadMarkdown(): void {
    const blob = new Blob([reportToMarkdown(this.report)], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = createElement('a');
    link.href = url;
    link.download = `english-office-report-${this.report.finishedAt.slice(0, 10)}.md`;
    link.click();
    URL.revokeObjectURL(url);
  }
}

function renderLine(line: ReportLine): HTMLLIElement {
  const item = createElement('li', `report-line report-line--${line.kind}`);
  switch (line.kind) {
    case 'correction':
      item.append(
        createElement('span', 'report-line__wrong', line.wrong),
        createElement('span', 'report-line__arrow', '→'),
        createElement('span', 'report-line__correct', line.correct),
      );
      if (line.note) item.append(createElement('span', 'report-line__note', line.note));
      break;
    case 'quote':
      item.append(createElement('q', 'report-line__quote', line.text));
      if (line.comment) item.append(createElement('span', 'report-line__comment', line.comment));
      break;
    default:
      item.textContent = line.text;
  }
  return item;
}
