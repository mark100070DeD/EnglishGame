import type { ReportContent } from '@english-office/shared';
// The Anthropic SDK's structured-output helper works with the zod v4 API.
import { z } from 'zod/v4';

const Correction = z.object({ wrong: z.string(), correct: z.string() });

/** Shape the LLM must return for a report; mirrors ReportContent from the shared package. */
export const ReportContentSchema = z.object({
  grammarMistakes: z.array(Correction.extend({ source: z.enum(['session', 'practice']) })),
  nativeWords: z.array(z.object({ original: z.string(), language: z.enum(['ru', 'uk']), english: z.string() })),
  nativeWordsNote: z.string(),
  tenseIssues: z.array(z.object({ tense: z.string(), problem: z.string(), examples: z.array(Correction) })),
  articleAndMinorMistakes: z.array(Correction),
  highlights: z.array(z.object({ quote: z.string(), comment: z.string() })),
  summary: z.string(),
  recommendations: z.array(z.string()),
});

// Compile-time guard: the schema output must stay assignable to the shared type.
const _schemaMatchesContract: (value: z.infer<typeof ReportContentSchema>) => ReportContent = (value) => value;
void _schemaMatchesContract;
