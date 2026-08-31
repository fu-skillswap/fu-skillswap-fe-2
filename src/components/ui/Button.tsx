/**
 * @file Button.tsx
 * @description Component Nút bấm dùng chung (Reusable UI Button Component).
 */

import type { ButtonHTMLAttributes, ReactNode } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const variantStyles: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-primary text-white border-primary hover:bg-primary-hover shadow-xs hover:shadow-md hover:shadow-primary/20 active:shadow-none',
  secondary: 'bg-surface-subtle text-text-main border-border-color hover:bg-slate-200/60 hover:border-border-strong shadow-xs',
  outline: 'bg-white text-primary border-primary-border hover:bg-primary-light/80 hover:text-primary-hover hover:border-primary shadow-xs',
  ghost: 'bg-transparent text-text-secondary border-transparent hover:bg-surface-subtle hover:text-text-main',
  destructive: 'bg-danger text-white border-danger hover:bg-red-600 shadow-xs hover:shadow-md hover:shadow-danger/20 active:shadow-none',
};

const sizeStyles: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'h-8.5 px-3.5 text-xs gap-1.5 rounded-xl',
  md: 'h-10 px-4.5 text-xs font-bold gap-2 rounded-xl',
  lg: 'h-12 px-6 text-sm font-bold gap-2.5 rounded-2xl',
};

export function Button({
  className = '',
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center font-bold border border-solid whitespace-nowrap transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] outline-none focus-visible:ring-4 focus-visible:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none cursor-pointer ${variantStyles[variant]} ${sizeStyles[size]} ${className}`.trim()}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" aria-hidden="true" />
      ) : (
        leftIcon && <span className="inline-flex shrink-0 items-center justify-center">{leftIcon}</span>
      )}
      {children && <span>{children}</span>}
      {!loading && rightIcon && <span className="inline-flex shrink-0 items-center justify-center">{rightIcon}</span>}
    </button>
  );
}
