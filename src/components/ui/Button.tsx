/**
 * @file Button.tsx
 * @description Component Nút bấm dùng chung (Reusable UI Button Component).
 */

import type { ButtonHTMLAttributes } from 'react';

/**
 * Component Button wrapper bọc HTML button chuẩn với class mặc định.
 */
export function Button({ className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={`button ${className}`} {...props} />;
}
