/**
 * @file Badge.tsx
 * @description Status Badge primitive for SkillSwap UI Foundation.
 */

import React from 'react';

export interface BadgeProps {
  variant?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

const variantStyles: Record<NonNullable<BadgeProps['variant']>, { bg: string; dot: string }> = {
  neutral: { bg: 'bg-surface-subtle text-text-secondary border-border-color/80', dot: 'bg-text-disabled' },
  success: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 shadow-xs', dot: 'bg-emerald-500' },
  warning: { bg: 'bg-amber-50 text-amber-700 border-amber-200/80 shadow-xs', dot: 'bg-amber-500' },
  danger: { bg: 'bg-rose-50 text-rose-700 border-rose-200/80 shadow-xs', dot: 'bg-rose-500' },
  info: { bg: 'bg-blue-50 text-primary border-primary-border/60 shadow-xs', dot: 'bg-primary' },
};

export function Badge({ variant = 'neutral', children, icon, className = '' }: BadgeProps) {
  const style = variantStyles[variant];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold tracking-tight rounded-full border border-solid transition-all ${style.bg} ${className}`.trim()}
    >
      {icon ? (
        <span className="inline-flex shrink-0 items-center justify-center">{icon}</span>
      ) : (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} aria-hidden="true" />
      )}
      <span>{children}</span>
    </span>
  );
}
