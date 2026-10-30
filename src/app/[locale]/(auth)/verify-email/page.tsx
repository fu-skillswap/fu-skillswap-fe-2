/**
 * @file page.tsx
 * @description Route trang Xác thực email (`/[locale]/verify-email?email=`).
 * Without an email there is nothing to verify, so the user goes back to the register form.
 */

import { VerifyEmailView } from '@/views/auth/verify-email/VerifyEmailView';
import { redirect } from 'next/navigation';

export default async function VerifyEmailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ email?: string | string[] }>;
}) {
  const { locale } = await params;
  const { email } = await searchParams;
  const value = (Array.isArray(email) ? email[0] : email)?.trim();
  if (!value) redirect(`/${locale}/register`);
  return <VerifyEmailView locale={locale} email={value} />;
}
