import Phaser from 'phaser';

/** 0xRRGGBB */
export type Color = number;

/**
 * Tiny pixel-art raster used to author placeholder sprites in code:
 * rectangles, string-drawn pixel maps, auto outline, drop shadows.
 */
export class PixelCanvas {
  private readonly data: Uint8ClampedArray<ArrayBuffer>;

  constructor(
    readonly width: number,
    readonly height: number,
  ) {
    this.data = new Uint8ClampedArray(width * height * 4);
  }

  set(x: number, y: number, color: Color, alpha = 255): this {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return this;
    const i = (y * this.width + x) * 4;
    this.data[i] = (color >> 16) & 0xff;
    this.data[i + 1] = (color >> 8) & 0xff;
    this.data[i + 2] = color & 0xff;
    this.data[i + 3] = alpha;
    return this;
  }

  fill(x: number, y: number, w: number, h: number, color: Color, alpha = 255): this {
    for (let py = y; py < y + h; py++) {
      for (let px = x; px < x + w; px++) this.set(px, py, color, alpha);
    }
    return this;
  }

  /** Like fill(), but only paints fully transparent pixels — used for shadows under an object. */
  fillUnder(x: number, y: number, w: number, h: number, color: Color, alpha: number): this {
    for (let py = y; py < y + h; py++) {
      for (let px = x; px < x + w; px++) {
        if (this.alphaAt(px, py) === 0) this.set(px, py, color, alpha);
      }
    }
    return this;
  }

  /**
   * Draws a pixel map: one string per row, one character per pixel.
   * '.' is transparent; every other character must exist in the palette.
   */
  draw(rows: readonly string[], palette: Readonly<Record<string, Color>>, ox = 0, oy = 0): this {
    const width = rows[0]?.length ?? 0;
    rows.forEach((row, y) => {
      if (row.length !== width) throw new Error(`Pixel map row ${y} has ${row.length} px, expected ${width}`);
      [...row].forEach((char, x) => {
        if (char === '.') return;
        const color = palette[char];
        if (color === undefined) throw new Error(`Pixel map: no palette color for "${char}"`);
        this.set(ox + x, oy + y, color);
      });
    });
    return this;
  }

  /** Adds a 1px outline around every opaque shape (4-neighbourhood). */
  outline(color: Color): this {
    const targets: [number, number][] = [];
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.alphaAt(x, y) !== 0) continue;
        const touchesShape =
          this.isOpaque(x - 1, y) || this.isOpaque(x + 1, y) || this.isOpaque(x, y - 1) || this.isOpaque(x, y + 1);
        if (touchesShape) targets.push([x, y]);
      }
    }
    targets.forEach(([x, y]) => this.set(x, y, color));
    return this;
  }

  /** Registers the raster as a texture unless a texture with this key already exists. */
  bake(scene: Phaser.Scene, key: string): void {
    if (scene.textures.exists(key)) return;
    const texture = scene.textures.createCanvas(key, this.width, this.height);
    if (!texture) throw new Error(`Failed to create canvas texture "${key}"`);
    texture.context.putImageData(new ImageData(this.data, this.width, this.height), 0, 0);
    texture.refresh();
  }

  private alphaAt(x: number, y: number): number {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return 255;
    return this.data[(y * this.width + x) * 4 + 3] ?? 0;
  }

  private isOpaque(x: number, y: number): boolean {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return false;
    return this.alphaAt(x, y) === 255;
  }
}
