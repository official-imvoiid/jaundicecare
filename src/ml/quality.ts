import type { QualityCheck, QualityIssue } from '../domain/types.ts';

export const MIN_BRIGHTNESS = 32;
export const MAX_BRIGHTNESS = 94;
export const MIN_SHARPNESS = 20;
export const MIN_SKIN_PERCENT = 3;

// Maps the mean response of a sharp 256 x 256 photo to roughly 35 - 100
const SHARPNESS_SCALE = 8.5;

export interface QualityMetrics {
  brightness: number; // 0 - 100
  sharpness: number; // 0 - 100
}

/**
 * Brightness and sharpness of an RGBA image. Always call this on the fixed-size
 * analysis image: the sharpness measure depends on the pixel scale.
 */
export function measureQuality(rgba: ArrayLike<number>, width: number, height: number): QualityMetrics {
  const pixelCount = width * height;
  let lumaSum = 0;
  for (let p = 0; p < pixelCount; p++) {
    lumaSum += 0.299 * rgba[p * 4] + 0.587 * rgba[p * 4 + 1] + 0.114 * rgba[p * 4 + 2];
  }

  // Mean vertical second difference of the green channel
  let detailSum = 0;
  const rowBytes = width * 4;
  const interiorPixels = Math.max(0, height - 2) * width;
  for (let i = rowBytes; i < rgba.length - rowBytes; i += 4) {
    detailSum += Math.abs(2 * rgba[i + 1] - rgba[i - rowBytes + 1] - rgba[i + rowBytes + 1]);
  }
  const detail = interiorPixels > 0 ? detailSum / interiorPixels : 0;

  return {
    brightness: Math.round((lumaSum / pixelCount / 255) * 100),
    sharpness: Math.min(100, Math.round(detail * SHARPNESS_SCALE)),
  };
}

/** Decides whether a photo is good enough to score, and lists every reason it is not. */
export function judgeQuality(metrics: QualityMetrics, skinCount: number, pixelCount: number): QualityCheck {
  const skinShare = (skinCount / pixelCount) * 100;
  const issues: QualityIssue[] = [];
  if (metrics.brightness < MIN_BRIGHTNESS) issues.push('too_dark');
  if (metrics.brightness > MAX_BRIGHTNESS) issues.push('too_bright');
  if (metrics.sharpness < MIN_SHARPNESS) issues.push('blurry');
  if (skinShare < MIN_SKIN_PERCENT) issues.push('no_skin');

  return {
    ok: issues.length === 0,
    brightness: metrics.brightness,
    sharpness: metrics.sharpness,
    skinPercent: Math.round(skinShare),
    issues,
  };
}
