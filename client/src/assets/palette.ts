/**
 * Game palette. Placeholders are drawn only with these colors; final art should stick to them too,
 * so floor, walls and interactive objects keep their tonal separation:
 * dark cool walls  <  mid warm floor  <  bright saturated furniture/doors/characters.
 */
export const PALETTE = {
  outline: 0x1c1626,
  shadow: 0x1c1626,
  white: 0xf4f1ea,

  // Backdrop around the building (vignette from the walls to the screen edges)
  bgLight: 0x8ec5f2,
  bgMid: 0x3f7cc4,
  bgDeep: 0x16295a,
  bgEdge: 0x060a18,

  // Hall floor: terracotta tiles
  floorA: 0xb8654a,
  floorB: 0xad5d44,
  floorLight: 0xc9775a,
  floorGrout: 0x8a4434,

  // Office floor: wooden planks
  wood: 0xc98b4f,
  woodAlt: 0xbe8048,
  woodLight: 0xdb9d60,
  woodSeam: 0x8f5a32,

  carpet: 0x2b5c8f,
  carpetLight: 0x4079b2,
  carpetDark: 0x214a75,

  // Walls: dark top, lit brick face
  wallTop: 0x2a2440,
  wallTopLight: 0x3a3156,
  wallTopDark: 0x1d182e,
  wallFace: 0x5d4c80,
  wallFaceLight: 0x7c6aa4,
  wallMortar: 0x45385f,
  wallFaceShadow: 0x342a4a,

  // Doors
  doorFrame: 0x6e3820,
  door: 0xd07a3a,
  doorShade: 0xa85d2a,
  doorLight: 0xf0a25c,
  gold: 0xffd24a,

  // Furniture
  sofa: 0xe0473f,
  sofaDark: 0xa42f35,
  sofaLight: 0xff7059,
  table: 0xe8a45c,
  tableLight: 0xf8c47e,
  tableEdge: 0xb9733a,
  tableDark: 0x7f4a26,
  coolerBody: 0xeef2f7,
  coolerShade: 0xb6c1d6,
  water: 0x6fd6ff,
  waterShade: 0x3aa6e0,
  waterLight: 0xcdf3ff,
  cap: 0x2d6ad8,
  red: 0xe0473f,
  cyan: 0x4ec8e8,

  // Characters
  skin: 0xffd3a8,
  skinShade: 0xe9a679,
  eye: 0x1c1626,
  hairNpc: 0x3b2a5e,
  hairNpcLight: 0x5d47a0,
  shirtNpc: 0x2fbf8f,
  shirtNpcShade: 0x1f9070,
  pants: 0x2b3a67,
} as const;
