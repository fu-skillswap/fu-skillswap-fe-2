/**
 * @file couponRepo.ts
 * @description Coupon repository: admin coupon management plus the (not yet available) mentor and
 * mentee coupon lookups. Mentee checkout/preview live in `bookingRepo`.
 */

import { ApiClientError, apiClient } from '@/models/apiClient';
import type {
  AdminCouponsQuery,
  CouponRedemptionView,
  CouponRedemptionsQuery,
  CouponView,
  CreateCouponCommand,
  KnownCouponStatus,
  MentorCouponView,
  PageResponse,
  UpdateCouponCommand,
  UsableCouponView,
} from '@/models/coupon';

function queryString(query: object) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  });
  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

/** Resolves to null when the endpoint is not deployed yet (404); other errors still throw. */
async function nullOn404<T>(request: Promise<T>): Promise<T | null> {
  try {
    return await request;
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 404) return null;
    throw error;
  }
}

export const couponRepo = {
  // --- Admin (Swagger 05-admin, tag "Quản trị - Mã giảm giá") ---
  listCoupons: (query: AdminCouponsQuery) =>
    apiClient<PageResponse<CouponView>>(`/api/admin/coupons${queryString(query)}`),

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
      `/api/admin/coupons/${couponId}/redemptions${queryString(query)}`,
    ),

  // --- Not available yet: return null on 404, never mock data ---

  /**
   * Coupons that apply to the current mentor's services.
   * TODO(api): GET /api/me/mentor/coupons — expected `MentorCouponView[]` (CouponView filtered to
   * my services + `usedCountForService` per serviceId). Gate UI with MENTOR_COUPONS_ENABLED.
   */
  getMyMentorCoupons: () => nullOn404(apiClient<MentorCouponView[]>('/api/me/mentor/coupons')),

  /**
   * Coupons the current mentee could apply to a booking.
   * TODO(api): GET /api/me/coupons?bookingId= — expected `UsableCouponView[]` (CouponView +
   * `usable` + `reasonIfNotUsable`). Gate UI with MENTEE_COUPON_SUGGESTIONS_ENABLED.
   */
  getUsableCoupons: (bookingId: string) =>
    nullOn404(apiClient<UsableCouponView[]>(`/api/me/coupons${queryString({ bookingId })}`)),
};
