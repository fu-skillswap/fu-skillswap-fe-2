/**
 * @file layout.tsx
 * @description Layout bảo vệ dùng chung cho toàn bộ khu vực quản trị.
 */

import { AdminGuard } from '@/components/auth/AdminGuard';
import { AdminSidebar } from '@/components/domain/admin/AdminSidebar';

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <AdminGuard locale={locale}>
      <div className="admin-area-shell">
        <AdminSidebar locale={locale} />
        {children}
      </div>
    </AdminGuard>
  );
}
