import type { OfficeId } from '../content/offices/OfficeDefinition';
import { SceneKeys } from './SceneKeys';

export interface DialogueOfficeSceneData {
  officeId: OfficeId;
}

/** A typed "go to scene X with data Y" instruction, used by doors and other transitions. */
export type SceneTransition =
  | { scene: typeof SceneKeys.MainHall; data?: undefined }
  | { scene: typeof SceneKeys.DialogueOffice; data: DialogueOfficeSceneData };
