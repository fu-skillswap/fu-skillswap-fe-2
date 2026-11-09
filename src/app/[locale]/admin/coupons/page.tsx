/**
 * @file page.tsx
 * @description Admin coupon list route. Data is loaded client-side (admin token lives in memory).
 */

import { AdminCouponsView } from '@/views/admin/coupons/AdminCouponsView';
import { Suspense } from 'react';

export default function AdminCouponsPage() {
  // `useSearchParams` in the view needs a Suspense boundary.
  return (
    <Suspense fallback={null}>
      <AdminCouponsView />
    </Suspense>
  );
}
