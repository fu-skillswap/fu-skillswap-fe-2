/**
 * @file FormField.tsx
 * @description Form Field wrapper primitive providing label, asterisks, helper text, and error messages.
 */

import React from 'react';

export interface FormFieldProps {
  label?: React.ReactNode;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormField({
  label,
  htmlFor,
  required,
  error,
  helperText,
  children,
  className = '',
}: FormFieldProps) {
  return (
    <div className={`ui-form-field ${className}`.trim()}>
      {label && (
        <label htmlFor={htmlFor} className="ui-form-label">
          {label}
          {required && <span className="ui-required-asterisk">*</span>}
        </label>
      )}
      <div className="ui-form-control-wrapper">{children}</div>
      {helperText && !error && <p className="ui-form-helper">{helperText}</p>}
      {error && <p className="ui-form-error">{error}</p>}
    </div>
  );
}
