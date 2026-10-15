import type { ReportContent } from '@english-office/shared';

const DEFAULT_ENGLISH_ONLY_NOTE =
  'Вы всю сессию говорили только по-английски — это большой шаг, так держать!';

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[‘’`]/g, "'")
    .replace(/[“”«»]/g, '"')
    .replace(/\s+/g, ' ')
    .replace(/[\s.,!?;:"]+$/g, '')
    .trim();
}

/**
 * Checks the generated report against what the player actually wrote:
 * - "what went well" quotes must exist verbatim in the player's lines (invented ones are dropped);
 * - mistakes labelled as coming from the session but not found there become training examples;
 * - the native-language section always gets a note.
 */
export function sanitizeReportContent(content: ReportContent, playerLines: readonly string[]): ReportContent {
  const corpus = playerLines.map(normalize);
  const saidByPlayer = (fragment: string) => {
    const needle = normalize(fragment);
    return needle.length > 0 && corpus.some((line) => line.includes(needle));
  };

  return {
    ...content,
    grammarMistakes: content.grammarMistakes.map((m) =>
      m.source === 'session' && !saidByPlayer(m.wrong) ? { ...m, source: 'practice' } : m,
    ),
    highlights: content.highlights.filter((h) => saidByPlayer(h.quote)),
    nativeWordsNote:
      content.nativeWordsNote.trim() || (content.nativeWords.length === 0 ? DEFAULT_ENGLISH_ONLY_NOTE : ''),
  };
}
