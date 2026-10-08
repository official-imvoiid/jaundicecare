import { useCallback } from 'react';
import { useApp } from '../state/appContext';
import { en } from './en';
import type { MessageKey } from './en';
import { format } from './format';
import { hi } from './hi';

export type Translate = (key: MessageKey, values?: Record<string, string | number>) => string;

/** Text in the language the parent chose. */
export function useT(): Translate {
  const { language } = useApp();
  return useCallback(
    (key, values) => format((language === 'hi' ? hi : en)[key], values),
    [language],
  );
}
