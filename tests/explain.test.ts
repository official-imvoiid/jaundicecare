import { test } from 'node:test';
import assert from 'node:assert/strict';
import { explain } from '../src/ml/explain.ts';
import { predictProbability, toScore } from '../src/ml/model.ts';
import type { ModelParams } from '../src/ml/model.ts';
import { loadModelJson, loadParityCases } from './helpers.ts';

const model = loadModelJson<ModelParams>();
const photo = loadParityCases().find(c => c.name === 'sample-2.jpg')!;
const scoreOf = (features: number[]) => toScore(predictProbability(model, features), model.threshold);

test('every signal group of the model is reported exactly once', () => {
  const groups = explain(model, photo.features!).map(s => s.group).sort();
  assert.deepEqual(groups, Object.keys(model.groups).sort());
});

test('a photo that equals the typical normal photo has nothing to explain', () => {
  for (const signal of explain(model, model.reference.normal)) {
    assert.equal(signal.delta, 0, signal.group);
  }
});

test('each delta is the score change from swapping that group for typical normal values', () => {
  const score = scoreOf(photo.features!);
  for (const signal of explain(model, photo.features!)) {
    const swapped = [...photo.features!];
    for (const i of model.groups[signal.group]) swapped[i] = model.reference.normal[i];
    assert.equal(signal.delta, score - scoreOf(swapped), signal.group);
  }
});

test('signals are ordered from the strongest effect to the weakest', () => {
  const sizes = explain(model, photo.features!).map(s => Math.abs(s.delta));
  assert.deepEqual(sizes, [...sizes].sort((x, y) => y - x));
});

test('a jaundice photo scored above the line has at least one signal raising the score', () => {
  assert.ok(scoreOf(photo.features!) >= 50);
  assert.ok(explain(model, photo.features!).some(s => s.delta > 0));
});

test('explaining does not change the feature vector it was given', () => {
  const before = [...photo.features!];
  explain(model, photo.features!);
  assert.deepEqual(photo.features, before);
});
