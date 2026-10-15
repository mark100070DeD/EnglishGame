import Phaser from 'phaser';
import { BootScene } from '../scenes/BootScene';
import { DialogueOfficeScene } from '../scenes/DialogueOfficeScene';
import { MainHallScene } from '../scenes/MainHallScene';
import { GAME_HEIGHT, GAME_WIDTH } from './constants';

export function createGameConfig(parent: string): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: '#060a18',
    pixelArt: true,
    roundPixels: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [BootScene, MainHallScene, DialogueOfficeScene],
  };
}
