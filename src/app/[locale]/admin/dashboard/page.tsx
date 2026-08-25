/**
 * @file page.tsx
 * @description Route Dashboard quản trị viên (`/[locale]/admin/dashboard`).
 * Hiển thị các chỉ số tổng quan hệ thống và danh sách công việc cần xử lý.
 */

import { AdminDashboardView } from '@/views/admin/AdminDashboardView';

/**
 * Server Component cho trang Dashboard Quản trị viên (Admin).
 */
export default function AdminDashboard() {
  return <AdminDashboardView />;
}
