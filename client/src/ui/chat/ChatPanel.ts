import { DIALOGUE_LIMITS } from '@english-office/shared';
import type { DialogueSession, DialogueSessionState } from '../../systems/dialogue/DialogueSession';
import { createElement } from '../dom';

export interface ChatPanelOptions {
  title: string;
  subtitle?: string;
  session: DialogueSession;
  /** Called when the user closes the panel (button or Esc). */
  onClose: () => void;
}

/**
 * Chat window bound to a DialogueSession. Contains no game or office-specific logic,
 * so every office type can reuse it.
 */
export class ChatPanel {
  private readonly root = createElement('section', 'chat-panel');
  private readonly log = createElement('ol', 'chat-panel__log');
  private readonly input = createElement('input', 'chat-panel__input');
  private readonly sendButton = createElement('button', 'chat-panel__send', 'Send');
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
    const { title, subtitle } = this.options;
    this.root.setAttribute('role', 'dialog');
    this.root.setAttribute('aria-label', `Chat with ${title}`);

    const heading = createElement('div', 'chat-panel__heading');
    heading.append(createElement('h2', 'chat-panel__title', title));
    if (subtitle) heading.append(createElement('p', 'chat-panel__subtitle', subtitle));

    const closeButton = createElement('button', 'chat-panel__close', '×');
    closeButton.type = 'button';
    closeButton.setAttribute('aria-label', 'Close chat');
    closeButton.addEventListener('click', () => this.close());

    const header = createElement('header', 'chat-panel__header');
    header.append(heading, closeButton);

    this.log.setAttribute('aria-live', 'polite');

    this.input.type = 'text';
    this.input.maxLength = DIALOGUE_LIMITS.messageMaxLength;
    this.input.placeholder = 'Type in English…';
    this.input.autocomplete = 'off';
    this.input.spellcheck = false;
    this.sendButton.type = 'submit';

    const form = createElement('form', 'chat-panel__form');
    form.append(this.input, this.sendButton);
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      void this.submit();
    });

    const hint = createElement('p', 'chat-panel__hint', 'Enter — send · Esc — close');

    this.root.append(header, this.log, form, hint);
    this.root.addEventListener('keydown', (event) => {
      // Keep keystrokes inside the chat away from any game-level listeners.
      event.stopPropagation();
      if (event.key === 'Escape') this.close();
    });
  }

  private async submit(): Promise<void> {
    const text = this.input.value;
    if (!text.trim() || this.options.session.getState().pending) return;
    this.input.value = '';
    await this.options.session.send(text);
    this.input.focus();
  }

  private render(state: DialogueSessionState): void {
    const items = state.messages.map((message) =>
      createElement('li', `chat-message chat-message--${message.role}`, message.text),
    );
    if (state.pending) items.push(createElement('li', 'chat-message chat-message--typing', '…'));

    this.log.replaceChildren(...items);
    this.log.scrollTop = this.log.scrollHeight;
    this.sendButton.disabled = state.pending;
  }
}
