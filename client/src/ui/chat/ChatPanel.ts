import { DIALOGUE_LIMITS } from '@english-office/shared';
import type { DialogueSession, DialogueSessionState } from '../../systems/dialogue/DialogueSession';
import { createElement } from '../dom';
import { ReportView } from '../report/ReportView';

export interface ChatPanelOptions {
  title: string;
  subtitle?: string;
  session: DialogueSession;
  /** Called when the user closes the panel (button or Esc). */
  onClose: () => void;
}

/**
 * Chat window bound to a DialogueSession: message log, input, "finish session" and,
 * once finished, the report. Contains no office-specific logic, so every office can reuse it.
 */
export class ChatPanel {
  private readonly root = createElement('section', 'chat-panel');
  private readonly subtitle = createElement('p', 'chat-panel__subtitle');
  private readonly finishButton = createElement('button', 'chat-panel__finish', 'Завершить сессию');
  private readonly log = createElement('ol', 'chat-panel__log');
  private readonly form = createElement('form', 'chat-panel__form');
  private readonly input = createElement('input', 'chat-panel__input');
  private readonly sendButton = createElement('button', 'chat-panel__send', 'Send');
  private readonly hint = createElement('p', 'chat-panel__hint', 'Enter — send · Esc — close');
  private reportView: ReportView | null = null;
  private unsubscribe: (() => void) | null = null;

  constructor(
    private readonly container: HTMLElement,
    private readonly options: ChatPanelOptions,
  ) {
    this.build();
  }

  open(): void {
    if (this.unsubscribe) return;
    this.container.append(this.root);
    this.unsubscribe = this.options.session.subscribe((state) => this.render(state));
    this.input.focus();
  }

  /** User-initiated close: removes the panel and notifies the owner. */
  close(): void {
    if (!this.unsubscribe) return;
    this.destroy();
    this.options.onClose();
  }

  /** Removes the panel without notifying the owner (e.g. on scene shutdown). */
  destroy(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.root.remove();
  }

  private build(): void {
    const { title } = this.options;
    this.root.setAttribute('role', 'dialog');
    this.root.setAttribute('aria-label', `Chat with ${title}`);

    const heading = createElement('div', 'chat-panel__heading');
    heading.append(createElement('h2', 'chat-panel__title', title), this.subtitle);

    this.finishButton.type = 'button';
    this.finishButton.addEventListener('click', () => {
      if (window.confirm('Завершить сессию и получить отчёт?')) void this.options.session.finish();
    });

    const closeButton = createElement('button', 'chat-panel__close', '×');
    closeButton.type = 'button';
    closeButton.setAttribute('aria-label', 'Close chat');
    closeButton.addEventListener('click', () => this.close());

    const actions = createElement('div', 'chat-panel__actions');
    actions.append(this.finishButton, closeButton);

    const header = createElement('header', 'chat-panel__header');
    header.append(heading, actions);

    this.log.setAttribute('aria-live', 'polite');

    this.input.type = 'text';
    this.input.maxLength = DIALOGUE_LIMITS.messageMaxLength;
    this.input.placeholder = 'Type in English…';
    this.input.autocomplete = 'off';
    this.input.spellcheck = false;
    this.sendButton.type = 'submit';

    this.form.append(this.input, this.sendButton);
    this.form.addEventListener('submit', (event) => {
      event.preventDefault();
      void this.submit();
    });

    this.root.append(header, this.log, this.form, this.hint);
    this.root.addEventListener('keydown', (event) => {
      // Keep keystrokes inside the chat away from any game-level listeners.
      event.stopPropagation();
      if (event.key === 'Escape') this.close();
    });
  }

  private async submit(): Promise<void> {
    const text = this.input.value;
    const state = this.options.session.getState();
    if (!text.trim() || state.pending || state.phase !== 'active') return;
    this.input.value = '';
    await this.options.session.send(text);
    this.input.focus();
  }

  private render(state: DialogueSessionState): void {
    const base = this.options.subtitle ?? '';
    this.subtitle.textContent = state.topic ? `${base}${base ? ' · ' : ''}Topic: ${state.topic}` : base;

    if (state.phase === 'finished' && state.report) {
      this.showReport(state);
      return;
    }

    const items = state.messages.map((message) =>
      createElement('li', `chat-message chat-message--${message.role}`, message.text),
    );
    const waitingText =
      state.phase === 'starting' ? '…' : state.phase === 'finishing' ? 'Готовлю отчёт…' : state.pending ? '…' : null;
    if (waitingText) items.push(createElement('li', 'chat-message chat-message--typing', waitingText));

    this.log.replaceChildren(...items);
    this.log.scrollTop = this.log.scrollHeight;

    const canTalk = state.phase === 'active';
    this.sendButton.disabled = !canTalk || state.pending;
    this.input.disabled = !canTalk;
    this.finishButton.disabled = !canTalk || state.pending;
    // At least one player message is needed for a meaningful report.
    this.finishButton.hidden = !state.messages.some((m) => m.role === 'user');
  }

  private showReport(state: DialogueSessionState): void {
    if (this.reportView || !state.report) return;
    this.reportView = new ReportView(state.report);
    this.root.classList.add('chat-panel--report');
    this.finishButton.hidden = true;
    this.log.replaceWith(this.reportView.element);
    this.form.remove();
    this.hint.textContent = 'Esc — close';
  }
}
