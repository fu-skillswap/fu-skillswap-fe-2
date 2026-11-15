/**
 * @file useMentorCouponOffers.ts
 * @description SkillSwap-funded coupons a mentor can apply to their services
 * (GET /api/me/mentor/coupon-offers), behind MENTOR_COUPON_OPTIN_ENABLED.
 */

'use client';

import { MENTOR_COUPON_OPTIN_ENABLED } from '@/constants/featureFlags';
import { visibleOffers } from '@/lib/coupon';
import type { MentorCouponOffer } from '@/models/coupon';
import { couponRepo } from '@/repositories/couponRepo';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

export const MENTOR_COUPON_OFFERS_QUERY_KEY = ['mentor-coupon-offers'] as const;

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
