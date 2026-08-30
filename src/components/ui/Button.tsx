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
  const variantClass = `ui-btn-${variant}`;
  const sizeClass = `ui-btn-${size}`;
  const loadingClass = loading ? 'ui-btn-loading' : '';

  return (
    <button
      className={`ui-btn ${variantClass} ${sizeClass} ${loadingClass} ${className}`.trim()}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="ui-btn-spinner" aria-hidden="true" />
      ) : (
        leftIcon && <span className="ui-btn-icon-left">{leftIcon}</span>
      )}
      {children && <span className="ui-btn-text">{children}</span>}
      {!loading && rightIcon && <span className="ui-btn-icon-right">{rightIcon}</span>}
    </button>
  );
}
