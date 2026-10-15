import type { OfficeKind } from '@english-office/shared';
import type { ConversationContext } from '../services/dialogue/DialogueProvider';

/**
 * Behaviour of one office kind: session setup (topic, tense plan) and the prompts that
 * encode its rules. Adding an office kind = adding one OfficeMode to the registry.
 */
export interface OfficeMode {
  readonly kind: OfficeKind;
  readonly level: string;
  pickTopic(): string;
  /** Ordered tenses the session moves through. */
  createTensePlan(): string[];
  /** Tense to focus on after the given number of player turns. */
  tenseFocusAt(plan: readonly string[], playerTurns: number): string;

  conversationSystemPrompt(context: ConversationContext): string;
  /** Synthetic first user turn that asks the NPC to open the session. */
  openingInstruction(context: ConversationContext): string;
  /** Line used when the model declines to answer. */
  fallbackLine(context: ConversationContext): string;

  reportSystemPrompt(context: ConversationContext): string;
  reportInput(context: ConversationContext): string;
}
