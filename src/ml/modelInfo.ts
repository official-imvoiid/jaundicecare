import info from './modelInfo.json';
import type { SampleLabel } from '../domain/types';

export interface SampleInfo {
  id: string;
  file: string; // path inside public/
  label: SampleLabel;
}

export const modelVersion = info.version;
export const samples = info.samples as SampleInfo[];

/** Yellow values (b*) between which the "yellow areas" view goes from no tint to full tint. */
export const yellowRange = info.yellowRange;

const caught = Math.round(info.evaluation.sensitivity);
const cleared = Math.round(info.evaluation.specificity);

/**
 * The accuracy numbers shown in the app, as whole numbers "in 100". They come
 * from the cross-validation the training script ran, never from this file.
 */
export const accuracyFacts = {
  total: info.dataset.total,
  jaundice: info.dataset.jaundice,
  normal: info.dataset.normal,
  accuracy: Math.round(info.evaluation.accuracy),
  sensitivity: caught,
  missed: 100 - caught,
  falseAlarm: 100 - cleared,
};
