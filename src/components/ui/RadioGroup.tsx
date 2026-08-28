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
      className={`ui-radio-wrapper ${checked ? 'ui-radio-checked' : ''} ${disabled ? 'ui-radio-disabled' : ''} ${className}`.trim()}
    >
      <input
        type="radio"
        id={radioId}
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={() => onChange(value)}
        className="ui-radio-input"
      />
      <span className="ui-radio-dot" aria-hidden="true" />
      <span className="ui-radio-label">{label}</span>
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
  return (
    <div
      role="radiogroup"
      className={`ui-radio-group ui-radio-group-${direction} ${className}`.trim()}
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
