/**
 * @file page.tsx
 * @description Admin route to create a coupon.
 */

import { AdminCouponFormView } from '@/views/admin/coupon-form/AdminCouponFormView';

export default function AdminCouponCreatePage() {
  return <AdminCouponFormView mode="create" />;
}
