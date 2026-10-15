import { PALETTE as P } from '../palette';
import { PixelCanvas } from '../pixel/PixelCanvas';

const SHADOW_ALPHA = 80;

/** 16×16, fills a wall tile. */
export function paintDoor(): PixelCanvas {
  return new PixelCanvas(16, 16).draw(
    [
      'KKKKKKKKKKKKKKKK',
      'KFFFFFFFFFFFFFFK',
      'KFLLLLLLLLLLLLFK',
      'KFDddddDDddddDFK',
      'KFDdLLdDDdLLdDFK',
      'KFDdLLdDDdLLdDFK',
      'KFDddddDDddddDFK',
      'KFDDDDDDDDDDGGFK',
      'KFDDDDDDDDDDGGFK',
      'KFDddddDDddddDFK',
      'KFDdLLdDDdLLdDFK',
      'KFDdLLdDDdLLdDFK',
      'KFDddddDDddddDFK',
      'KFDDDDDDDDDDDDFK',
      'KFDDDDDDDDDDDDFK',
      'KFFFFFFFFFFFFFFK',
    ],
    { K: P.outline, F: P.doorFrame, D: P.door, d: P.doorShade, L: P.doorLight, G: P.gold },
  );
}

/** 16×20 chibi character: big head, small body, positioned by the feet. */
export function paintNpc(): PixelCanvas {
  return new PixelCanvas(16, 20)
    .draw(
      [
        '................',
        '....HHHHHHHH....',
        '...HHhhhhhhHH...',
        '..HHhHHHHHHhHH..',
        '..HHHHHHHHHHHH..',
        '..HSSSSSSSSSSH..',
        '..HSSSSSSSSSSH..',
        '..HSSESSSSESSH..',
        '..HSSESSSSESSH..',
        '..SSSSSSSSSSSS..',
        '...sSSSSSSSSs...',
        '....ssssssss....',
        '....CCCCCCCC....',
        '...SCCCWWCCCS...',
        '...SCCCCCCCCS...',
        '....cccccccc....',
        '....PPPPPPPP....',
        '....PPP..PPP....',
        '....KKK..KKK....',
        '................',
      ],
      {
        H: P.hairNpc,
        h: P.hairNpcLight,
        S: P.skin,
        s: P.skinShade,
        E: P.eye,
        C: P.shirtNpc,
        c: P.shirtNpcShade,
        W: P.white,
        P: P.pants,
        K: P.outline,
      },
    )
    .outline(P.outline);
}

/** 32×16 sofa seen from above: backrest on top, two seat cushions, armrests. */
export function paintSofa(): PixelCanvas {
  return new PixelCanvas(32, 16)
    .fill(1, 1, 30, 13, P.sofaDark)
    .fill(2, 2, 28, 3, P.sofa)
    .fill(2, 2, 28, 1, P.sofaLight)
    .fill(1, 5, 4, 9, P.sofa)
    .fill(27, 5, 4, 9, P.sofa)
    .fill(1, 5, 4, 1, P.sofaLight)
    .fill(27, 5, 4, 1, P.sofaLight)
    .fill(6, 6, 9, 7, P.sofa)
    .fill(17, 6, 9, 7, P.sofa)
    .fill(6, 6, 9, 1, P.sofaLight)
    .fill(17, 6, 9, 1, P.sofaLight)
    .outline(P.outline)
    .fillUnder(2, 14, 28, 2, P.shadow, SHADOW_ALPHA);
}

/** 32×16 wooden table with a paper sheet and a mug on it. */
export function paintTable(): PixelCanvas {
  return new PixelCanvas(32, 16)
    .fill(1, 1, 30, 10, P.table)
    .fill(1, 1, 30, 1, P.tableLight)
    .fill(1, 11, 30, 2, P.tableEdge)
    .fill(2, 13, 2, 1, P.tableDark)
    .fill(28, 13, 2, 1, P.tableDark)
    .fill(6, 4, 5, 4, P.white)
    .fill(7, 5, 3, 1, P.coolerShade)
    .fill(22, 4, 3, 3, P.cyan)
    .fill(23, 5, 1, 1, P.white)
    .outline(P.outline)
    .fillUnder(3, 14, 26, 2, P.shadow, SHADOW_ALPHA);
}

/** 16×24 water cooler: bottle on top, body with hot/cold taps. Occupies one floor tile. */
export function paintCooler(): PixelCanvas {
  return new PixelCanvas(16, 24)
    .fill(6, 1, 4, 1, P.cap)
    .fill(4, 2, 8, 8, P.water)
    .fill(10, 2, 2, 8, P.waterShade)
    .fill(5, 3, 1, 4, P.waterLight)
    .fill(3, 10, 10, 11, P.coolerBody)
    .fill(11, 10, 2, 11, P.coolerShade)
    .fill(3, 10, 10, 1, P.coolerShade)
    .fill(5, 13, 2, 2, P.red)
    .fill(9, 13, 2, 2, P.cap)
    .fill(5, 17, 6, 1, P.coolerShade)
    .outline(P.outline)
    .fillUnder(3, 22, 10, 2, P.shadow, SHADOW_ALPHA);
}
