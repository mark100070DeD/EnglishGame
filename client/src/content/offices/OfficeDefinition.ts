import type { OfficeKind } from '@english-office/shared';
import type { RoomDefinition, TilePoint } from '../../world/RoomDefinition';

/** Add new office ids here; the registry in ./index.ts must then define them. */
export type OfficeId = 'speaking-office';

export interface NpcDefinition extends TilePoint {
  id: string;
  name: string;
}

export interface OfficeDefinition {
  id: OfficeId;
  kind: OfficeKind;
  title: string;
  room: RoomDefinition;
  npc: NpcDefinition;
}
