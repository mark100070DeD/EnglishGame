import type { Env } from '../../config/env';
import { AnthropicDialogueProvider } from './AnthropicDialogueProvider';
import type { DialogueProvider } from './DialogueProvider';
import { EchoDialogueProvider } from './EchoDialogueProvider';

/** "auto" uses Claude when ANTHROPIC_API_KEY is set and the echo stub otherwise. */
export function createDialogueProvider(env: Env): DialogueProvider {
  const useAnthropic =
    env.DIALOGUE_PROVIDER === 'anthropic' || (env.DIALOGUE_PROVIDER === 'auto' && Boolean(env.ANTHROPIC_API_KEY));

  if (!useAnthropic) return new EchoDialogueProvider();
  if (!env.ANTHROPIC_API_KEY) throw new Error('DIALOGUE_PROVIDER=anthropic requires ANTHROPIC_API_KEY');
  return new AnthropicDialogueProvider({ apiKey: env.ANTHROPIC_API_KEY, model: env.LLM_MODEL });
}
