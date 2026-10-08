import type { ReactNode } from 'react';
import { cx } from './cx';

/** Centred column that every screen sits in. */
export function Page({ children, narrow = false, className }: { children: ReactNode; narrow?: boolean; className?: string }) {
  return (
    <div className={cx('mx-auto w-full px-5 sm:px-6', narrow ? 'max-w-[760px]' : 'max-w-[1080px]', className)}>
      {children}
    </div>
  );
}

/** Screen title with an optional one-line introduction. */
export function PageHeader({ title, lede, children }: { title: string; lede?: string; children?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 pb-6 pt-10">
      <div>
        <h1 className="h-page">{title}</h1>
        {lede && <p className="mt-2 max-w-[46em] text-muted">{lede}</p>}
      </div>
      {children}
    </header>
  );
}
