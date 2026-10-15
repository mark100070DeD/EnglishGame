import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import type { ReportContent } from '@english-office/shared';
import type { OfficeMode } from '../../offices/OfficeMode';
import { ReportContentSchema } from '../../reports/reportContentSchema';
import { buildChatTurns } from './chatTurns';
import { DialogueRefusalError, type ConversationContext, type DialogueProvider } from './DialogueProvider';

/** Server-side fallback: if the model declines, the API retries on Anthropic's recommended model. */
const FALLBACK_BETA = 'server-side-fallback-2026-07-01';

export interface AnthropicProviderOptions {
  apiKey: string;
  model: string;
}

export class AnthropicDialogueProvider implements DialogueProvider {
  readonly name: string;
  private readonly client: Anthropic;

  constructor(private readonly options: AnthropicProviderOptions) {
    this.client = new Anthropic({ apiKey: options.apiKey });
    this.name = `anthropic:${options.model}`;
  }

  openSession(ctx: ConversationContext, mode: OfficeMode): Promise<string> {
    return this.chat(ctx, mode);
  }

  reply(ctx: ConversationContext, mode: OfficeMode): Promise<string> {
    return this.chat(ctx, mode);
  }

  async generateReport(ctx: ConversationContext, mode: OfficeMode): Promise<ReportContent> {
    const response = await this.client.beta.messages.parse({
      model: this.options.model,
      max_tokens: 16000,
      betas: [FALLBACK_BETA],
      fallbacks: 'default',
      // Careful analysis of the whole transcript is worth the extra thinking.
      output_config: { effort: 'high', format: betaZodOutputFormat(ReportContentSchema) },
      system: mode.reportSystemPrompt(ctx),
      messages: [{ role: 'user', content: mode.reportInput(ctx) }],
    });

    if (response.stop_reason === 'refusal') throw new DialogueRefusalError();
    if (!response.parsed_output) throw new Error(`Report output could not be parsed (stop_reason: ${response.stop_reason})`);
    return response.parsed_output;
  }

  private async chat(ctx: ConversationContext, mode: OfficeMode): Promise<string> {
    const response = await this.client.beta.messages.create({
      model: this.options.model,
      max_tokens: 4000,
      betas: [FALLBACK_BETA],
      fallbacks: 'default',
      // Chat turns are short; low effort keeps replies fast.
      output_config: { effort: 'low' },
      system: mode.conversationSystemPrompt(ctx),
      messages: buildChatTurns(ctx, mode),
    });

    if (response.stop_reason === 'refusal') throw new DialogueRefusalError();
    const text = response.content
      .flatMap((block) => (block.type === 'text' ? [block.text] : []))
      .join('')
      .trim();
    if (!text) throw new Error(`Empty reply from the model (stop_reason: ${response.stop_reason})`);
    return text;
  }
}
