import type { SignalGroup } from '../domain/types.ts';

// Shape of src/ml/model.json, written by train_jaundice_neural_net.py

export interface MlpParams {
  mean: number[];
  scale: number[];
  weights: number[][][]; // [layer][input][output]
  biases: number[][];
}

/** One tree as parallel arrays. f[i] = -1 marks a leaf with value v[i]; otherwise go left when x[f[i]] <= t[i]. */
export interface GbtTree {
  f: number[];
  t: number[];
  l: number[];
  r: number[];
  v: number[];
}

export interface GbtParams {
  baseline: number;
  trees: GbtTree[];
}

export interface ModelParams {
  version: string;
  featureNames: string[];
  groups: Record<SignalGroup, number[]>;
  reference: { normal: number[]; jaundice: number[] };
  threshold: number;
  mlp: MlpParams;
  gbt: GbtParams;
}

const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

/** Neural network: standardise, hidden layers with ReLU, one logistic output. */
export function predictMlp(params: MlpParams, features: ArrayLike<number>): number {
  let activation: number[] = [];
  for (let i = 0; i < features.length; i++) {
    activation.push((features[i] - params.mean[i]) / params.scale[i]);
  }

  const outputLayer = params.weights.length - 1;
  for (let layer = 0; layer <= outputLayer; layer++) {
    const weights = params.weights[layer];
    const biases = params.biases[layer];
    const next: number[] = [];
    for (let j = 0; j < biases.length; j++) {
      let sum = biases[j];
      for (let i = 0; i < activation.length; i++) sum += activation[i] * weights[i][j];
      next.push(layer < outputLayer ? Math.max(0, sum) : sum);
    }
    activation = next;
  }
  return sigmoid(activation[0]);
}

/** Gradient-boosted trees: baseline plus one leaf value per tree, through a sigmoid. */
export function predictGbt(params: GbtParams, features: ArrayLike<number>): number {
  let raw = params.baseline;
  for (const tree of params.trees) {
    let node = 0;
    while (tree.f[node] >= 0) {
      node = features[tree.f[node]] <= tree.t[node] ? tree.l[node] : tree.r[node];
    }
    raw += tree.v[node];
  }
  return sigmoid(raw);
}

/** Probability of jaundice: the average of the two models. */
export function predictProbability(model: ModelParams, features: ArrayLike<number>): number {
  const expected = model.featureNames.length;
  if (features.length !== expected) {
    throw new Error(`The model expects ${expected} features but received ${features.length}`);
  }
  for (let i = 0; i < expected; i++) {
    if (!Number.isFinite(features[i])) {
      throw new Error(`Feature ${model.featureNames[i]} is not a finite number`);
    }
  }
  return (predictMlp(model.mlp, features) + predictGbt(model.gbt, features)) / 2;
}

/**
 * Score from 0 to 100 shown to people. The decision line always lands on 50,
 * whatever probability the training chose for it.
 */
export function toScore(probability: number, threshold: number): number {
  if (probability >= threshold) {
    return Math.max(50, Math.round(50 + (50 * (probability - threshold)) / (1 - threshold)));
  }
  return Math.min(49, Math.round((50 * probability) / threshold));
}
