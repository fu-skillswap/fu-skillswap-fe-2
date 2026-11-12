/**
 * @file useMentorCouponOffers.ts
 * @description SkillSwap-funded coupons a mentor can apply to their services
 * (GET /api/me/mentor/coupon-offers), behind MENTOR_COUPON_OPTIN_ENABLED.
 */

'use client';

import { MENTOR_COUPON_OPTIN_ENABLED } from '@/constants/featureFlags';
import { visibleOffers } from '@/lib/coupon';
import type { MentorCouponOffer, MentorCouponStat } from '@/models/coupon';
import { couponRepo } from '@/repositories/couponRepo';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

export const MENTOR_COUPON_OFFERS_QUERY_KEY = ['mentor-coupon-offers'] as const;
export const MENTOR_COUPON_STATS_QUERY_KEY = ['mentor-coupon-stats'] as const;

/**
 * The stat row with the most mentees, or null when the API is missing, fails or every count is 0.
 * Only fetched while `enabled` (the "Cơ chế hoạt động" tab is shown).
 */
export function useTopMentorCouponStat(enabled: boolean): MentorCouponStat | null {
  const query = useQuery({
    queryKey: MENTOR_COUPON_STATS_QUERY_KEY,
    queryFn: () => couponRepo.getMentorCouponStats(),
    enabled: MENTOR_COUPON_OPTIN_ENABLED && enabled,
    retry: false,
    staleTime: 5 * 60_000,
  });
  const data = query.data;
  return useMemo(() => {
    if (query.isError || !Array.isArray(data)) return null;
    const top = data.reduce<MentorCouponStat | null>(
      (best, row) =>
        Number.isFinite(row.menteeCount) && row.menteeCount > (best?.menteeCount ?? 0) ? row : best,
      null,
    );
    return top && top.menteeCount > 0 ? top : null;
  }, [data, query.isError]);
}

/**
 * Non-ended offers, sorted for display. null while the flag is off, while loading, on 404
 * (endpoint not deployed) or on any error — callers then render nothing new.
 */
export function useMentorCouponOffers(): MentorCouponOffer[] | null {
  const query = useQuery({
    queryKey: MENTOR_COUPON_OFFERS_QUERY_KEY,
    queryFn: () => couponRepo.getMentorCouponOffers(),
    enabled: MENTOR_COUPON_OPTIN_ENABLED,
    retry: false,
    staleTime: 60_000,
  });
  const data = query.data;
  return useMemo(() => {
    if (!MENTOR_COUPON_OPTIN_ENABLED || query.isError || !Array.isArray(data)) return null;
    return visibleOffers(data);
  }, [data, query.isError]);
}
