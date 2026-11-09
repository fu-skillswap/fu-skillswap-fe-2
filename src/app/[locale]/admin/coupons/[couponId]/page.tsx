/**
 * @file page.tsx
 * @description Admin coupon detail route. Data is loaded client-side (admin token lives in memory).
 */

import { AdminCouponDetailView } from '@/views/admin/coupon-detail/AdminCouponDetailView';

export default async function AdminCouponDetailPage({
  params,
}: {
  params: Promise<{ couponId: string }>;
}) {
  const { couponId } = await params;
  return <AdminCouponDetailView couponId={couponId} />;
}
