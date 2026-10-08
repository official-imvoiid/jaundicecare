import { test } from 'node:test';
import assert from 'node:assert/strict';
import { en } from '../src/i18n/en.ts';
import { hi } from '../src/i18n/hi.ts';
import { format } from '../src/i18n/format.ts';

const keys = Object.keys(en) as (keyof typeof en)[];
const placeholders = (text: string) => (text.match(/\{[a-zA-Z]+\}/g) ?? []).sort();

test('Hindi has exactly the same messages as English', () => {
  assert.deepEqual(Object.keys(hi).sort(), [...keys].sort());
});

test('no message is empty in either language', () => {
  for (const key of keys) {
    assert.ok(en[key].trim().length > 0, `en ${key}`);
    assert.ok(hi[key].trim().length > 0, `hi ${key}`);
  }
});

test('each message uses the same placeholders in both languages', () => {
  for (const key of keys) {
    assert.deepEqual(placeholders(hi[key]), placeholders(en[key]), key);
  }
});

test('Hindi messages are written in Devanagari', () => {
  const latinOnly = keys.filter(key => !/[ऀ-ॿ]/.test(hi[key]));
  // a few messages are only a number, a file type or a brand name
  assert.ok(latinOnly.length <= 3, `not translated: ${latinOnly.join(', ')}`);
});

test('no message claims technology the app does not have', () => {
  const banned = /opencv|resnet|\bocr\b|hipaa|encrypt|fitzpatrick|sclera|neural/i;
  for (const key of keys) assert.ok(!banned.test(en[key]), `${key}: ${en[key]}`);
});

test('English messages never shout or say please', () => {
  for (const key of keys) {
    assert.ok(!en[key].includes('!'), `${key} has an exclamation mark`);
    assert.ok(!/\bplease\b/i.test(en[key]), `${key} says please`);
  }
});

test('format fills in named values', () => {
  assert.equal(format('Right {accuracy} in 100 times', { accuracy: 83 }), 'Right 83 in 100 times');
  assert.equal(format('{a} and {a} and {b}', { a: 'x', b: 'y' }), 'x and x and y');
});

test('format leaves the text alone when there is nothing to fill in', () => {
  assert.equal(format('Start a check'), 'Start a check');
});

test('format keeps a placeholder visible when its value is missing', () => {
  assert.equal(format('Check {id}', {}), 'Check {id}');
});
