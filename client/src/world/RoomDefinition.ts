import type { SceneTransition } from '../scenes/sceneData';

/** Position in tile coordinates. */
export interface TilePoint {
  x: number;
  y: number;
}

export type DecorKind = 'sofa' | 'cooler' | 'table';

/** Decor is anchored by the bottom-left tile of its footprint. */
export interface DecorPlacement extends TilePoint {
  kind: DecorKind;
}

export interface DoorPlacement extends TilePoint {
  id: string;
  /** Caption shown on hover/tap, e.g. the office name. */
  label: string;
  /** Scene (and its data) the door leads to. */
  target: SceneTransition;
}

/**
 * Static description of a room. Pure data: the same shape can later be produced
 * from a Tiled JSON export without touching scenes.
 *
 * Tile legend: '#' wall, '.' stone floor, ':' wooden floor, ',' carpet (see world/autotile.ts).
 */
export interface RoomDefinition {
  id: string;
  tiles: readonly string[];
  decor: readonly DecorPlacement[];
  doors: readonly DoorPlacement[];
}
