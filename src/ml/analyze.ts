import type { Analysis, QualityCheck } from '../domain/types';
import { explain } from './explain';
import { ANALYSIS_SIZE, extractFeatures } from './features';
import { predictProbability, toScore } from './model';
import type { ModelParams } from './model';
import { analysisPixels } from './photo';
import type { PhotoElement } from './photo';
import { judgeQuality, measureQuality } from './quality';

let model: Promise<ModelParams> | null = null;

/** The weights are large, so they are fetched only when the first photo is measured. */
export function loadModel(): Promise<ModelParams> {
  model ??= import('./model.json').then(module => module.default as unknown as ModelParams);
  return model;
}

export interface PhotoAnalysis {
  quality: QualityCheck;
  analysis: Analysis | null; // null when the photo is not good enough to score
}

/** Measures a photo. Nothing leaves the browser. */
export async function analyzePhoto(photo: PhotoElement): Promise<PhotoAnalysis> {
  const pixels = analysisPixels(photo);
  const pixelCount = ANALYSIS_SIZE * ANALYSIS_SIZE;
  const measured = extractFeatures(pixels, pixelCount);
  const quality = judgeQuality(measureQuality(pixels, ANALYSIS_SIZE, ANALYSIS_SIZE), measured.skinCount, pixelCount);
  if (!quality.ok) return { quality, analysis: null };

  const params = await loadModel();
  const probability = predictProbability(params, measured.features);
  return {
    quality,
    analysis: {
      score: toScore(probability, params.threshold),
      indication: probability >= params.threshold ? 'signs_seen' : 'no_signs',
      signals: explain(params, measured.features),
      modelVersion: params.version,
    },
  };
}
