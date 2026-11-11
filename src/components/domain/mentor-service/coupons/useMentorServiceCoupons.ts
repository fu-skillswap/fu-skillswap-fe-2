/**
 * @file useMentorServiceCoupons.ts
 * @description Coupons shown on the mentor service pages (read-only), from GET /api/me/coupons —
 * the same endpoint mentee checkout uses.
 */

'use client';

import { withMenteeSurcharge } from '@/lib/coupon';
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
 * Coupons a mentee could use on a service with this price: quota left and the minimum order met
 * (on the price the mentee pays, surcharge included). `isUsable` is ignored on purpose — it
 * describes the mentor's own account, not the mentees.
 * TODO(api): GET /api/me/coupons has no applicableServiceIds/applicableMentorIds, so coupons that
 * target other services cannot be filtered out yet.
 */
export function couponsForService(
  coupons: UserCouponView[] | null,
  priceScoin: number,
): UserCouponView[] {
  if (!coupons?.length || !(priceScoin > 0)) return [];
  const menteePrice = withMenteeSurcharge(priceScoin);
  return coupons.filter(
    (coupon) =>
      (coupon.remainingQuota == null || coupon.remainingQuota > 0) &&
      (coupon.minOrderValueScoin == null || menteePrice >= coupon.minOrderValueScoin),
  );
}
