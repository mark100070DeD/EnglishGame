import { mainHall } from '../content/rooms/mainHall';
import type { RoomDefinition } from '../world/RoomDefinition';
import { RoomScene } from './RoomScene';
import { SceneKeys } from './SceneKeys';

export class MainHallScene extends RoomScene {
  constructor() {
    super(SceneKeys.MainHall);
  }

  protected getRoomDefinition(): RoomDefinition {
    return mainHall;
  }
}
