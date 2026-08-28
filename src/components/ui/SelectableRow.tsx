/**
 * @file SelectableRow.tsx
 * @description Card-style Selection Item primitive for SkillSwap UI Foundation.
 */

import React from 'react';
import { Checkbox } from './Checkbox';

export interface SelectableRowProps {
  selected: boolean;
  onSelect: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  badge?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export function SelectableRow({
  selected,
  onSelect,
  title,
  description,
  badge,
  disabled,
  className = '',
}: SelectableRowProps) {
  return (
    <div
      className={`ui-selectable-row ${selected ? 'ui-selectable-row-selected' : ''} ${disabled ? 'ui-selectable-row-disabled' : ''} ${className}`.trim()}
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
      <div className="ui-selectable-row-control">
        <Checkbox checked={selected} onChange={() => {}} disabled={disabled} tabIndex={-1} />
      </div>
      <div className="ui-selectable-row-content">
        <div className="ui-selectable-row-title-bar">
          <span className="ui-selectable-row-title">{title}</span>
          {badge && <span className="ui-selectable-row-badge">{badge}</span>}
        </div>
        {description && <div className="ui-selectable-row-desc">{description}</div>}
      </div>
    </div>
  );
}
