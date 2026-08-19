/**
 * @file authSchema.ts
 * @description Schema validation dữ liệu các biểu mẫu liên quan đến xác thực (Auth Validation Schema).
 */

/** Dữ liệu form nhập liệu đăng nhập */
export interface LoginFormValues {
  email: string;
  password: string;
}

/**
 * Kiểm tra tính hợp lệ của định dạng Email và độ dài Mật khẩu trong biểu mẫu Đăng nhập.
 * @param values - Giá trị người dùng nhập trong form
 * @returns Thông báo lỗi dạng string nếu không hợp lệ, hoặc undefined nếu tất cả đều hợp lệ
 */
export function validateLogin(values: LoginFormValues): string | undefined {
  if (!/^\S+@\S+\.\S+$/.test(values.email)) return "Email không hợp lệ.";
  if (values.password.length < 6) return "Mật khẩu cần tối thiểu 6 ký tự.";
}
