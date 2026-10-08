export type OverlayKind = 'skin' | 'yellow';

const DIM = [20, 26, 23]; // dark veil over everything the model ignored
const TINT = [232, 112, 18]; // warm highlight over yellow-toned skin
const DIM_ALPHA = { skin: 175, yellow: 150 };
const MAX_TINT_ALPHA = 200;

/**
 * RGBA pixels to draw over the photo.
 *  - 'skin':   dims everything the model did not treat as skin.
 *  - 'yellow': also tints skin, more strongly the higher its yellow value
 *              (b*) sits between range.low and range.high.
 */
export function buildOverlay(
  kind: OverlayKind,
  skin: Uint8Array,
  bStar: Float64Array,
  range: { low: number; high: number },
): Uint8ClampedArray {
  const pixels = new Uint8ClampedArray(skin.length * 4);
  for (let p = 0; p < skin.length; p++) {
    const o = p * 4;
    if (!skin[p]) {
      pixels[o] = DIM[0];
      pixels[o + 1] = DIM[1];
      pixels[o + 2] = DIM[2];
      pixels[o + 3] = DIM_ALPHA[kind];
    } else if (kind === 'yellow') {
      const strength = Math.min(1, Math.max(0, (bStar[p] - range.low) / (range.high - range.low)));
      pixels[o] = TINT[0];
      pixels[o + 1] = TINT[1];
      pixels[o + 2] = TINT[2];
      pixels[o + 3] = Math.round(strength * MAX_TINT_ALPHA);
    }
  }
  return pixels;
}
