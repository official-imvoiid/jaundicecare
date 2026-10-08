import type { ReactNode } from 'react';
import { cx } from './cx';
import type { Tone } from './Notice';

const tones: Record<Tone, string> = {
  neutral: 'border-line bg-sunken text-body',
  brand: 'border-brand-line bg-brand-tint text-brand',
  warn: 'border-warn-line bg-warn-tint text-warn',
  danger: 'border-danger-line bg-danger-tint text-danger',
};

/** A short status label. */
export function Tag({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={cx('inline-block whitespace-nowrap rounded-md border px-2 py-0.5 text-[0.8125rem] font-medium', tones[tone])}>
      {children}
    </span>
  );
}
