/**
 * @file RadioGroup.tsx
 * @description Accessible Radio Group primitive for SkillSwap UI Foundation.
 */

import React from 'react';

export interface RadioOptionProps {
  value: string;
  label: React.ReactNode;
  name: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: string) => void;
  className?: string;
}

export function RadioOption({
  value,
  label,
  name,
  checked,
  disabled,
  onChange,
  className = '',
}: RadioOptionProps) {
  const radioId = `${name}-${value}`;
  return (
    <label
      htmlFor={radioId}
      className={`inline-flex items-center gap-2 cursor-pointer select-none text-xs font-medium text-text-main ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`.trim()}
    >
      <input
        type="radio"
        id={radioId}
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={() => onChange(value)}
        className="sr-only peer"
      />
      <span className="w-4.5 h-4.5 rounded-full border border-solid border-border-strong bg-white relative flex items-center justify-center transition-all duration-150 peer-checked:border-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary-border" aria-hidden="true">
        <span className="w-2 h-2 rounded-full bg-primary opacity-0 transition-opacity duration-150 peer-checked:opacity-100" />
      </span>
      <span>{label}</span>
    </label>
  );
}

export interface RadioGroupProps {
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: React.ReactNode; disabled?: boolean }[];
  direction?: 'horizontal' | 'vertical';
  className?: string;
}

export function RadioGroup({
  name,
  value,
  onChange,
  options,
  direction = 'horizontal',
  className = '',
}: RadioGroupProps) {
  const directionClasses = direction === 'vertical' ? 'flex-direction-col gap-2' : 'flex-row flex-wrap gap-6';
  return (
    <div
      role="radiogroup"
      className={`flex ${directionClasses} ${className}`.trim()}
    >
      {options.map((opt) => (
        <RadioOption
          key={opt.value}
          name={name}
          value={opt.value}
          label={opt.label}
          checked={value === opt.value}
          disabled={opt.disabled}
          onChange={onChange}
        />
      ))}
    </div>
  );
}
