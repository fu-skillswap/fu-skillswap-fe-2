/**
 * @file Checkbox.tsx
 * @description Accessible Checkbox primitive for SkillSwap UI Foundation.
 */

import React, { type InputHTMLAttributes } from 'react';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
  error?: string;
}

export function Checkbox({ label, id, name, className = '', disabled, ...props }: CheckboxProps) {
  const checkboxId = id ?? name;
  return (
    <label
      htmlFor={checkboxId}
      className={`ui-checkbox-wrapper ${disabled ? 'ui-checkbox-disabled' : ''} ${className}`.trim()}
    >
      <input
        type="checkbox"
        id={checkboxId}
        name={name}
        disabled={disabled}
        className="ui-checkbox-input"
        {...props}
      />
      <span className="ui-checkbox-box" aria-hidden="true">
        <svg className="ui-checkbox-check" viewBox="0 0 14 14" fill="none" stroke="currentColor">
          <path
            d="M2.5 7L5.5 10L11.5 3.5"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {label && <span className="ui-checkbox-label">{label}</span>}
    </label>
  );
}
