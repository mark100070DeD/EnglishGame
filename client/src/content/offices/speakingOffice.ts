import { SceneKeys } from '../../scenes/SceneKeys';
import type { OfficeDefinition } from './OfficeDefinition';

export const speakingOffice: OfficeDefinition = {
  id: 'speaking-office',
  kind: 'speaking',
  title: 'Speaking Office',
  npc: {
    id: 'emma',
    name: 'Emma',
    x: 7,
    y: 4,
    greeting: "Hi, I'm Emma! Let's practise speaking. How has your day been so far?",
  },
  // 16×10 tiles = 256×160 px
  room: {
    id: 'speaking-office',
    tiles: [
      '################',
      '################',
      '#::::::::::::::#',
      '#::::,,,,,,::::#',
      '#::::,,,,,,::::#',
      '#::::,,,,,,::::#',
      '#::::::::::::::#',
      '#::::::::::::::#',
      '#::::::::::::::#',
      '################',
    ],
    decor: [
      { kind: 'table', x: 7, y: 5 },
      { kind: 'cooler', x: 14, y: 2 },
      { kind: 'sofa', x: 1, y: 8 },
    ],
    doors: [
      {
        id: 'exit',
        x: 7,
        y: 9,
        label: 'Назад в холл',
        target: { scene: SceneKeys.MainHall },
      },
    ],
  },
};
