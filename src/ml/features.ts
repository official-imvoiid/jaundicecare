// Skin-colour features for the jaundice model.
//
// This mirrors analyse_rgb() in train_jaundice_neural_net.py. The constants,
// formulas and feature order must stay identical in both files; `npm test`
// compares the two on fixtures written by the training script.

export const ANALYSIS_SIZE = 256;
export const MIN_SKIN_PIXELS = 200;

const SKIN_MIN_L = 20;
const SKIN_MIN_A = 6;
const SKIN_YELLOW_MIN_B = 22;
const SKIN_YELLOW_MAX_L = 82;
const BRIGHT_PERCENTILE = 95;
const DEGREES = 180 / Math.PI;

export interface FeatureResult {
  features: number[]; // in the model's featureNames order
  skin: Uint8Array; // 1 where the pixel looks like skin
  skinCount: number;
  skinFound: boolean; // false: too little skin, the whole picture was measured instead
  bStar: Float64Array; // yellow-blue value of every pixel, for the overlay
}

// sRGB byte -> linear light
const LINEAR = new Float64Array(256);
for (let v = 0; v < 256; v++) {
  const c = v / 255;
  LINEAR[v] = c > 0.04045 ? Math.pow((c + 0.055) / 1.055, 2.4) : c / 12.92;
}

const labCurve = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);

/** Linear-interpolated percentile of an ascending-sorted array. */
function percentile(sorted: Float64Array, q: number): number {
  const pos = ((sorted.length - 1) * q) / 100;
  const lo = Math.floor(pos);
  const hi = Math.min(lo + 1, sorted.length - 1);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

function mean(values: Float64Array): number {
  let sum = 0;
  for (let i = 0; i < values.length; i++) sum += values[i];
  return sum / values.length;
}

function std(values: Float64Array, average: number): number {
  let sum = 0;
  for (let i = 0; i < values.length; i++) sum += (values[i] - average) ** 2;
  return Math.sqrt(sum / values.length);
}

const binOf = (value: number, lo: number, hi: number, bins: number) =>
  Math.min(bins - 1, Math.max(0, Math.floor(((value - lo) / (hi - lo)) * bins)));

/** Share of values per bin; values outside the range land in the end bins. */
function histogram(values: Float64Array, lo: number, hi: number, bins: number): number[] {
  const counts = new Array<number>(bins).fill(0);
  for (let i = 0; i < values.length; i++) counts[binOf(values[i], lo, hi, bins)]++;
  return counts.map(count => count / values.length);
}

/** Share of (u, v) pairs per cell, row-major with u as the row. */
function histogram2d(
  u: Float64Array, v: Float64Array,
  uLo: number, uHi: number, vLo: number, vHi: number, bins: number,
): number[] {
  const counts = new Array<number>(bins * bins).fill(0);
  for (let i = 0; i < u.length; i++) {
    counts[binOf(u[i], uLo, uHi, bins) * bins + binOf(v[i], vLo, vHi, bins)]++;
  }
  return counts.map(count => count / u.length);
}

/**
 * Measures an RGBA image (4 bytes per pixel, any size). The model was trained
 * on images resized to ANALYSIS_SIZE x ANALYSIS_SIZE.
 */
export function extractFeatures(rgba: ArrayLike<number>, pixelCount: number): FeatureResult {
  const L = new Float64Array(pixelCount);
  const a = new Float64Array(pixelCount);
  const b = new Float64Array(pixelCount);
  const sat = new Float64Array(pixelCount);
  const cb = new Float64Array(pixelCount);
  const cr = new Float64Array(pixelCount);
  const skin = new Uint8Array(pixelCount);
  let skinCount = 0;

  for (let p = 0; p < pixelCount; p++) {
    const red = rgba[p * 4];
    const green = rgba[p * 4 + 1];
    const blue = rgba[p * 4 + 2];

    const r = LINEAR[red];
    const g = LINEAR[green];
    const bl = LINEAR[blue];
    const fX = labCurve((r * 0.4124 + g * 0.3576 + bl * 0.1805) / 0.95047);
    const fY = labCurve(r * 0.2126 + g * 0.7152 + bl * 0.0722);
    const fZ = labCurve((r * 0.0193 + g * 0.1192 + bl * 0.9505) / 1.08883);
    L[p] = 116 * fY - 16;
    a[p] = 500 * (fX - fY);
    b[p] = 200 * (fY - fZ);

    const max = Math.max(red, green, blue);
    sat[p] = max === 0 ? 0 : (max - Math.min(red, green, blue)) / max;
    cb[p] = 128 - 0.168736 * red - 0.331264 * green + 0.5 * blue;
    cr[p] = 128 + 0.5 * red - 0.418688 * green - 0.081312 * blue;

    // YCbCr chroma box, then either reddish or clearly yellow and not near-white
    if (
      cr[p] > 133 && cr[p] < 173 && cb[p] > 77 && cb[p] < 127 && L[p] > SKIN_MIN_L &&
      (a[p] > SKIN_MIN_A || (b[p] > SKIN_YELLOW_MIN_B && L[p] < SKIN_YELLOW_MAX_L))
    ) {
      skin[p] = 1;
      skinCount++;
    }
  }

  // Measure the skin; with too little of it, measure the whole picture
  const skinFound = skinCount >= MIN_SKIN_PIXELS;
  const regionSize = skinFound ? skinCount : pixelCount;
  const rL = new Float64Array(regionSize);
  const rA = new Float64Array(regionSize);
  const rB = new Float64Array(regionSize);
  const rSat = new Float64Array(regionSize);
  const hue = new Float64Array(regionSize);
  let ratioSum = 0, cbSum = 0, crSum = 0, chromaSum = 0;
  for (let p = 0, k = 0; p < pixelCount; p++) {
    if (skinFound && !skin[p]) continue;
    rL[k] = L[p];
    rA[k] = a[p];
    rB[k] = b[p];
    rSat[k] = sat[p];
    hue[k] = Math.atan2(b[p], Math.max(a[p], 1e-6)) * DEGREES;
    ratioSum += b[p] / Math.max(a[p], 1);
    cbSum += cb[p];
    crSum += cr[p];
    chromaSum += Math.sqrt(a[p] ** 2 + b[p] ** 2);
    k++;
  }

  const meanL = mean(rL);
  const meanA = mean(rA);
  const meanB = mean(rB);
  const meanHue = mean(hue);
  const p90B = percentile(rB.slice().sort(), 90);
  const medianA = percentile(rA.slice().sort(), 50);

  // The brightest 5% of the picture (usually the sheet) is the lighting reference
  const brightFrom = percentile(L.slice().sort(), BRIGHT_PERCENTILE);
  let brightCount = 0, brightL = 0, brightA = 0, brightB = 0;
  for (let p = 0; p < pixelCount; p++) {
    if (L[p] >= brightFrom) {
      brightCount++;
      brightL += L[p];
      brightA += a[p];
      brightB += b[p];
    }
  }
  brightL /= brightCount;
  brightA /= brightCount;
  brightB /= brightCount;

  const features = [
    // skin statistics
    meanL, meanA, meanB,
    std(rL, meanL), std(rA, meanA), std(rB, meanB),
    mean(rSat),
    p90B, medianA,
    ratioSum / regionSize,
    cbSum / regionSize, crSum / regionSize,
    // skin histograms
    ...histogram(rA, -10, 40, 10),
    ...histogram(rB, -10, 50, 10),
    ...histogram(rL, 20, 100, 8),
    ...histogram(rSat, 0, 1, 8),
    ...histogram2d(rA, rB, 0, 36, 0, 48, 6),
    ...histogram(hue, 0, 90, 9),
    meanHue, std(hue, meanHue), chromaSum / regionSize,
    // skin compared with the lighting reference
    meanA - brightA,
    meanB - brightB,
    meanL - brightL,
    p90B - brightB,
    meanHue - Math.atan2(brightB, Math.max(brightA, 1e-6)) * DEGREES,
  ];

  return { features, skin, skinCount, skinFound, bStar: b };
}
