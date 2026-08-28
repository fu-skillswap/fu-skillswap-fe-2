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

export function Badge({ variant = 'neutral', children, icon, className = '' }: BadgeProps) {
  return (
    <span className={`ui-badge ui-badge-${variant} ${className}`.trim()}>
      {icon && <span className="ui-badge-icon">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}
