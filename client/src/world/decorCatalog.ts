import { TextureKeys } from '../assets/keys';
import type { DecorKind } from './RoomDefinition';

export interface DecorSpec {
  texture: string;
}

export const DECOR_CATALOG: Readonly<Record<DecorKind, DecorSpec>> = {
  sofa: { texture: TextureKeys.Sofa },
  cooler: { texture: TextureKeys.Cooler },
  table: { texture: TextureKeys.Table },
};
