/**
 * @file IconButton.tsx
 * @description Accessible Icon Button primitive.
 */

import type { ButtonHTMLAttributes, ReactNode } from 'react';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  'aria-label': string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
}

const variantStyles: Record<NonNullable<IconButtonProps['variant']>, string> = {
  primary: 'bg-primary text-white border-primary hover:bg-primary-hover shadow-xs',
  secondary: 'bg-surface-subtle text-text-main border-border-color hover:bg-border-light',
  outline: 'bg-white text-primary border-primary-border hover:bg-primary-light hover:text-primary-hover',
  ghost: 'bg-transparent text-text-secondary border-transparent hover:bg-surface-subtle hover:text-text-main',
  destructive: 'bg-danger text-white border-danger hover:bg-red-700 shadow-xs',
};

const sizeStyles: Record<NonNullable<IconButtonProps['size']>, string> = {
  sm: 'w-8 h-8 rounded-md text-xs',
  md: 'w-9.5 h-9.5 rounded-md text-sm',
  lg: 'w-11 h-11 rounded-lg text-base',
};

export function IconButton({
  icon,
  'aria-label': ariaLabel,
  variant = 'ghost',
  size = 'md',
  className = '',
  disabled,
  ...props
}: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className={`inline-flex items-center justify-center border border-solid transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${variantStyles[variant]} ${sizeStyles[size]} ${className}`.trim()}
      disabled={disabled}
      {...props}
    >
      {icon}
    </button>
  );
}
