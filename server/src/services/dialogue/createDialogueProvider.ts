import type { Env } from '../../config/env';
import type { DialogueProvider } from './DialogueProvider';
import { EchoDialogueProvider } from './EchoDialogueProvider';

export function createDialogueProvider(env: Env): DialogueProvider {
  switch (env.DIALOGUE_PROVIDER) {
    case 'echo':
      return new EchoDialogueProvider();
  }
}
