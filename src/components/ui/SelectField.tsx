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
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={id} className="text-xs font-semibold text-text-secondary flex items-center gap-1">
          {label} {required && <span className="text-danger font-bold">*</span>}
        </label>
      )}
      <SelectPrimitive.Root
        value={value !== undefined && value !== null ? String(value) : undefined}
        onValueChange={onValueChange}
        disabled={disabled}
      >
        <SelectPrimitive.Trigger
          id={id}
          className={`h-10 px-3.5 bg-white border border-solid border-border-color hover:border-border-strong rounded-xl flex items-center justify-between text-xs text-text-main transition-all duration-200 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${error ? '!border-danger focus:!ring-danger/10' : ''}`}
          aria-label={typeof label === 'string' ? label : placeholder}
        >
          <SelectPrimitive.Value placeholder={placeholder} />
          <SelectPrimitive.Icon className="text-text-muted shrink-0 ml-2">
            <ChevronDown size={18} />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>

        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-solid border-border-light/80 p-1.5 min-w-[var(--radix-select-trigger-width)] max-h-60 overflow-y-auto z-[99999] animate-in fade-in-0 zoom-in-95 duration-150"
            position="popper"
            sideOffset={6}
          >
            <SelectPrimitive.Viewport className="p-1">
              {options.map((option) => (
                <SelectPrimitive.Item
                  key={option.value}
                  value={String(option.value)}
                  className="flex items-center justify-between px-3 py-2 text-xs font-medium text-text-main rounded-lg outline-none cursor-pointer hover:bg-primary-light hover:text-primary data-[highlighted]:bg-primary-light data-[highlighted]:text-primary transition-colors"
                >
                  <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                  <SelectPrimitive.ItemIndicator className="text-primary shrink-0 ml-2">
                    <Check size={16} />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
      {error && <p className="text-[11px] text-danger font-medium m-0">{error}</p>}
    </div>
  );
}
