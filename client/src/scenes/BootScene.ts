import Phaser from 'phaser';
import { generatePlaceholderTextures } from '../assets/placeholderTextures';
import { SceneKeys } from './SceneKeys';

export class BootScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.Boot);
  }

  preload(): void {
    // Real art goes here, under the keys from assets/keys.ts, e.g.:
    // this.load.image(TextureKeys.Sofa, 'assets/sprites/sofa.png');
    // Anything loaded here wins over the generated placeholder with the same key.
  }

  create(): void {
    generatePlaceholderTextures(this);
    this.scene.start(SceneKeys.MainHall);
  }
}
