import Phaser from 'phaser';
import { TextureKeys } from '../assets/keys';

export interface NpcConfig {
  id: string;
  name: string;
  texture?: string;
}

/** Character the player can talk to. Positioned by its feet. */
export class Npc extends Phaser.GameObjects.Image {
  readonly npcId: string;
  readonly displayName: string;

  constructor(scene: Phaser.Scene, x: number, y: number, config: NpcConfig) {
    super(scene, x, y, config.texture ?? TextureKeys.Npc);
    this.npcId = config.id;
    this.displayName = config.name;

    this.setOrigin(0.5, 1);
    this.setDepth(this.y);
    scene.add.existing(this);
  }
}
