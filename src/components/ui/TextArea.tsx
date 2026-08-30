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
      className={`ui-textarea ${error ? 'ui-textarea-error' : ''} ${className}`.trim()}
      {...props}
    />
  );

  if (!label && !error && !helperText) {
    return textareaEl;
  }

  return (
    <div className="ui-form-field">
      {label && (
        <label htmlFor={fieldId} className="ui-form-label">
          {label}
          {props.required && <span className="ui-required-asterisk">*</span>}
        </label>
      )}
      {textareaEl}
      {helperText && !error && <p className="ui-form-helper">{helperText}</p>}
      {error && <p className="ui-form-error">{error}</p>}
    </div>
  );
}
