/**
 * @file useMentorServiceCoupons.ts
 * @description Coupons that apply to the current mentor's services (read-only, mentor side).
 * Does nothing while MENTOR_COUPONS_ENABLED is false, so the pages render exactly as before.
 */

'use client';

import { MENTOR_COUPONS_ENABLED } from '@/constants/featureFlags';
import { deriveCouponState } from '@/lib/coupon';
import type { MentorCouponView } from '@/models/coupon';
import { couponRepo } from '@/repositories/couponRepo';
import { useEffect, useState } from 'react';

/** All coupons for my services; null while disabled, loading, unavailable (404) or failed. */
export function useMyMentorCoupons(): MentorCouponView[] | null {
  const [coupons, setCoupons] = useState<MentorCouponView[] | null>(null);

  useEffect(() => {
    if (!MENTOR_COUPONS_ENABLED) return;
    let cancelled = false;
    couponRepo
      .getMyMentorCoupons()
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
 * Running or scheduled coupons that apply to one service.
 * The endpoint already filters to my services, so a coupon applies when it targets everyone,
 * targets mentors (that list includes me), or lists this service.
 * TODO(api): confirm GET /api/me/mentor/coupons filtering semantics.
 */
export function couponsForService(
  coupons: MentorCouponView[] | null,
  serviceId: string,
  now: number,
): MentorCouponView[] {
  if (!coupons?.length) return [];
  return coupons.filter((coupon) => {
    const mentorIds = coupon.applicableMentorIds ?? [];
    const serviceIds = coupon.applicableServiceIds ?? [];
    const applies =
      (!mentorIds.length && !serviceIds.length) ||
      mentorIds.length > 0 ||
      serviceIds.includes(serviceId);
    if (!applies) return false;
    const state = deriveCouponState(coupon, now);
    return state === 'running' || state === 'scheduled';
  });
}
