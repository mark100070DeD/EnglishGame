/**
 * Texture keys used across the game. Placeholders are generated under these keys at boot;
 * loading a real image with the same key in BootScene.preload() replaces the placeholder.
 */
export const TextureKeys = {
  Tileset: 'tileset',
  Npc: 'npc',
  Door: 'door',
  Sofa: 'sofa',
  Cooler: 'cooler',
  Table: 'table',
} as const;

/**
 * Tile indices inside the tileset texture: one row of TILE_SIZE tiles in this order.
 * A replacement tileset image must keep the same layout.
 */
export const TileIndex = {
  FloorA: 0,
  FloorB: 1,
  Wood: 2,
  Carpet: 3,
  WallTop: 4,
  WallFace: 5,
} as const;
export type TileIndex = (typeof TileIndex)[keyof typeof TileIndex];

export const TILESET_TILE_COUNT = Object.keys(TileIndex).length;
