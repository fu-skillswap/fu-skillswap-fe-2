/**
 * @file page.tsx
 * @description Route trang Tạo tài khoản (`/[locale]/register`).
 */

import { RegisterView } from '@/views/auth/register/RegisterView';

export default async function RegisterPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <RegisterView locale={locale} />;
}
