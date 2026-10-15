import type Phaser from 'phaser';
import { TextureKeys } from './keys';
import { paintCooler, paintDoor, paintNpc, paintSofa, paintTable } from './placeholders/sprites';
import { paintTileset } from './placeholders/tileset';

/**
 * Generates placeholder pixel art for every texture key. Any key that already exists
 * (i.e. a real asset was loaded in BootScene.preload) is left untouched.
 */
export function generatePlaceholderTextures(scene: Phaser.Scene): void {
  paintTileset().bake(scene, TextureKeys.Tileset);
  paintNpc().bake(scene, TextureKeys.Npc);
  paintDoor().bake(scene, TextureKeys.Door);
  paintSofa().bake(scene, TextureKeys.Sofa);
  paintCooler().bake(scene, TextureKeys.Cooler);
  paintTable().bake(scene, TextureKeys.Table);
}
