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
      className={`w-full h-10 rounded-xl border border-solid border-border-color bg-white text-text-main px-3.5 text-xs transition-all duration-200 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 shadow-2xs hover:border-border-strong disabled:opacity-50 disabled:cursor-not-allowed ${error ? '!border-danger focus:!ring-danger/10' : ''} ${className}`.trim()}
      {...props}
    />
  );

  if (!label && !error && !helperText) {
    return inputEl;
  }

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={fieldId} className="text-xs font-semibold text-text-secondary flex items-center gap-1">
          {label}
          {props.required && <span className="text-danger font-bold">*</span>}
        </label>
      )}
      {inputEl}
      {helperText && !error && <p className="text-[11px] text-text-muted m-0">{helperText}</p>}
      {error && <p className="text-[11px] text-danger font-medium m-0">{error}</p>}
    </div>
  );
}
