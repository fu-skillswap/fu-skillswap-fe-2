/**
 * @file TextField.tsx
 * @description Component Ô nhập liệu văn bản dùng chung (Reusable UI Input Field Component).
 * Tự động tạo nhãn label, đính kèm ID và hiển thị thông báo lỗi nếu có.
 */

import type { InputHTMLAttributes } from 'react';

/** Props mở rộng từ HTMLInputElement chuẩn */
interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Nhãn mô tả trường nhập liệu */
  label: string;
  /** Thông điệp lỗi dạng text hiển thị dưới ô nhập liệu */
  error?: string;
}

/**
 * Component TextField hiển thị label, input và thông báo lỗi.
 */
export function TextField({ label, error, id, ...props }: TextFieldProps) {
  const fieldId = id ?? props.name;
  return (
    <label className="field" htmlFor={fieldId}>
      <span>{label}</span>
      <input id={fieldId} {...props} />
      {error && <small className="error">{error}</small>}
    </label>
  );
}
