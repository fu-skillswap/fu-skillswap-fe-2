/**
 * @file page.tsx
 * @description Admin route to edit a coupon. The coupon is loaded client-side (admin token).
 */

import { AdminCouponFormView } from '@/views/admin/coupon-form/AdminCouponFormView';

export default async function AdminCouponEditPage({
  params,
}: {
  params: Promise<{ couponId: string }>;
}) {
  const { couponId } = await params;
  return <AdminCouponFormView mode="edit" couponId={couponId} />;
}
