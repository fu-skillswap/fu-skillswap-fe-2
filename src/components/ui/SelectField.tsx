/**
 * @file SelectField.tsx
 * @description Component Dropdown Select sử dụng Radix UI Select primitives.
 * Hỗ trợ bo góc 14px, bóng mịn, tự động định vị popup (floating UI) và animation mượt mà.
 */

'use client';

import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';
import React from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
  id?: string;
  label?: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
}

export function SelectField({
  id,
  label,
  value,
  onValueChange,
  options,
  placeholder = 'Chọn một tùy chọn',
  error,
  disabled,
  required,
}: SelectFieldProps) {
  return (
    <div className="field">
      {label && (
        <label htmlFor={id}>
          {label} {required && <span className="required-asterisk">*</span>}
        </label>
      )}
      <SelectPrimitive.Root
        value={value !== undefined && value !== null ? String(value) : undefined}
        onValueChange={onValueChange}
        disabled={disabled}
      >
        <SelectPrimitive.Trigger
          id={id}
          className="radix-select-trigger"
          aria-label={typeof label === 'string' ? label : placeholder}
        >
          <SelectPrimitive.Value placeholder={placeholder} />
          <SelectPrimitive.Icon className="radix-select-icon">
            <ChevronDown size={18} />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>

        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            className="radix-select-content"
            position="popper"
            sideOffset={6}
          >
            <SelectPrimitive.Viewport className="radix-select-viewport">
              {options.map((option) => (
                <SelectPrimitive.Item
                  key={option.value}
                  value={String(option.value)}
                  className="radix-select-item"
                >
                  <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                  <SelectPrimitive.ItemIndicator className="radix-select-item-indicator">
                    <Check size={16} />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
