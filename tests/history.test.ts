import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadState, MAX_SCREENINGS, saveState, STORAGE_KEY } from '../src/storage/history.ts';
import type { Screening } from '../src/domain/types.ts';

/** In-memory stand-in for localStorage that refuses values longer than `quota` characters. */
function fakeStore(quota = Infinity) {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      if (value.length > quota) throw new DOMException('quota', 'QuotaExceededError');
      data.set(key, value);
    },
  };
}

const brokenStore = {
  getItem: (): string | null => {
    throw new Error('storage is blocked');
  },
  setItem: (): void => {
    throw new Error('storage is blocked');
  },
};

function screening(id: string, photoLength = 20): Screening {
  return {
    id,
    takenAt: '2026-10-02T09:00:00.000Z',
    photo: 'x'.repeat(photoLength),
    source: 'upload',
    quality: { ok: true, brightness: 60, sharpness: 45, skinPercent: 30, issues: [] },
    analysis: { score: 62, indication: 'signs_seen', signals: [{ group: 'skin_yellow', delta: 9 }], modelVersion: '3.0' },
  };
}

test('what is saved comes back the same', () => {
  const store = fakeStore();
  const state = { screenings: [screening('b'), screening('a')], language: 'hi' as const };
  assert.equal(saveState(store, state).ok, true);
  assert.deepEqual(loadState(store), state);
});

test('an empty store gives an empty English state', () => {
  assert.deepEqual(loadState(fakeStore()), { screenings: [], language: 'en' });
});

test('damaged data is ignored instead of crashing', () => {
  const store = fakeStore();
  store.data.set(STORAGE_KEY, '{not json');
  assert.deepEqual(loadState(store), { screenings: [], language: 'en' });
});

test('entries that are not valid checks are dropped and the rest kept', () => {
  const store = fakeStore();
  store.data.set(STORAGE_KEY, JSON.stringify({ screenings: [{ id: 'bad' }, screening('good'), null, 7], language: 'fr' }));
  const state = loadState(store);
  assert.deepEqual(state.screenings.map(s => s.id), ['good']);
  assert.equal(state.language, 'en');
});

test('only the newest 40 checks are kept', () => {
  const store = fakeStore();
  const many = Array.from({ length: MAX_SCREENINGS + 5 }, (_, i) => screening(`s${i}`));
  const { saved, ok } = saveState(store, { screenings: many, language: 'en' });
  assert.equal(ok, true);
  assert.equal(saved.screenings.length, MAX_SCREENINGS);
  assert.equal(saved.screenings[0].id, 's0'); // the list is newest first
  assert.equal(loadState(store).screenings.length, MAX_SCREENINGS);
});

test('when the browser storage is full the oldest checks are dropped until it fits', () => {
  const store = fakeStore(2600);
  const five = ['e', 'd', 'c', 'b', 'a'].map(id => screening(id, 800)); // newest first, about 1 KB each
  const { saved, ok } = saveState(store, { screenings: five, language: 'en' });
  assert.equal(ok, true);
  assert.ok(saved.screenings.length >= 1 && saved.screenings.length < 5);
  assert.equal(saved.screenings[0].id, 'e');
  assert.deepEqual(loadState(store).screenings.map(s => s.id), saved.screenings.map(s => s.id));
});

test('a store that refuses every write reports failure and keeps the checks in memory', () => {
  const state = { screenings: [screening('a')], language: 'en' as const };
  const { saved, ok } = saveState(brokenStore, state);
  assert.equal(ok, false);
  assert.deepEqual(saved, state);
});

test('a blocked store reads as empty instead of throwing', () => {
  assert.deepEqual(loadState(brokenStore), { screenings: [], language: 'en' });
});

test('a missing store never throws', () => {
  assert.deepEqual(loadState(null), { screenings: [], language: 'en' });
  assert.equal(saveState(null, { screenings: [screening('a')], language: 'hi' }).ok, false);
});
