import type { ReportContent } from '@english-office/shared';
import type { OfficeMode } from '../../offices/OfficeMode';
import { findNativeLanguageFragments } from '../../reports/nativeLanguage';
import type { ConversationContext, DialogueProvider } from './DialogueProvider';

/**
 * Stub provider used when no LLM is configured: keeps the whole session → report pipeline
 * working end to end, without analysing the language.
 */
export class EchoDialogueProvider implements DialogueProvider {
  readonly name = 'echo';

  async openSession(ctx: ConversationContext): Promise<string> {
    return `Hi! I'm ${ctx.npcName}. Today's topic is "${ctx.topic}". [echo mode] Tell me something about it!`;
  }

  async reply(ctx: ConversationContext): Promise<string> {
    const last = [...ctx.transcript].reverse().find((e) => e.role === 'user')?.text ?? '';
    return `[echo · ${ctx.tenseFocus}] You said: "${last}". What else can you tell me about ${ctx.topic.toLowerCase()}?`;
  }

  async generateReport(ctx: ConversationContext, _mode: OfficeMode): Promise<ReportContent> {
    const playerLines = ctx.transcript.filter((e) => e.role === 'user').map((e) => e.text);
    const nativeWords = findNativeLanguageFragments(playerLines).map((original) => ({
      original,
      language: 'ru' as const,
      english: '(перевод появится, когда подключим языковую модель)',
    }));

    return {
      grammarMistakes: [],
      nativeWords,
      nativeWordsNote: '',
      tenseIssues: [],
      articleAndMinorMistakes: [],
      highlights: [...playerLines]
        .sort((a, b) => b.length - a.length)
        .slice(0, 3)
        .map((quote) => ({ quote, comment: 'Фраза из сессии (тестовый режим).' })),
      summary:
        'Это тестовый отчёт: языковая модель пока не подключена, поэтому ошибки не анализировались. Структура отчёта уже настоящая.',
      recommendations: ['Анализ ошибок и советы появятся, когда к серверу подключат языковую модель.'],
    };
  }
}
