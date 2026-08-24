/**
 * @file page.tsx
 * @description Route duyệt hồ sơ mentor của quản trị viên.
 */

import { MentorVerificationView } from '@/views/admin/MentorVerificationView';

export default async function MentorVerificationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return <MentorVerificationView locale={locale} />;
}
