/**
 * @file page.tsx
 * @description Route doanh thu nền tảng (`/[locale]/admin/revenue`).
 * Admin-only through the shared admin layout (AdminGuard + AdminSidebar).
 */

import { AdminRevenueView } from '@/views/admin/revenue/AdminRevenueView';

export default function AdminRevenuePage() {
  return <AdminRevenueView />;
}
