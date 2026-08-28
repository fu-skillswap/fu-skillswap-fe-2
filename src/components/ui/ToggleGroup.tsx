/**
 * @file ToggleGroup.tsx
 * @description Multi-select Segmented Chips primitive for SkillSwap UI Foundation.
 */

import React from 'react';

export interface ToggleOption<T extends string = string> {
  value: T;
  label: React.ReactNode;
  disabled?: boolean;
}

export interface ToggleGroupProps<T extends string = string> {
  options: ToggleOption<T>[];
  value: T[];
  onChange: (value: T[]) => void;
  className?: string;
}

export function ToggleGroup<T extends string = string>({
  options,
  value,
  onChange,
  className = '',
}: ToggleGroupProps<T>) {
  const toggle = (optValue: T) => {
    if (value.includes(optValue)) {
      if (value.length > 1) {
        onChange(value.filter((v) => v !== optValue));
      }
    } else {
      onChange([...value, optValue]);
    }
  };

  return (
    <div className={`ui-toggle-group ${className}`.trim()}>
      {options.map((opt) => {
        const isSelected = value.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            role="checkbox"
            aria-checked={isSelected}
            disabled={opt.disabled}
            className={`ui-toggle-chip ${isSelected ? 'ui-toggle-chip-selected' : ''}`.trim()}
            onClick={() => toggle(opt.value)}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
