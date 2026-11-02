/**
 * @file authSchema.ts
 * @description Schema validation dữ liệu các biểu mẫu liên quan đến xác thực (Auth Validation Schema) bằng Yup.
 */

import * as yup from 'yup';

/** Same rule as the backend register DTO: at least one lowercase, one uppercase and one digit. */
export const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 64;

/** Live checklist rules shown under the register password field. */
export const passwordRules = [
  {
    id: 'length',
    label: 'Từ 8 đến 64 ký tự',
    test: (value: string) =>
      value.length >= PASSWORD_MIN_LENGTH && value.length <= PASSWORD_MAX_LENGTH,
  },
  { id: 'upper', label: 'Có chữ in hoa', test: (value: string) => /[A-Z]/.test(value) },
  { id: 'lower', label: 'Có chữ thường', test: (value: string) => /[a-z]/.test(value) },
  { id: 'digit', label: 'Có ít nhất một số', test: (value: string) => /\d/.test(value) },
] as const;

const emailField = yup
  .string()
  .trim()
  .required('Vui lòng nhập email.')
  .max(255, 'Email tối đa 255 ký tự.')
  .email('Email không đúng định dạng.');

/** Quy tắc kiểm tra tính hợp lệ biểu mẫu Đăng nhập */
export const loginSchema = yup.object().shape({
  email: emailField,
  password: yup.string().required('Vui lòng nhập mật khẩu.'),
});

/** Dữ liệu form nhập liệu đăng nhập suy ra từ Yup Schema */
export type LoginFormValues = yup.InferType<typeof loginSchema>;

/** Register form rules — mirror the backend limits so most errors are caught before submit. */
export const registerSchema = yup.object().shape({
  fullName: yup
    .string()
    .trim()
    .required('Vui lòng nhập họ và tên.')
    .min(2, 'Họ và tên cần từ 2 đến 150 ký tự.')
    .max(150, 'Họ và tên cần từ 2 đến 150 ký tự.'),
  email: emailField,
  password: yup
    .string()
    .required('Vui lòng nhập mật khẩu.')
    .min(PASSWORD_MIN_LENGTH, 'Mật khẩu cần từ 8 đến 64 ký tự.')
    .max(PASSWORD_MAX_LENGTH, 'Mật khẩu cần từ 8 đến 64 ký tự.')
    .matches(PASSWORD_PATTERN, 'Mật khẩu cần có chữ in hoa, chữ thường và ít nhất một số.'),
});

export type RegisterFormValues = yup.InferType<typeof registerSchema>;
