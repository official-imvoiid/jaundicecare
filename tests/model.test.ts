import { test } from 'node:test';
import assert from 'node:assert/strict';
import { predictGbt, predictMlp, predictProbability, toScore } from '../src/ml/model.ts';
import type { ModelParams } from '../src/ml/model.ts';
import { loadModelJson, loadParityCases } from './helpers.ts';

const model = loadModelJson<ModelParams>();
const cases = loadParityCases().filter(c => c.features !== null);

function assertClose(actual: number, expected: number, tolerance: number, label: string) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${label}: got ${actual}, expected ${expected}`);
}

test('the fixtures contain photos to compare against', () => {
  assert.ok(cases.length >= 6);
});

test('the neural network matches the Python reference on every fixture', () => {
  for (const c of cases) assertClose(predictMlp(model.mlp, c.features!), c.mlp!, 1e-9, c.name);
});

test('the tree model matches the Python reference on every fixture', () => {
  for (const c of cases) assertClose(predictGbt(model.gbt, c.features!), c.gbt!, 1e-9, c.name);
});

test('the final probability is the average of the two models', () => {
  for (const c of cases) {
    assertClose(predictProbability(model, c.features!), c.probability!, 1e-9, c.name);
    assertClose(predictProbability(model, c.features!), (c.mlp! + c.gbt!) / 2, 1e-9, c.name);
  }
});

test('a feature vector of the wrong length is refused', () => {
  assert.throws(() => predictProbability(model, [1, 2, 3]), /expects \d+ features/);
});

test('a feature vector containing a non-number is refused', () => {
  const broken = [...cases[0].features!];
  broken[5] = Number.NaN;
  assert.throws(() => predictProbability(model, broken), /not a finite number/);
});

test('the score puts the decision line at 50', () => {
  assert.equal(toScore(0, 0.25), 0);
  assert.equal(toScore(0.25, 0.25), 50);
  assert.equal(toScore(1, 0.25), 100);
  assert.equal(toScore(0.125, 0.25), 25);
  assert.equal(toScore(0.625, 0.25), 75);
});

test('a probability just under the line never shows as 50', () => {
  assert.equal(toScore(0.2499999, 0.25), 49);
});

test('a probability at or above the line never shows under 50', () => {
  assert.equal(toScore(0.2500001, 0.25), 50);
});

test('the score never falls as the probability rises', () => {
  let previous = -1;
  for (let i = 0; i <= 1000; i++) {
    const score = toScore(i / 1000, 0.136);
    assert.ok(score >= previous);
    assert.ok(Number.isInteger(score) && score >= 0 && score <= 100);
    previous = score;
  }
});
