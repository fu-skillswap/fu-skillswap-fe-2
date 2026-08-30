/**
 * @file TextField.tsx
 * @description Component Ô nhập liệu văn bản dùng chung (Reusable UI Input Field Component).
 */

import React, { type InputHTMLAttributes } from 'react';

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  error?: string;
  helperText?: string;
}

export function TextField({
  label,
  error,
  helperText,
  id,
  name,
  className = '',
  ...props
}: TextFieldProps) {
  const fieldId = id ?? name;
  const inputEl = (
    <input
      id={fieldId}
      name={name}
      className={`ui-input ${error ? 'ui-input-error' : ''} ${className}`.trim()}
      {...props}
    />
  );

  if (!label && !error && !helperText) {
    return inputEl;
  }

  return (
    <div className="ui-form-field">
      {label && (
        <label htmlFor={fieldId} className="ui-form-label">
          {label}
          {props.required && <span className="ui-required-asterisk">*</span>}
        </label>
      )}
      {inputEl}
      {helperText && !error && <p className="ui-form-helper">{helperText}</p>}
      {error && <p className="ui-form-error">{error}</p>}
    </div>
  );
}
