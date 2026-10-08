import type { ReactNode } from 'react';

interface FieldProps {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string | null;
  children: ReactNode;
}

export const inputClass =
  'w-full rounded-lg border border-line-strong bg-surface px-3.5 py-2.5 text-base text-ink placeholder:text-muted';

/** Label, control, optional hint and error message. The control should carry aria-describedby={`${htmlFor}-note`}. */
export function Field({ label, htmlFor, hint, error, children }: FieldProps) {
  return (
    <div>
      <label htmlFor={htmlFor} className="h-label mb-1.5 block">
        {label}
      </label>
      {children}
      {(error || hint) && (
        <p id={`${htmlFor}-note`} className={error ? 'mt-1.5 text-sm text-danger' : 'mt-1.5 text-sm text-muted'}>
          {error || hint}
        </p>
      )}
    </div>
  );
}
