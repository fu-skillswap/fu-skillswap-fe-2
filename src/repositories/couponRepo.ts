/**
 * @file couponRepo.ts
 * @description Coupon repository: admin coupon management plus the signed-in user's coupons
 * (shared by mentor and mentee). Mentee checkout/preview live in `bookingRepo`.
 */

import { apiClient } from '@/models/apiClient';
import type {
  AdminCouponsQuery,
  CouponRedemptionView,
  CouponRedemptionsQuery,
  CouponView,
  CreateCouponCommand,
  KnownCouponStatus,
  PageResponse,
  UpdateCouponCommand,
  UserCouponView,
} from '@/models/coupon';

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

  // --- Signed-in user, mentor or mentee (tag "Mã giảm giá của tôi") ---

  /**
   * Still-valid coupons for the current account.
   * TODO(api): the response has no applicableServiceIds/applicableMentorIds/startAt/endAt, so the
   * mentor side cannot tell which of its services a coupon targets — ask BE to add them.
   */
  getMyCoupons: () => apiClient<UserCouponView[]>('/api/me/coupons'),
};
