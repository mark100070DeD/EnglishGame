import type { ReportContent } from '@english-office/shared';
import type { OfficeMode } from '../../offices/OfficeMode';
import { REPORT_JSON_SCHEMA, ReportContentSchema } from '../../reports/reportContentSchema';
import { buildChatTurns } from './chatTurns';
import { DialogueRefusalError, type ConversationContext, type DialogueProvider } from './DialogueProvider';

export interface OpenAICompatibleOptions {
  /** Short provider label for logs and reports, e.g. "gemini". */
  label: string;
  /** Base URL ending before "/chat/completions", e.g. https://generativelanguage.googleapis.com/v1beta/openai */
  baseUrl: string;
  apiKey: string;
  model: string;
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatCompletionResponse {
  choices?: { message?: { content?: string | null }; finish_reason?: string }[];
  error?: { message?: string };
}

const REQUEST_TIMEOUT_MS = 120_000;

/**
 * Provider for any OpenAI-compatible Chat Completions API (Google Gemini, Groq, OpenRouter, ...).
 * Free tiers of these services make the game usable without a paid LLM account.
 */
export class OpenAICompatibleDialogueProvider implements DialogueProvider {
  readonly name: string;

  constructor(private readonly options: OpenAICompatibleOptions) {
    this.name = `${options.label}:${options.model}`;
  }

  openSession(ctx: ConversationContext, mode: OfficeMode): Promise<string> {
    return this.chat(ctx, mode);
  }

  reply(ctx: ConversationContext, mode: OfficeMode): Promise<string> {
    return this.chat(ctx, mode);
  }

  async generateReport(ctx: ConversationContext, mode: OfficeMode): Promise<ReportContent> {
    const messages: ChatMessage[] = [
      { role: 'system', content: mode.reportSystemPrompt(ctx) },
      { role: 'user', content: mode.reportInput(ctx) },
    ];
    const request = {
      max_tokens: 8000,
      reasoning_effort: 'medium',
      response_format: {
        type: 'json_schema',
        json_schema: { name: 'session_report', schema: REPORT_JSON_SCHEMA, strict: true },
      },
    };

    // Structured output is supported but not guaranteed on every compatible API: validate,
    // and give the model one chance to fix an invalid answer.
    const first = await this.complete(messages, request);
    const parsed = parseReport(first);
    if (parsed.success) return parsed.data;

    const retry = await this.complete(
      [
        ...messages,
        { role: 'assistant', content: first },
        { role: 'user', content: `That JSON does not match the required schema (${parsed.error}). Reply with the corrected JSON only.` },
      ],
      request,
    );
    const second = parseReport(retry);
    if (second.success) return second.data;
    throw new Error(`Report JSON is invalid after retry: ${second.error}`);
  }

  private chat(ctx: ConversationContext, mode: OfficeMode): Promise<string> {
    return this.complete(
      [{ role: 'system', content: mode.conversationSystemPrompt(ctx) }, ...buildChatTurns(ctx, mode)],
      // Chat turns are short; low reasoning keeps replies fast and within free-tier token limits.
      { max_tokens: 2000, reasoning_effort: 'low' },
    );
  }

  private async complete(messages: ChatMessage[], params: Record<string, unknown>): Promise<string> {
    const response = await fetch(`${this.options.baseUrl.replace(/\/+$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.options.apiKey}`,
      },
      body: JSON.stringify({ model: this.options.model, messages, ...params }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    const payload = (await response.json().catch(() => ({}))) as ChatCompletionResponse;
    if (!response.ok) {
      throw new Error(`${this.options.label} API ${response.status}: ${payload.error?.message ?? 'request failed'}`);
    }

    const choice = payload.choices?.[0];
    if (choice?.finish_reason === 'content_filter') throw new DialogueRefusalError();
    const text = choice?.message?.content?.trim();
    if (!text) throw new Error(`${this.options.label} returned an empty reply (finish_reason: ${choice?.finish_reason})`);
    return text;
  }
}

function parseReport(text: string): { success: true; data: ReportContent } | { success: false; error: string } {
  let json: unknown;
  try {
    // Some models wrap JSON in a ```json fence despite the response format.
    json = JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, ''));
  } catch {
    return { success: false, error: 'not valid JSON' };
  }
  const result = ReportContentSchema.safeParse(json);
  return result.success
    ? { success: true, data: result.data }
    : { success: false, error: result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ') };
}
