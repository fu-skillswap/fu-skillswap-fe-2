/**
 * @file OtpInput.tsx
 * @description Six single-digit boxes for the email OTP. Digits only, auto-advance, Backspace
 * steps back, and pasting a code fills every box.
 */

'use client';

import {
  useImperativeHandle,
  useRef,
  type ClipboardEvent,
  type KeyboardEvent,
  type Ref,
} from 'react';
import styles from './Auth.module.css';

export const OTP_LENGTH = 6;

export interface OtpInputHandle {
  focusFirst: () => void;
}

interface OtpInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  invalid?: boolean;
  disabled?: boolean;
  describedBy?: string;
  ref?: Ref<OtpInputHandle>;
}

export function OtpInput({ value, onChange, invalid, disabled, describedBy, ref }: OtpInputProps) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useImperativeHandle(ref, () => ({ focusFirst: () => inputs.current[0]?.focus() }), []);

  const focusBox = (index: number) => {
    const box = inputs.current[Math.max(0, Math.min(OTP_LENGTH - 1, index))];
    box?.focus();
    box?.select();
  };

  /** Writes digits starting at `index`, so typing several characters or pasting both work. */
  const fill = (index: number, raw: string) => {
    const digits = raw.replace(/\D/g, '');
    if (!digits) return;
    const next = [...value];
    digits
      .slice(0, OTP_LENGTH - index)
      .split('')
      .forEach((digit, offset) => {
        next[index + offset] = digit;
      });
    onChange(next);
    focusBox(index + digits.length);
  };

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace') {
      event.preventDefault();
      const next = [...value];
      if (next[index]) {
        next[index] = '';
      } else if (index > 0) {
        next[index - 1] = '';
        focusBox(index - 1);
      }
      onChange(next);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      focusBox(index - 1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      focusBox(index + 1);
    }
  };

  const handlePaste = (index: number, event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const digits = event.clipboardData.getData('text').replace(/\D/g, '');
    // A full code always fills from the first box, wherever the cursor is.
    fill(digits.length >= OTP_LENGTH ? 0 : index, digits);
  };

  return (
    <div className={styles.otpGrid}>
      {Array.from({ length: OTP_LENGTH }, (_, index) => (
        <input
          key={index}
          ref={(node) => {
            inputs.current[index] = node;
          }}
          className={styles.otpBox}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={OTP_LENGTH}
          aria-label={`Số thứ ${index + 1}`}
          aria-invalid={invalid ? true : undefined}
          aria-describedby={describedBy}
          disabled={disabled}
          value={value[index] ?? ''}
          onChange={(event) => {
            const typed = event.target.value.replace(value[index] ?? '', '') || event.target.value;
            fill(index, typed);
          }}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={(event) => handlePaste(index, event)}
          onFocus={(event) => event.target.select()}
        />
      ))}
    </div>
  );
}
