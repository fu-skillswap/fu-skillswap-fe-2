export interface LoginFormValues {
  email: string;
  password: string;
}

export function validateLogin(values: LoginFormValues): string | undefined {
  if (!/^\S+@\S+\.\S+$/.test(values.email)) return 'Email không hợp lệ.';
  if (values.password.length < 6) return 'Mật khẩu cần tối thiểu 6 ký tự.';
}
