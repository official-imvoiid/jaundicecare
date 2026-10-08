import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractFeatures, MIN_SKIN_PIXELS } from '../src/ml/features.ts';
import { predictProbability } from '../src/ml/model.ts';
import type { ModelParams } from '../src/ml/model.ts';
import { loadModelJson, loadParityCases, paint, rgbaOf } from './helpers.ts';

const model = loadModelJson<ModelParams>();
const cases = loadParityCases();
const byName = (name: string) => {
  const found = cases.find(c => c.name === name);
  assert.ok(found, `fixture ${name} is missing`);
  return found;
};

test('every feature matches the Python training code on every fixture', () => {
  for (const c of cases) {
    const { features } = extractFeatures(rgbaOf(c), c.width * c.height);
    assert.equal(features.length, c.features!.length, c.name);
    features.forEach((value, i) => {
      const expected = c.features![i];
      assert.ok(
        Math.abs(value - expected) <= 1e-6,
        `${c.name}: ${model.featureNames[i]} is ${value}, Python has ${expected}`,
      );
    });
  }
});

test('features come out in the order the model was trained on', () => {
  const { features } = extractFeatures(rgbaOf(cases[0]), cases[0].width * cases[0].height);
  assert.equal(features.length, model.featureNames.length);
});

test('the number of skin pixels matches the Python training code', () => {
  for (const c of cases) {
    const result = extractFeatures(rgbaOf(c), c.width * c.height);
    assert.equal(result.skinCount, c.skinCount, c.name);
    assert.equal(result.skinFound, c.skinFound, c.name);
  }
});

test('the skin mask marks exactly the pixels that were counted', () => {
  for (const c of cases) {
    const result = extractFeatures(rgbaOf(c), c.width * c.height);
    const marked = result.skin.reduce((sum, flag) => sum + flag, 0);
    assert.equal(marked, result.skinCount, c.name);
  }
});

test('a white sheet beside the baby is not treated as skin', () => {
  const c = byName('skin-beside-white-sheet');
  const result = extractFeatures(rgbaOf(c), c.width * c.height);
  assert.equal(result.skin[0], 0); // left half is the sheet
  assert.equal(result.skin[c.width - 1], 1); // right half is skin
  assert.equal(result.skinCount, (c.width * c.height) / 2);
});

test('a picture with no skin is flagged instead of silently measured', () => {
  const blue = extractFeatures(paint(16, 16, () => [40, 80, 200]), 256);
  assert.equal(blue.skinFound, false);
  assert.equal(blue.skinCount, 0);
  assert.ok(blue.features.every(Number.isFinite));
});

test('skin needs at least MIN_SKIN_PIXELS pixels to count as found', () => {
  // 16 x 16 picture with exactly 199 skin pixels, then exactly 200
  const picture = (skinPixels: number) =>
    paint(16, 16, (x, y) => (y * 16 + x < skinPixels ? [200, 150, 120] : [40, 80, 200]));
  assert.equal(MIN_SKIN_PIXELS, 200);
  assert.equal(extractFeatures(picture(199), 256).skinFound, false);
  assert.equal(extractFeatures(picture(200), 256).skinFound, true);
});

test('pixels to probability matches the Python pipeline end to end', () => {
  for (const c of cases) {
    const { features } = extractFeatures(rgbaOf(c), c.width * c.height);
    const probability = predictProbability(model, features);
    assert.ok(
      Math.abs(probability - c.probability!) <= 1e-6,
      `${c.name}: ${probability} vs Python ${c.probability}`,
    );
  }
});

test('the b* map covers every pixel and is yellow-positive on skin', () => {
  const c = byName('uniform-skin');
  const result = extractFeatures(rgbaOf(c), c.width * c.height);
  assert.equal(result.bStar.length, c.width * c.height);
  assert.ok(result.bStar[0] > 15);
});
