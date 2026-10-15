import { TileIndex } from '../assets/keys';

export type Terrain = 'floor' | 'wood' | 'carpet' | 'wall';

export const TERRAIN_LEGEND: Readonly<Record<string, Terrain>> = {
  '.': 'floor',
  ':': 'wood',
  ',': 'carpet',
  '#': 'wall',
};

/**
 * Picks the visual tile for a terrain cell from its neighbours, so room data stays simple:
 * - a wall with walkable ground below shows its lit front face, other walls show the dark top;
 * - stone floor alternates two tones in a checkerboard.
 */
export function resolveTile(
  terrain: Terrain,
  x: number,
  y: number,
  terrainAt: (x: number, y: number) => Terrain | undefined,
): TileIndex {
  switch (terrain) {
    case 'wall': {
      const below = terrainAt(x, y + 1);
      return below !== undefined && below !== 'wall' ? TileIndex.WallFace : TileIndex.WallTop;
    }
    case 'floor':
      return (x + y) % 2 === 0 ? TileIndex.FloorA : TileIndex.FloorB;
    case 'wood':
      return TileIndex.Wood;
    case 'carpet':
      return TileIndex.Carpet;
  }
}
