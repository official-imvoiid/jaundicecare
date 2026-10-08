import type { Signal, SignalGroup } from '../domain/types.ts';
import { predictProbability, toScore } from './model.ts';
import type { ModelParams } from './model.ts';

/**
 * What raised or lowered the score. For each group of features, the group's
 * values are swapped for those of a typical non-jaundiced photo and the score
 * is recomputed; the difference is that group's contribution. The groups
 * interact, so the contributions are an approximation and need not add up.
 * Returned strongest first.
 */
export function explain(model: ModelParams, features: ArrayLike<number>): Signal[] {
  const score = toScore(predictProbability(model, features), model.threshold);
  const signals = (Object.keys(model.groups) as SignalGroup[]).map(group => {
    const swapped = Array.from(features);
    for (const i of model.groups[group]) swapped[i] = model.reference.normal[i];
    return { group, delta: score - toScore(predictProbability(model, swapped), model.threshold) };
  });
  return signals.sort((x, y) => Math.abs(y.delta) - Math.abs(x.delta));
}
