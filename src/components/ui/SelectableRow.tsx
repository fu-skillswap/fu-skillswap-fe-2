/**
 * @file SelectableRow.tsx
 * @description Card-style Selection Item primitive matching reference modal mockup.
 */

import React from 'react';
import { Checkbox } from './Checkbox';

export interface SelectableRowProps {
  selected: boolean;
  onSelect: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export function SelectableRow({
  selected,
  onSelect,
  title,
  description,
  icon,
  badge,
  disabled,
  className = '',
}: SelectableRowProps) {
  return (
    <div
      className={`flex items-start gap-3 p-3.5 rounded-xl border border-solid transition-all duration-150 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary ${selected ? 'bg-primary-light border-primary-border shadow-xs' : 'bg-white border-border-color hover:border-border-strong hover:bg-surface-subtle'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`.trim()}
      onClick={() => !disabled && onSelect()}
      role="checkbox"
      aria-checked={selected}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if (!disabled && (e.key === ' ' || e.key === 'Enter')) {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      <div className="shrink-0 pt-0.5">
        <Checkbox checked={selected} onChange={() => {}} disabled={disabled} tabIndex={-1} />
      </div>
      {icon && <div className="shrink-0 w-8 h-8 rounded-lg bg-surface-subtle flex items-center justify-center text-primary">{icon}</div>}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-text-main">{title}</span>
          {badge && <span className="shrink-0">{badge}</span>}
        </div>
        {description && <div className="text-[11px] text-text-muted mt-0.5">{description}</div>}
      </div>
    </div>
  );
}
