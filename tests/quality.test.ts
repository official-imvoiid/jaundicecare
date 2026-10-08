import { test } from 'node:test';
import assert from 'node:assert/strict';
import { judgeQuality, measureQuality } from '../src/ml/quality.ts';
import { paint } from './helpers.ts';

test('a flat grey image has mid brightness and no sharpness', () => {
  const quality = measureQuality(paint(32, 32, () => [128, 128, 128]), 32, 32);
  assert.equal(quality.brightness, 50);
  assert.equal(quality.sharpness, 0);
});

test('brightness runs from 0 for black to 100 for white', () => {
  assert.equal(measureQuality(paint(8, 8, () => [0, 0, 0]), 8, 8).brightness, 0);
  assert.equal(measureQuality(paint(8, 8, () => [255, 255, 255]), 8, 8).brightness, 100);
});

test('one-pixel stripes reach the top of the sharpness scale', () => {
  const stripes = paint(32, 32, (_x, y) => (y % 2 === 0 ? [0, 0, 0] : [255, 255, 255]));
  assert.equal(measureQuality(stripes, 32, 32).sharpness, 100);
});

test('a gentle gradient scores lower sharpness than fine detail', () => {
  const gradient = paint(64, 64, (_x, y) => [y * 4, y * 4, y * 4]);
  const detail = paint(64, 64, (x, y) => ((x + y) % 2 === 0 ? [90, 90, 90] : [150, 150, 150]));
  assert.ok(measureQuality(gradient, 64, 64).sharpness < 5);
  assert.ok(measureQuality(detail, 64, 64).sharpness > 50);
});

test('a well lit, sharp photo with skin passes', () => {
  const check = judgeQuality({ brightness: 60, sharpness: 45 }, 3000, 10000);
  assert.deepEqual(check, { ok: true, brightness: 60, sharpness: 45, skinPercent: 30, issues: [] });
});

test('a dark photo is rejected as too dark', () => {
  assert.deepEqual(judgeQuality({ brightness: 31, sharpness: 45 }, 3000, 10000).issues, ['too_dark']);
});

test('an overexposed photo is rejected as too bright', () => {
  assert.deepEqual(judgeQuality({ brightness: 95, sharpness: 45 }, 3000, 10000).issues, ['too_bright']);
});

test('a blurred photo is rejected as blurry', () => {
  assert.deepEqual(judgeQuality({ brightness: 60, sharpness: 19 }, 3000, 10000).issues, ['blurry']);
});

test('a photo with under 3% skin is rejected as having no skin', () => {
  const check = judgeQuality({ brightness: 60, sharpness: 45 }, 299, 10000);
  assert.equal(check.ok, false);
  assert.deepEqual(check.issues, ['no_skin']);
  assert.equal(check.skinPercent, 3); // 2.99% rounds to 3 for display but is still under the limit
});

test('the limits themselves are accepted', () => {
  assert.equal(judgeQuality({ brightness: 32, sharpness: 20 }, 300, 10000).ok, true);
  assert.equal(judgeQuality({ brightness: 94, sharpness: 20 }, 300, 10000).ok, true);
});

test('every problem is reported, not just the first', () => {
  assert.deepEqual(judgeQuality({ brightness: 10, sharpness: 5 }, 0, 10000).issues, ['too_dark', 'blurry', 'no_skin']);
});
