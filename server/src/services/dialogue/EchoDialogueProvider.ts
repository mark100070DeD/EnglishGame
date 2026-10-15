import type { DialogueContext, DialogueProvider } from './DialogueProvider';

/** Stub provider: repeats the user's message. Used until the LLM integration lands. */
export class EchoDialogueProvider implements DialogueProvider {
  readonly name = 'echo';

  async generateReply(context: DialogueContext, userMessage: string): Promise<string> {
    return `[echo · ${context.officeKind}] ${userMessage}`;
  }
}
