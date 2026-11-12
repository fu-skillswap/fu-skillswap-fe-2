/**
 * @file useMentorServiceCoupons.ts
 * @description Coupons shown on the mentor service pages (read-only), from GET /api/me/coupons —
 * the same endpoint mentee checkout uses.
 */

'use client';

import { couponFitsService } from '@/lib/coupon';
import type { MentorServiceManagementResponse } from '@/models/auth';
import type { UserCouponView } from '@/models/coupon';
import { couponRepo } from '@/repositories/couponRepo';
import { useEffect, useState } from 'react';

/** Coupons from GET /api/me/coupons; null while loading or when the request fails. */
export function useMyMentorCoupons(): UserCouponView[] | null {
  const [coupons, setCoupons] = useState<UserCouponView[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    couponRepo
      .getMyCoupons()
      .then((result) => {
        if (!cancelled) setCoupons(Array.isArray(result) ? result : null);
      })
      .catch(() => {
        // Optional section: on any error it simply stays hidden.
        if (!cancelled) setCoupons(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return coupons;
}

/**
 * Coupons a mentee could use on this service (see `couponFitsService`).
 * TODO(api): GET /api/me/coupons has no applicableServiceIds/applicableMentorIds in Swagger, so
 * coupons that target other services are only filtered out once BE returns them.
 */
export function couponsForService(
  coupons: UserCouponView[] | null,
  service: Pick<MentorServiceManagementResponse, 'serviceId' | 'isFree' | 'publicPriceScoin'>,
): UserCouponView[] {
  if (!coupons?.length) return [];
  return coupons.filter((coupon) => couponFitsService(coupon, service));
}
