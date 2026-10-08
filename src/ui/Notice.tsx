import type { ReactNode } from 'react';
import { cx } from './cx';

export type Tone = 'neutral' | 'brand' | 'warn' | 'danger';

const tones: Record<Tone, string> = {
  neutral: 'border-line bg-sunken text-body',
  brand: 'border-brand-line bg-brand-tint text-ink',
  warn: 'border-warn-line bg-warn-tint text-warn-ink',
  danger: 'border-danger-line bg-danger-tint text-danger-ink',
};

interface NoticeProps {
  tone?: Tone;
  title?: string;
  children: ReactNode;
  role?: 'alert' | 'status';
  className?: string;
}

/** A tinted box for something the reader should not miss. */
export function Notice({ tone = 'neutral', title, children, role, className }: NoticeProps) {
  return (
    <div role={role} className={cx('rounded-xl border px-5 py-4', tones[tone], className)}>
      {title && <p className="mb-1 font-semibold">{title}</p>}
      <div className="text-[0.9375rem]">{children}</div>
    </div>
  );
}
