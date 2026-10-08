import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildOverlay } from '../src/ml/overlay.ts';

// Four pixels: [not skin, skin with little yellow, skin with medium yellow, skin with strong yellow]
const skin = Uint8Array.from([0, 1, 1, 1]);
const bStar = Float64Array.from([5, 10, 20, 40]);
const range = { low: 10, high: 30 };
const alphaAt = (pixels: Uint8ClampedArray, p: number) => pixels[p * 4 + 3];

test('the skin view dims everything that is not skin and leaves skin clear', () => {
  const overlay = buildOverlay('skin', skin, bStar, range);
  assert.equal(overlay.length, 16);
  assert.ok(alphaAt(overlay, 0) > 100);
  assert.equal(alphaAt(overlay, 1), 0);
  assert.equal(alphaAt(overlay, 3), 0);
});

test('the yellow view tints skin more strongly the more yellow it is', () => {
  const overlay = buildOverlay('yellow', skin, bStar, range);
  assert.equal(alphaAt(overlay, 1), 0); // at the low end of the range: no tint
  assert.ok(alphaAt(overlay, 2) > 0);
  assert.ok(alphaAt(overlay, 3) > alphaAt(overlay, 2));
});

test('the yellow view stops getting stronger above the top of the range', () => {
  const overlay = buildOverlay('yellow', Uint8Array.from([1, 1]), Float64Array.from([30, 90]), range);
  assert.equal(alphaAt(overlay, 0), alphaAt(overlay, 1));
});

test('the yellow view also dims what is not skin, so the tint is not mistaken for background', () => {
  const overlay = buildOverlay('yellow', skin, bStar, range);
  assert.ok(alphaAt(overlay, 0) > 0);
  // background is dimmed with a dark colour, skin is tinted with a warm one
  assert.ok(overlay[0] < 60);
  assert.ok(overlay[3 * 4] > 150);
});
