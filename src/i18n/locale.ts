import type { Language } from '../domain/types';

const localeOf = (language: Language) => (language === 'hi' ? 'hi-IN' : 'en-IN');

/** For example "2 Oct 2026, 9:05 am". */
export function formatDateTime(iso: string, language: Language): string {
  return new Intl.DateTimeFormat(localeOf(language), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));
}

/** For example "2 Oct". */
export function formatDay(iso: string, language: Language): string {
  return new Intl.DateTimeFormat(localeOf(language), { day: 'numeric', month: 'short' }).format(new Date(iso));
}

/** For example "9:05 am". */
export function formatTime(iso: string, language: Language): string {
  return new Intl.DateTimeFormat(localeOf(language), { hour: 'numeric', minute: '2-digit' }).format(new Date(iso));
}

export function isSameDay(firstIso: string, secondIso: string): boolean {
  return new Date(firstIso).toDateString() === new Date(secondIso).toDateString();
}

/** For example "₹1,250". */
export function formatRupees(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}
