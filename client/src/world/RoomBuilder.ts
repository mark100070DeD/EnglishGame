import Phaser from 'phaser';
import { TextureKeys } from '../assets/keys';
import { TILE_SIZE } from '../config/constants';
import { resolveTile, TERRAIN_LEGEND, type Terrain } from './autotile';
import { DECOR_CATALOG } from './decorCatalog';
import type { DecorPlacement, RoomDefinition } from './RoomDefinition';

export interface BuiltRoom {
  groundLayer: Phaser.Tilemaps.TilemapLayer;
  widthPx: number;
  heightPx: number;
}

/** Turns a RoomDefinition into a tilemap with decor placed on top. */
export function buildRoom(scene: Phaser.Scene, def: RoomDefinition): BuiltRoom {
  const data = parseTiles(def);
  const map = scene.make.tilemap({ data, tileWidth: TILE_SIZE, tileHeight: TILE_SIZE });
  const tileset = map.addTilesetImage(TextureKeys.Tileset, TextureKeys.Tileset, TILE_SIZE, TILE_SIZE, 0, 0);
  if (!tileset) throw new Error(`Room "${def.id}": tileset texture "${TextureKeys.Tileset}" is missing`);

  const groundLayer = map.createLayer(0, tileset, 0, 0);
  if (!groundLayer) throw new Error(`Room "${def.id}": failed to create ground layer`);

  def.decor.forEach((placement) => createDecor(scene, placement));

  return { groundLayer, widthPx: map.widthInPixels, heightPx: map.heightInPixels };
}

function parseTiles(def: RoomDefinition): number[][] {
  const width = def.tiles[0]?.length ?? 0;
  if (width === 0) throw new Error(`Room "${def.id}": tiles are empty`);

  const terrain: Terrain[][] = def.tiles.map((row, y) => {
    if (row.length !== width) {
      throw new Error(`Room "${def.id}": row ${y} has length ${row.length}, expected ${width}`);
    }
    return [...row].map((char, x) => {
      const cell = TERRAIN_LEGEND[char];
      if (cell === undefined) throw new Error(`Room "${def.id}": unknown tile "${char}" at ${x},${y}`);
      return cell;
    });
  });

  const terrainAt = (x: number, y: number) => terrain[y]?.[x];
  return terrain.map((row, y) => row.map((cell, x) => resolveTile(cell, x, y, terrainAt)));
}

function createDecor(scene: Phaser.Scene, placement: DecorPlacement): Phaser.GameObjects.Image {
  const spec = DECOR_CATALOG[placement.kind];
  const image = scene.add.image(placement.x * TILE_SIZE, (placement.y + 1) * TILE_SIZE, spec.texture);
  return image.setOrigin(0, 1).setDepth(image.y);
}
