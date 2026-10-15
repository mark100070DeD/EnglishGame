import { SceneKeys } from '../../scenes/SceneKeys';
import type { RoomDefinition } from '../../world/RoomDefinition';

/** 20×11 tiles = 320×176 px: fills the whole 320×180 viewport. */
export const mainHall: RoomDefinition = {
  id: 'main-hall',
  tiles: [
    '####################',
    '####################',
    '#..................#',
    '#.,,,,,......,,,,,.#',
    '#.,,,,,......,,,,,.#',
    '#.,,,,,......,,,,,.#',
    '#.,,,,,......,,,,,.#',
    '#..................#',
    '#..................#',
    '#..................#',
    '####################',
  ],
  decor: [
    // West lounge
    { kind: 'sofa', x: 3, y: 3 },
    { kind: 'table', x: 3, y: 5 },
    // East lounge
    { kind: 'sofa', x: 14, y: 3 },
    { kind: 'table', x: 14, y: 5 },
    // Cafe tables
    { kind: 'table', x: 5, y: 8 },
    { kind: 'table', x: 13, y: 8 },
    // Water coolers
    { kind: 'cooler', x: 1, y: 2 },
    { kind: 'cooler', x: 18, y: 2 },
  ],
  doors: [
    {
      id: 'speaking-office',
      x: 9,
      y: 1,
      label: 'Разговорный кабинет',
      target: {
        scene: SceneKeys.DialogueOffice,
        data: { officeId: 'speaking-office' },
      },
    },
  ],
};
