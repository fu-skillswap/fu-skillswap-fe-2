/**
 * @file page.tsx
 * @description Route trang Đăng nhập (`/[locale]/login`).
 * Nhận parameter `locale` từ URL và render giao diện `LoginView`.
 */

import { LoginView } from '@/views/auth/LoginView';

/**
 * Server Component cho trang Đăng nhập.
 */
export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <LoginView locale={locale} />;
}
