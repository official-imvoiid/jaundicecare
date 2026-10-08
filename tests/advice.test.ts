import { test } from 'node:test';
import assert from 'node:assert/strict';
import { adviseFrom, completeAnswers } from '../src/logic/advice.ts';
import type { WarningAnswers } from '../src/domain/types.ts';

const allNo: WarningAnswers = {
  age: 'day_3_7',
  palms: 'no',
  feeding: 'no',
  sleepy: 'no',
  cry: 'no',
  stool: 'no',
  fever: 'no',
};
const answers = (changes: Partial<WarningAnswers>): WarningAnswers => ({ ...allNo, ...changes });

test('no warning signs and a clear photo means keep watching', () => {
  assert.equal(adviseFrom(allNo, 'no_signs'), 'watch');
});

test('no warning signs and no photo check means keep watching', () => {
  assert.equal(adviseFrom(allNo, null), 'watch');
});

test('yellow palms or soles is urgent', () => {
  assert.equal(adviseFrom(answers({ palms: 'yes' }), 'no_signs'), 'urgent');
});

test('poor feeding is urgent', () => {
  assert.equal(adviseFrom(answers({ feeding: 'yes' }), 'no_signs'), 'urgent');
});

test('a very sleepy or floppy baby is urgent', () => {
  assert.equal(adviseFrom(answers({ sleepy: 'yes' }), 'no_signs'), 'urgent');
});

test('a high-pitched cry or arching is urgent', () => {
  assert.equal(adviseFrom(answers({ cry: 'yes' }), 'no_signs'), 'urgent');
});

test('fever or feeling cold is urgent', () => {
  assert.equal(adviseFrom(answers({ fever: 'yes' }), null), 'urgent');
});

test('signs in the photo of a baby under 24 hours old is urgent', () => {
  assert.equal(adviseFrom(answers({ age: 'under_24h' }), 'signs_seen'), 'urgent');
});

test('a baby under 24 hours old with a clear photo and no signs is not urgent', () => {
  assert.equal(adviseFrom(answers({ age: 'under_24h' }), 'no_signs'), 'watch');
});

test('pale stools or dark urine means see a doctor today', () => {
  assert.equal(adviseFrom(answers({ stool: 'yes' }), 'no_signs'), 'doctor_today');
});

test('signs in the photo mean see a doctor today even when every answer is no', () => {
  assert.equal(adviseFrom(allNo, 'signs_seen'), 'doctor_today');
});

test('signs in the photo after two weeks mean see a doctor today', () => {
  assert.equal(adviseFrom(answers({ age: 'over_14d' }), 'signs_seen'), 'doctor_today');
});

test('being unsure about an urgent sign means see a doctor today', () => {
  for (const sign of ['palms', 'feeding', 'sleepy', 'cry', 'fever'] as const) {
    assert.equal(adviseFrom(answers({ [sign]: 'not_sure' }), 'no_signs'), 'doctor_today', sign);
  }
});

test('answers are complete only when the age and all six signs are answered', () => {
  const signs = { palms: 'no', feeding: 'no', sleepy: 'no', cry: 'no', stool: 'no', fever: 'no' } as const;
  assert.deepEqual(completeAnswers('day_3_7', signs), allNo);
  assert.equal(completeAnswers(null, signs), null);
  assert.equal(completeAnswers('day_3_7', { ...signs, fever: undefined }), null);
  assert.equal(completeAnswers('day_3_7', {}), null);
});

test('a newly chosen age replaces the age saved with earlier answers', () => {
  // the sign answers are pre-loaded from a saved check, which also carries its old age
  const reloaded = { ...allNo, age: 'over_14d' as const };
  assert.equal(completeAnswers('under_24h', reloaded)?.age, 'under_24h');
});

test('an urgent sign outranks a see-a-doctor sign', () => {
  assert.equal(adviseFrom(answers({ stool: 'yes', fever: 'yes', palms: 'not_sure' }), 'signs_seen'), 'urgent');
});
