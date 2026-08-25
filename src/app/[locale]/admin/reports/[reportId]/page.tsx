/** @file page.tsx @description Route chi tiết báo cáo cộng đồng cho quản trị viên. */

import { AdminReportDetailView } from '@/views/admin/AdminReportDetailView';

export default async function AdminReportDetailPage({
  params,
}: {
  params: Promise<{ locale: string; reportId: string }>;
}) {
  const { locale, reportId } = await params;
  return <AdminReportDetailView locale={locale} reportId={reportId} />;
}
