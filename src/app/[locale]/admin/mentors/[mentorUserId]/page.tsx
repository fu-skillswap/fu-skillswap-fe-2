/**
 * @file page.tsx
 * @description Route chi tiết mentor dành cho quản trị viên.
 */

import { AdminMentorDetailView } from '@/views/admin/AdminMentorDetailView';

export default async function AdminMentorDetailPage({
  params,
}: {
  params: Promise<{ locale: string; mentorUserId: string }>;
}) {
  const { locale, mentorUserId } = await params;

  return <AdminMentorDetailView locale={locale} mentorUserId={mentorUserId} />;
}
