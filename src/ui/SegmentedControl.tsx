import { cx } from './cx';

interface Option<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  label: string; // read by screen readers
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'md' | 'sm';
  stretch?: boolean;
  className?: string;
}

/** A row of buttons where exactly one is pressed: switches a view, it does not submit anything. */
export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
  size = 'md',
  stretch = false,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cx('inline-flex overflow-hidden rounded-lg border border-line-strong bg-surface', stretch && 'flex w-full', className)}
    >
      {options.map(option => (
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
          className={cx(
            'whitespace-nowrap border-l border-line-strong first:border-l-0',
            size === 'sm' ? 'px-2.5 py-1.5 text-sm' : 'px-4 py-2 text-[0.9375rem]',
            stretch && 'flex-1',
            option.value === value ? 'bg-ink text-white' : 'text-body hover:bg-sunken',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
