import type { AdviceLevel, AgeBand, Indication, WarningAnswers, YesNo } from '../domain/types.ts';

// The six yes / no / not sure questions, in the order they are asked
export const WARNING_SIGNS = ['palms', 'feeding', 'sleepy', 'cry', 'stool', 'fever'] as const;
export type WarningSign = (typeof WARNING_SIGNS)[number];

// Signs that need a hospital straight away, whatever the photo showed
const URGENT_SIGNS = ['palms', 'feeding', 'sleepy', 'cry', 'fever'] as const;

/**
 * The answers as one record, or null while any question is unanswered.
 * Only the six signs are read from `signs`, so an age that came along with
 * pre-loaded answers can never override the age chosen now.
 */
export function completeAnswers(
  age: AgeBand | null,
  signs: Partial<Record<WarningSign, YesNo>>,
): WarningAnswers | null {
  if (!age) return null;
  const { palms, feeding, sleepy, cry, stool, fever } = signs;
  if (!palms || !feeding || !sleepy || !cry || !stool || !fever) return null;
  return { age, palms, feeding, sleepy, cry, stool, fever };
}

/**
 * Turns the warning-sign answers and the photo result into one piece of advice.
 * General guidance for parents, not a diagnosis.
 */
export function adviseFrom(answers: WarningAnswers, indication: Indication | null): AdviceLevel {
  const signsSeen = indication === 'signs_seen';

  if (URGENT_SIGNS.some(sign => answers[sign] === 'yes')) return 'urgent';
  // Jaundice in the first day of life always needs a doctor straight away
  if (answers.age === 'under_24h' && signsSeen) return 'urgent';

  if (answers.stool === 'yes') return 'doctor_today';
  if (signsSeen) return 'doctor_today';
  if (URGENT_SIGNS.some(sign => answers[sign] === 'not_sure')) return 'doctor_today';

  return 'watch';
}
