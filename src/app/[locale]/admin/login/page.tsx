/**
 * @file page.tsx
 * @description Route đăng nhập dành riêng cho cổng quản trị.
 */

import { LoginView } from '@/views/auth/LoginView';

export default async function AdminLoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <LoginView locale={locale} adminOnly />;
}
