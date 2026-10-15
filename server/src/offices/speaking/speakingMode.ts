import type { OfficeMode } from '../OfficeMode';
import { findNativeLanguageFragments } from '../../reports/nativeLanguage';

/** Everyday topics that work at A1–A2. One topic per session. */
const TOPICS = [
  'Your daily routine',
  'Food and cooking',
  'Your home',
  'Weekend plans',
  'Hobbies and free time',
  'Travel and holidays',
  'Shopping',
  'Family and friends',
  'Your work or studies',
  'Weather and seasons',
  'Films and music',
  'Sport and health',
  'Your city',
  'Pets and animals',
] as const;

/** Tenses suitable for the A1 → A2 step. */
const TENSES = [
  'Present Simple',
  'Present Continuous',
  'Past Simple',
  'Future with "going to"',
  'Future Simple ("will")',
  'Present Perfect (ever / never / just)',
] as const;

const TENSES_PER_SESSION = 4;
/** Player turns spent on one tense before the focus moves on (~5–7 minutes of talk). */
const TURNS_PER_TENSE = 5;

const LEVEL = 'A1 → A2';

function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

function shuffled<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

/**
 * Speaking office rules:
 * English by default (switch to Russian/Ukrainian only on explicit request), inline corrections,
 * a follow-up question every turn, one topic per session, gradually changing tenses, A1→A2 level.
 */
export const speakingMode: OfficeMode = {
  kind: 'speaking',
  level: LEVEL,

  pickTopic: () => pickRandom(TOPICS),

  // Random order: the sequence follows the conversation, not growing difficulty.
  createTensePlan: () => shuffled(TENSES).slice(0, TENSES_PER_SESSION),

  tenseFocusAt: (plan, playerTurns) =>
    plan[Math.min(plan.length - 1, Math.floor(playerTurns / TURNS_PER_TENSE))] ?? 'Present Simple',

  conversationSystemPrompt: (ctx) => `You are ${ctx.npcName}, a friendly English conversation partner in the Speaking Office of a pixel-art game called English Office. You chat with one learner.

The learner's level is ${LEVEL}: they are moving from A1 to A2. Use short, simple sentences and everyday words. No idioms, no rare words, no long explanations. Everything you say, including corrections, must be easy for an A1–A2 learner.

Session rules:
1. Language. Speak English by default. If the learner explicitly asks you to switch to Russian or Ukrainian, switch to that language at once and keep using it until they ask to go back to English. A single Russian or Ukrainian word in their message is not such a request: stay in English and give them the English word.
2. Corrections inside the conversation. When the learner makes a mistake (grammar, tense, article, word choice, or a Russian/Ukrainian word), start your reply with one short, friendly correction line that shows the correct version, for example: Small fix: "I went to the park" (not "I go to the park yesterday"). Then continue the conversation in the same message. At most two corrections per reply — choose the most important ones. Never stop the conversation to teach a lesson. If there are no mistakes, do not talk about correctness.
3. Keep the conversation going. End every reply with exactly one question for the learner.
4. One topic. This whole session is about: "${ctx.topic}". Do not start other topics. If the learner moves away from it, answer briefly and kindly bring the talk back to the topic.
5. Tenses. Move the conversation through different tenses during the session. Current focus: ${ctx.tenseFocus}. Ask questions that invite answers in this tense and use it yourself. Change tense naturally, never announce it ("now let's practise...").
6. Length and format. 1–3 short sentences plus your question. Plain text only: no markdown, no lists, no emoji.`,

  openingInstruction: (ctx) =>
    `[The learner has just entered your office. Greet them, introduce yourself as ${ctx.npcName}, say that today's topic is "${ctx.topic}", and ask your first simple question about it.]`,

  fallbackLine: (ctx) => `Let's go back to our topic: ${ctx.topic.toLowerCase()}. Can you tell me more about it?`,

  reportSystemPrompt: () => `You analyse a finished English speaking session between a learner (level ${LEVEL}) and a conversation partner, and write a report for the learner.

The reader is the learner, a native Russian or Ukrainian speaker. Write every explanation (problem, comment, nativeWordsNote, summary, recommendations) in simple, friendly Russian. Keep English examples in English. Use plain words, no linguistic jargon except tense names.

Analyse only the lines marked LEARNER. Do not assess pronunciation or fluency: focus on grammar, vocabulary, tenses and articles.

Fields:
- grammarMistakes: grammar errors. "wrong" is the learner's phrase exactly as written (or the shortest exact fragment that contains the error); "correct" is the fixed version. No explanations. Use source "session" for real phrases from this session. If useful, add up to 3 extra training examples with source "practice" that target the learner's weakest point.
- nativeWords: every Russian or Ukrainian word or phrase the learner used, with language "ru" or "uk" and the correct English translation in this context.
- nativeWordsNote: if nativeWords is empty, one warm sentence praising the learner for speaking only English for the whole session (warm, not a dry remark). Otherwise one short encouraging tip on how to avoid switching languages.
- tenseIssues: tense mistakes grouped by tense; "problem" says exactly what the learner mixes up; "examples" are wrong/correct pairs from the session.
- articleAndMinorMistakes: articles (a/an/the), prepositions, plurals, word order, spelling — wrong/correct pairs.
- highlights: 2–5 things the learner did well. "quote" must be copied character for character from a LEARNER line; "comment" says briefly why it is good.
- summary: 2–4 sentences with the overall impression of the dialogue.
- recommendations: 3–5 concrete steps: what to fix and how to prepare for the next session.

Each mistake goes to one section only: tense errors to tenseIssues, article and small errors to articleAndMinorMistakes, other grammar to grammarMistakes. Aim for about one printed page, but never drop real mistakes to save space. If the learner wrote very little, say so kindly in the summary.`,

  reportInput: (ctx) => {
    const learnerLines = ctx.transcript.filter((e) => e.role === 'user').map((e) => e.text);
    const nativeCandidates = findNativeLanguageFragments(learnerLines);
    const transcript = ctx.transcript
      .map((e) => `${e.role === 'user' ? 'LEARNER' : ctx.npcName.toUpperCase()}: ${e.text}`)
      .join('\n');

    return [
      `Session topic: ${ctx.topic}`,
      `Duration: ${ctx.elapsedMinutes} minutes. Learner turns: ${ctx.playerTurns}.`,
      `Cyrillic fragments detected automatically in learner lines: ${
        nativeCandidates.length > 0 ? nativeCandidates.map((c) => `"${c}"`).join(', ') : 'none'
      }`,
      '',
      'Transcript:',
      transcript,
    ].join('\n');
  },
};
