import {noise} from '../../utils/perlin';

export function* getStars(
  multiple: number,
  viewX: number,
  viewY: number,
  frame: number,
  viewWidth: number,
  viewHeight: number
): Iterable<Star> {
  const starX = Math.round(viewX / multiple);
  const starW = Math.round((viewX + viewWidth) / multiple);
  const starY = Math.round((viewY - frame / 2) / multiple);
  const starH = Math.round((viewY - frame / 2 + viewHeight) / multiple);

  for (let x = starX - 2; x < starW + 2; x += 1) {
    for (let y = starY - 5; y < starH + 5; y += 1) {
      const n = noise.simplex2(x, y);
      if (n < 1) {
        yield {x: x * multiple, y: y * multiple, n};
      }
    }
  }
}
export type Star = {x: number; y: number; n: number};
