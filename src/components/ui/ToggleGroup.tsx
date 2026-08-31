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
    <div className={`flex flex-wrap gap-2 ${className}`.trim()}>
      {options.map((opt) => {
        const isSelected = value.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            role="checkbox"
            aria-checked={isSelected}
            disabled={opt.disabled}
            className={`h-9 min-w-[42px] px-2.5 text-xs font-bold rounded-md border border-solid transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${isSelected ? 'bg-primary border-primary text-white shadow-xs' : 'bg-surface-subtle border-border-color text-text-secondary hover:bg-border-strong/20 hover:border-border-strong'}`.trim()}
            onClick={() => toggle(opt.value)}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
