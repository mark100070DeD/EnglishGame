import { TILE_SIZE } from '../config/constants';
import type { TilePoint } from './RoomDefinition';

/** World position of a tile's bottom-center: where a character's feet stand. */
export function tileFeet(point: TilePoint): Phaser.Types.Math.Vector2Like {
  return { x: point.x * TILE_SIZE + TILE_SIZE / 2, y: (point.y + 1) * TILE_SIZE - 1 };
}
