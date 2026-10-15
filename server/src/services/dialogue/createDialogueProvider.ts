import type { Env } from '../../config/env';
import { AnthropicDialogueProvider } from './AnthropicDialogueProvider';
import type { DialogueProvider } from './DialogueProvider';
import { EchoDialogueProvider } from './EchoDialogueProvider';
import { OpenAICompatibleDialogueProvider } from './OpenAICompatibleDialogueProvider';

type LlmProvider = 'anthropic' | 'gemini' | 'groq';

/** OpenAI-compatible endpoints with free tiers. */
const OPENAI_COMPATIBLE_PRESETS = {
  gemini: { baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai', defaultModel: 'gemini-3.8-flash' },
  groq: { baseUrl: 'https://api.groq.com/openai/v1', defaultModel: 'openai/gpt-oss-120b' },
} as const;

const ANTHROPIC_DEFAULT_MODEL = 'claude-opus-5-5';

export function createDialogueProvider(env: Env): DialogueProvider {
  const provider = resolveProvider(env);
  switch (provider) {
    case 'echo':
      return new EchoDialogueProvider();
    case 'anthropic':
      return new AnthropicDialogueProvider({
        apiKey: requireKey(env.ANTHROPIC_API_KEY, 'ANTHROPIC_API_KEY'),
        model: env.LLM_MODEL ?? ANTHROPIC_DEFAULT_MODEL,
      });
    case 'gemini':
    case 'groq': {
      const preset = OPENAI_COMPATIBLE_PRESETS[provider];
      const key = provider === 'gemini' ? env.GEMINI_API_KEY : env.GROQ_API_KEY;
      return new OpenAICompatibleDialogueProvider({
        label: provider,
        baseUrl: preset.baseUrl,
        apiKey: requireKey(key, `${provider.toUpperCase()}_API_KEY`),
        model: env.LLM_MODEL ?? preset.defaultModel,
      });
    }
  }
}

function resolveProvider(env: Env): LlmProvider | 'echo' {
  if (env.DIALOGUE_PROVIDER !== 'auto') return env.DIALOGUE_PROVIDER;
  if (env.ANTHROPIC_API_KEY) return 'anthropic';
  if (env.GEMINI_API_KEY) return 'gemini';
  if (env.GROQ_API_KEY) return 'groq';
  return 'echo';
}

function requireKey(key: string | undefined, name: string): string {
  if (!key) throw new Error(`The selected dialogue provider requires ${name}`);
  return key;
}
