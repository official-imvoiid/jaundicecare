import type { ButtonHTMLAttributes } from 'react';
import { buttonClass } from './buttonClass';
import type { ButtonSize, ButtonVariant } from './buttonClass';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({ variant = 'secondary', size = 'md', className, type = 'button', ...rest }: ButtonProps) {
  return <button type={type} className={buttonClass(variant, size, className)} {...rest} />;
}
