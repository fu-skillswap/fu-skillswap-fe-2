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
    <div className={`flex flex-col gap-1.5 w-full ${className}`.trim()}>
      {label && (
        <label htmlFor={htmlFor} className="text-xs font-semibold text-text-secondary flex items-center gap-1">
          {label}
          {required && <span className="text-danger font-bold">*</span>}
        </label>
      )}
      <div className="w-full">{children}</div>
      {helperText && !error && <p className="text-[11px] text-text-muted m-0">{helperText}</p>}
      {error && <p className="text-[11px] text-danger font-medium m-0">{error}</p>}
    </div>
  );
}
