/**
 * @file couponRepo.ts
 * @description Coupon repository: admin coupon management plus the signed-in user's coupons
 * (shared by mentor and mentee). Mentee checkout/preview live in `bookingRepo`.
 */

import { ApiClientError, apiClient } from '@/models/apiClient';
import type {
  AdminCouponsQuery,
  CouponRedemptionView,
  CouponRedemptionsQuery,
  CouponView,
  CreateCouponCommand,
  KnownCouponStatus,
  MentorCouponOffer,
  MentorCouponStat,
  PageResponse,
  UpdateCouponCommand,
  UserCouponView,
} from '@/models/coupon';

/** Resolves to null when the endpoint answers 404 (not deployed yet); other errors are rethrown. */
async function nullOn404<T>(request: Promise<T>): Promise<T | null> {
  try {
    return await request;
  } catch (reason) {
    if (reason instanceof ApiClientError && reason.status === 404) return null;
    throw reason;
  }
}

function queryString(query: object) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  });
  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

export const couponRepo = {
  // --- Admin (Swagger 05-admin, tag "Quản trị - Mã giảm giá") ---
  /**
   * Unlike the other admin lists, Swagger declares no default for sortBy/direction here, so always
   * send them (newest first unless the caller overrides).
   */
  listCoupons: (query: AdminCouponsQuery) =>
    apiClient<PageResponse<CouponView>>(
      `/api/admin/coupons${queryString({ sortBy: 'createdAt', direction: 'DESC', ...query })}`,
    ),

  getCoupon: (couponId: string) => apiClient<CouponView>(`/api/admin/coupons/${couponId}`),

  createCoupon: (data: CreateCouponCommand) =>
    apiClient<CouponView>('/api/admin/coupons', { method: 'POST', data }),

  updateCoupon: (couponId: string, data: UpdateCouponCommand) =>
    apiClient<CouponView>(`/api/admin/coupons/${couponId}`, { method: 'PUT', data }),

  changeCouponStatus: (couponId: string, status: KnownCouponStatus) =>
    apiClient<CouponView>(`/api/admin/coupons/${couponId}/status`, {
      method: 'PATCH',
      data: { status },
    }),

  listRedemptions: (couponId: string, query: CouponRedemptionsQuery) =>
    apiClient<PageResponse<CouponRedemptionView>>(
      `/api/admin/coupons/${couponId}/redemptions${queryString({ sortBy: 'createdAt', direction: 'DESC', ...query })}`,
    ),

  // --- Signed-in user, mentor or mentee (tag "Mã giảm giá của tôi") ---

  /**
   * Still-valid coupons for the current account.
   * TODO(api): the response has no applicableServiceIds/applicableMentorIds/startAt/endAt, so the
   * mentor side cannot tell which of its services a coupon targets — ask BE to add them.
   */
  getMyCoupons: () => apiClient<UserCouponView[]>('/api/me/coupons'),

  // --- Mentor coupon opt-in ---

  /**
   * SkillSwap-funded coupons the mentor can apply to their services. null on 404.
   * TODO(api): endpoint not deployed yet.
   */
  getMentorCouponOffers: () =>
    nullOn404(apiClient<MentorCouponOffer[]>('/api/me/mentor/coupon-offers')),

  /**
   * This month's coupon usage on the mentor's services. null on 404.
   * TODO(api): GET /api/me/mentor/coupon-stats not deployed yet.
   */
  getMentorCouponStats: () =>
    nullOn404(apiClient<MentorCouponStat[]>('/api/me/mentor/coupon-stats')),

  /**
   * Replaces the services a coupon is applied to (empty list = stop applying). null on 404.
   * TODO(api): endpoint not deployed yet.
   */
  setCouponServices: (couponId: string, serviceIds: string[]) =>
    nullOn404(
      apiClient<MentorCouponOffer>(`/api/me/mentor/coupon-offers/${couponId}/services`, {
        method: 'PUT',
        data: { serviceIds },
      }),
    ),
};
