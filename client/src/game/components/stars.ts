import {noise} from '../../utils/perlin';

export function* getStars(
  viewX: number,
  viewY: number,
  frame: number,
  viewWidth: number,
  viewHeight: number
): Iterable<Star> {
  const starX = Math.round(viewX / 16);
  const starW = Math.round((viewX + viewWidth) / 16);
  const starY = Math.round((viewY - frame / 2) / 16);
  const starH = Math.round((viewY - frame / 2 + viewHeight) / 16);

  for (let x = starX - 2; x < starW + 2; x += 1) {
    for (let y = starY - 5; y < starH + 5; y += 1) {
      const n = noise.simplex2(x, y);
      if (n < 1) {
        yield {x: x * 16, y: y * 16, n};
      }
    }
  }
}
export type Star = {x: number; y: number; n: number};
