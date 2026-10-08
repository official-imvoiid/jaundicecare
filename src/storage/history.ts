import type { Language, Screening } from '../domain/types.ts';

export const STORAGE_KEY = 'jaundicecare:v1';
export const MAX_SCREENINGS = 40;

export interface PersistedState {
  screenings: Screening[]; // newest first
  language: Language;
}

type Reader = Pick<Storage, 'getItem'>;
type Writer = Pick<Storage, 'setItem'>;

const emptyState = (): PersistedState => ({ screenings: [], language: 'en' });

function isScreening(value: unknown): value is Screening {
  if (typeof value !== 'object' || value === null) return false;
  const s = value as Partial<Screening>;
  return (
    typeof s.id === 'string' &&
    typeof s.takenAt === 'string' &&
    typeof s.photo === 'string' &&
    typeof s.quality === 'object' && s.quality !== null &&
    typeof s.analysis === 'object' && s.analysis !== null &&
    typeof s.analysis.score === 'number' &&
    (s.analysis.indication === 'signs_seen' || s.analysis.indication === 'no_signs') &&
    Array.isArray(s.analysis.signals)
  );
}

/** Reads the saved state. A missing, blocked or damaged store reads as empty. */
export function loadState(store: Reader | null): PersistedState {
  try {
    const raw = store?.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as Partial<PersistedState> | null;
    return {
      screenings: Array.isArray(parsed?.screenings) ? parsed.screenings.filter(isScreening) : [],
      language: parsed?.language === 'hi' ? 'hi' : 'en',
    };
  } catch {
    return emptyState();
  }
}

/**
 * Saves the state, keeping the newest MAX_SCREENINGS checks. When the browser
 * storage is full, the oldest checks are dropped until the rest fits.
 * `saved` is the state the app should now hold; `ok` is false when nothing
 * could be written, in which case the checks only live until the page closes.
 */
export function saveState(store: Writer | null, state: PersistedState): { saved: PersistedState; ok: boolean } {
  const capped: PersistedState = { ...state, screenings: state.screenings.slice(0, MAX_SCREENINGS) };
  if (!store) return { saved: capped, ok: false };

  for (let keep = capped.screenings.length; keep >= 0; keep--) {
    const attempt: PersistedState = { ...capped, screenings: capped.screenings.slice(0, keep) };
    try {
      store.setItem(STORAGE_KEY, JSON.stringify(attempt));
      return { saved: attempt, ok: true };
    } catch {
      // too large (or blocked): try again without the oldest check
    }
  }
  return { saved: capped, ok: false };
}
