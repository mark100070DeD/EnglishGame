/**
 * Internal resolution in world pixels (camera zoom is 1, so this is how much of the world is visible).
 * Scales by whole numbers to 1080p (×4) and 4K (×8).
 */
export const GAME_WIDTH = 480;
export const GAME_HEIGHT = 270;
export const TILE_SIZE = 16;

/** Extra hit area around clickable objects, in world pixels (bigger touch targets). */
export const HOTSPOT_HIT_PADDING = 4;
export const SCENE_FADE_MS = 200;
