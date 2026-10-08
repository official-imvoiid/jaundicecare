import { cx } from './cx';

export type ButtonVariant = 'primary' | 'secondary' | 'danger';
export type ButtonSize = 'md' | 'sm';

const base =
  'inline-flex items-center justify-center gap-2 rounded-lg border text-center no-underline transition-colors disabled:cursor-not-allowed disabled:opacity-50';

const sizes: Record<ButtonSize, string> = {
  md: 'min-h-11 px-5 py-2.5 text-base',
  sm: 'min-h-9 px-3 py-1.5 text-sm',
};

const variants: Record<ButtonVariant, string> = {
  primary: 'border-brand bg-brand font-semibold text-white hover:border-brand-hover hover:bg-brand-hover',
  secondary: 'border-line-strong bg-surface font-medium text-ink hover:bg-sunken',
  danger: 'border-danger bg-danger font-semibold text-white hover:opacity-90',
};

/** Classes for anything that should look like a button (a real button, or a link such as tel:). */
export const buttonClass = (variant: ButtonVariant = 'secondary', size: ButtonSize = 'md', extra?: string) =>
  cx(base, sizes[size], variants[variant], extra);
