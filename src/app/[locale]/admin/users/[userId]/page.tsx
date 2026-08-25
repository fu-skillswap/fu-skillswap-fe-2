/**
 * @file page.tsx
 * @description Route chi tiết người dùng dành cho quản trị viên.
 */

import { AdminUserDetailView } from '@/views/admin/AdminUserDetailView';

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ locale: string; userId: string }>;
}) {
  const { locale, userId } = await params;

  return <AdminUserDetailView locale={locale} userId={userId} />;
}
