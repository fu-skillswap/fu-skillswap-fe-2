/**
 * @file TextArea.tsx
 * @description TextArea component primitive with FormField integration.
 */

import React, { type TextareaHTMLAttributes } from 'react';

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: React.ReactNode;
  error?: string;
  helperText?: string;
}

export function TextArea({
  label,
  error,
  helperText,
  id,
  name,
  className = '',
  ...props
}: TextAreaProps) {
  const fieldId = id ?? name;
  const textareaEl = (
    <textarea
      id={fieldId}
      name={name}
      className={`w-full min-h-[100px] rounded-xl border border-solid border-border-color bg-white text-text-main p-3 text-xs resize-y transition-all duration-150 outline-none focus:border-primary focus:ring-3 focus:ring-primary-border disabled:opacity-50 disabled:cursor-not-allowed ${error ? '!border-danger' : ''} ${className}`.trim()}
      {...props}
    />
  );

  if (!label && !error && !helperText) {
    return textareaEl;
  }

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={fieldId} className="text-xs font-semibold text-text-secondary flex items-center gap-1">
          {label}
          {props.required && <span className="text-danger font-bold">*</span>}
        </label>
      )}
      {textareaEl}
      {helperText && !error && <p className="text-[11px] text-text-muted m-0">{helperText}</p>}
      {error && <p className="text-[11px] text-danger font-medium m-0">{error}</p>}
    </div>
  );
}
