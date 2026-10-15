import { TILE_SIZE } from '../../config/constants';
import { TILESET_TILE_COUNT, TileIndex } from '../keys';
import { PALETTE as P } from '../palette';
import { PixelCanvas } from '../pixel/PixelCanvas';

const T = TILE_SIZE;

export function paintTileset(): PixelCanvas {
  const c = new PixelCanvas(T * TILESET_TILE_COUNT, T);
  const at = (index: TileIndex) => index * T;

  paintFloorTile(c, at(TileIndex.FloorA), P.floorA);
  paintFloorTile(c, at(TileIndex.FloorB), P.floorB);
  paintWood(c, at(TileIndex.Wood));
  paintCarpet(c, at(TileIndex.Carpet));
  paintWallTop(c, at(TileIndex.WallTop));
  paintWallFace(c, at(TileIndex.WallFace));
  return c;
}

/** Bevelled stone tile: light top/left edge, dark grout on bottom/right. */
function paintFloorTile(c: PixelCanvas, ox: number, base: number): void {
  c.fill(ox, 0, T, T, base);
  c.fill(ox, 0, T, 1, P.floorLight).fill(ox, 0, 1, T, P.floorLight);
  c.fill(ox, T - 1, T, 1, P.floorGrout).fill(ox + T - 1, 0, 1, T, P.floorGrout);
  c.set(ox + 5, 6, P.floorLight).set(ox + 10, 10, P.floorGrout);
}

function paintWood(c: PixelCanvas, ox: number): void {
  const seams = [5, 12, 2, 9];
  seams.forEach((seamX, row) => {
    const y = row * 4;
    c.fill(ox, y, T, 4, row % 2 ? P.woodAlt : P.wood);
    c.fill(ox, y, T, 1, P.woodLight);
    c.fill(ox, y + 3, T, 1, P.woodSeam);
    c.fill(ox + seamX, y, 1, 3, P.woodSeam);
  });
}

/** Navy carpet with a small diamond motif. */
function paintCarpet(c: PixelCanvas, ox: number): void {
  c.fill(ox, 0, T, T, P.carpet);
  for (let dy = -3; dy <= 3; dy++) {
    const dx = 3 - Math.abs(dy);
    c.set(ox + 8 - dx, 8 + dy, P.carpetLight).set(ox + 8 + dx, 8 + dy, P.carpetLight);
  }
  c.set(ox, 0, P.carpetDark).set(ox + 8, 8, P.carpetDark);
}

function paintWallTop(c: PixelCanvas, ox: number): void {
  // Calm dark mass with sparse texture, so walls read as background, not as a grid.
  c.fill(ox, 0, T, T, P.wallTop);
  c.set(ox + 3, 4, P.wallTopLight).set(ox + 11, 2, P.wallTopLight).set(ox + 7, 11, P.wallTopLight);
  c.set(ox + 13, 9, P.wallTopDark).set(ox + 2, 13, P.wallTopDark);
}

/** Front face of a wall (visible when floor is below it): lit bricks with a contact shadow. */
function paintWallFace(c: PixelCanvas, ox: number): void {
  c.fill(ox, 0, T, T, P.wallFace);
  c.fill(ox, 0, T, 2, P.wallFaceLight);
  c.fill(ox, 6, T, 1, P.wallMortar).fill(ox, 11, T, 1, P.wallMortar);
  c.fill(ox + 8, 2, 1, 4, P.wallMortar);
  c.fill(ox + 3, 7, 1, 4, P.wallMortar).fill(ox + 13, 7, 1, 4, P.wallMortar);
  c.fill(ox + 8, 12, 1, 2, P.wallMortar);
  c.fill(ox, 14, T, 2, P.wallFaceShadow);
}
