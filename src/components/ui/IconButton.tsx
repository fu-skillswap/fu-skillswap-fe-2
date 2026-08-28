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
      className={`ui-icon-btn ui-btn-${variant} ui-btn-icon-${size} ${className}`.trim()}
      disabled={disabled}
      {...props}
    >
      {icon}
    </button>
  );
}
