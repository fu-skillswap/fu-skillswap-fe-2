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
      className={`inline-flex items-center gap-2 cursor-pointer select-none ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`.trim()}
    >
      <input
        type="checkbox"
        id={checkboxId}
        name={name}
        disabled={disabled}
        className="sr-only peer"
        {...props}
      />
      <span className="w-4.5 h-4.5 rounded border border-solid border-border-strong bg-white flex items-center justify-center transition-all duration-150 peer-checked:bg-primary peer-checked:border-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary-border" aria-hidden="true">
        <svg className="w-3 h-3 text-white opacity-0 transition-opacity duration-100 peer-checked:opacity-100" viewBox="0 0 14 14" fill="none" stroke="currentColor">
          <path
            d="M2.5 7L5.5 10L11.5 3.5"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {label && <span className="text-xs text-text-main font-medium">{label}</span>}
    </label>
  );
}
