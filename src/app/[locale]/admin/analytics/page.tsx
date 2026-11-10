/**
 * @file page.tsx
 * @description Route thống kê truy cập (`/[locale]/admin/analytics`).
 * Admin-only through the shared admin layout (AdminGuard + AdminSidebar).
 */

import { AdminAnalyticsView } from '@/views/admin/analytics/AdminAnalyticsView';

export default function AdminAnalyticsPage() {
  return <AdminAnalyticsView />;
}
