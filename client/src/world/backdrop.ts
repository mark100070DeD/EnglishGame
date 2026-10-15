import Phaser from 'phaser';
import { PALETTE as P } from '../assets/palette';
import { PixelCanvas, type Color } from '../assets/pixel/PixelCanvas';

/** Gradient stops from the building outwards. */
const KEY_COLORS: readonly Color[] = [P.bgLight, P.bgMid, P.bgDeep, P.bgEdge];
const RAMP_STEPS = 10;
/** 4×4 ordered-dither matrix: turns a smooth gradient into pixel-art bands without hard edges. */
const BAYER_4X4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5] as const;

/**
 * Fills the visible area around the room with a vignette: light blue right at the walls,
 * fading to near-black blue at the screen edges. Darkness grows with distance from the building.
 */
export function addBackdrop(
  scene: Phaser.Scene,
  view: Phaser.Geom.Rectangle,
  room: { width: number; height: number },
): Phaser.GameObjects.Image {
  const x = Math.floor(view.x);
  const y = Math.floor(view.y);
  const width = Math.ceil(view.right) - x;
  const height = Math.ceil(view.bottom) - y;

  const key = `backdrop:${x},${y},${width}x${height}:${room.width}x${room.height}`;
  if (!scene.textures.exists(key)) paintBackdrop(x, y, width, height, room).bake(scene, key);
  return scene.add.image(x, y, key).setOrigin(0, 0).setDepth(-1);
}

function paintBackdrop(
  originX: number,
  originY: number,
  width: number,
  height: number,
  room: { width: number; height: number },
): PixelCanvas {
  const ramp = buildRamp();
  const canvas = new PixelCanvas(width, height);

  // Farthest visible distance from the building (a viewport corner) maps to the darkest color.
  const maxDistance = Math.max(
    1,
    Math.hypot(
      Math.max(-originX, originX + width - room.width),
      Math.max(-originY, originY + height - room.height),
    ),
  );

  for (let py = 0; py < height; py++) {
    for (let px = 0; px < width; px++) {
      const wx = originX + px;
      const wy = originY + py;
      // Distance to the room rectangle: contours are rounded rectangles that turn circular further out.
      const dx = Math.max(-wx, 0, wx - room.width);
      const dy = Math.max(-wy, 0, wy - room.height);
      const t = Math.min(1, Math.hypot(dx, dy) / maxDistance);

      const position = t * (ramp.length - 1);
      const base = Math.floor(position);
      const threshold = (BAYER_4X4[(py % 4) * 4 + (px % 4)] ?? 0) / 16;
      const index = Math.min(ramp.length - 1, base + (position - base > threshold ? 1 : 0));
      canvas.set(px, py, ramp[index] ?? P.bgEdge);
    }
  }
  return canvas;
}

function buildRamp(): Color[] {
  const segments = KEY_COLORS.length - 1;
  return Array.from({ length: RAMP_STEPS }, (_, i) => {
    const t = (i / (RAMP_STEPS - 1)) * segments;
    const segment = Math.min(segments - 1, Math.floor(t));
    return lerpColor(KEY_COLORS[segment] ?? P.bgEdge, KEY_COLORS[segment + 1] ?? P.bgEdge, t - segment);
  });
}

function lerpColor(a: Color, b: Color, t: number): Color {
  const channel = (shift: number) => {
    const from = (a >> shift) & 0xff;
    const to = (b >> shift) & 0xff;
    return Math.round(from + (to - from) * t) << shift;
  };
  return channel(16) | channel(8) | channel(0);
}
