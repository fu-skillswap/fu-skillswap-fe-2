/**
 * @file authSchema.ts
 * @description Schema validation dữ liệu các biểu mẫu liên quan đến xác thực (Auth Validation Schema) bằng Yup.
 */

import * as yup from "yup";

/** Quy tắc kiểm tra tính hợp lệ biểu mẫu Đăng nhập */
export const loginSchema = yup.object().shape({
  email: yup
    .string()
    .required("Email không được để trống.")
    .email("Email không đúng định dạng."),
  password: yup
    .string()
    .required("Mật khẩu không được để trống.")
    .min(6, "Mật khẩu cần tối thiểu 6 ký tự."),
});

/** Dữ liệu form nhập liệu đăng nhập suy ra từ Yup Schema */
export type LoginFormValues = yup.InferType<typeof loginSchema>;
