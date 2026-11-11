/**
 * @file coupon.ts
 * @description Coupon, coupon redemption and checkout-preview types.
 * Shapes follow Swagger `05-admin` (tag "Quản trị - Mã giảm giá") and `03-booking` (tag "Thanh toán").
 */

/**
 * Known discount types. Swagger types `discountType` as a plain string, so any other value must be
 * tolerated by the UI (show the raw value, never crash).
 * TODO(api): confirm enum values with BE.
 */
export const COUPON_DISCOUNT_TYPES = ['PERCENTAGE', 'FIXED_SCOIN'] as const;
export type KnownCouponDiscountType = (typeof COUPON_DISCOUNT_TYPES)[number];
/** `(string & {})` keeps autocomplete for known values while accepting unknown ones. */
export type CouponDiscountType = KnownCouponDiscountType | (string & {});

/**
 * Known coupon statuses. Swagger types `status` as a plain string; tolerate unknown values.
 * TODO(api): confirm enum values with BE.
 */
export const COUPON_STATUSES = ['ACTIVE', 'INACTIVE', 'SUSPENDED'] as const;
export type KnownCouponStatus = (typeof COUPON_STATUSES)[number];
export type CouponStatus = KnownCouponStatus | (string & {});

export function isKnownCouponDiscountType(value: string): value is KnownCouponDiscountType {
  return (COUPON_DISCOUNT_TYPES as readonly string[]).includes(value);
}

export function isKnownCouponStatus(value: string): value is KnownCouponStatus {
  return (COUPON_STATUSES as readonly string[]).includes(value);
}

export interface CouponView {
  id: string;
  code: string;
  title: string;
  description: string | null;
  discountType: CouponDiscountType;
  discountValue: number;
  maxDiscountScoin: number | null;
  status: CouponStatus;
  startAt: string;
  endAt: string;
  quotaTotal: number | null;
  quotaPerUser: number | null;
  minOrderValueScoin: number | null;
  applicableServiceIds: string[];
  applicableMentorIds: string[];
  totalRedemptions: number;
  activeRedemptions: number;
  createdAt: string;
  updatedAt: string;
}

/** Editable fields shared by create and update (POST / PUT /api/admin/coupons). */
export interface CreateCouponCommand {
  code: string;
  title: string;
  description: string | null;
  discountType: CouponDiscountType;
  discountValue: number;
  maxDiscountScoin: number | null;
  startAt: string;
  endAt: string;
  quotaTotal: number | null;
  quotaPerUser: number | null;
  minOrderValueScoin: number | null;
  applicableServiceIds: string[];
  applicableMentorIds: string[];
}

export type UpdateCouponCommand = CreateCouponCommand;

export interface ChangeCouponStatusCommand {
  status: KnownCouponStatus;
}

export interface CouponRedemptionView {
  id: string;
  couponId: string;
  paymentOrderId: string;
  redeemerUserId: string;
  redeemerFullName: string;
  /** Plain string in Swagger. */
  status: string;
  discountScoin: number;
  createdAt: string;
}

/** Standard page envelope payload (`PageResponse*` in Swagger, page is 0-based). */
export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export type SortDirection = 'ASC' | 'DESC';

export interface AdminCouponsQuery {
  status?: CouponStatus;
  discountType?: CouponDiscountType;
  keyword?: string;
  page: number;
  size: number;
  sortBy?: string;
  direction?: SortDirection;
}

export interface CouponRedemptionsQuery {
  page: number;
  size: number;
  sortBy?: string;
  direction?: SortDirection;
}

/** POST /api/me/bookings/{bookingId}/checkout-preview — read-only estimate. */
export interface CheckoutPreviewResponse {
  bookingId: string;
  priceScoin: number;
  priceBeforeDiscountScoin: number;
  couponDiscountScoin: number;
  campaignCreditAppliedScoin: number;
  userCreditAppliedScoin: number;
  estimatedFinalPayableScoin: number;
  paymentDeadlineAt: string | null;
  /** Always true: the real checkout recalculates every amount. */
  isEstimate: boolean;
  disclaimer: string | null;
}

/** Discount types returned by GET /api/me/coupons (differs from the admin values). */
export type UserCouponDiscountType = 'FIXED' | 'PERCENT' | (string & {});

/**
 * GET /api/me/coupons (`UserCouponResponse`, tag "Mã giảm giá của tôi") — still-valid coupons
 * for the signed-in account, used by both mentee checkout and the mentor service pages.
 * Unlike `CouponView` it has no dates, status or target lists.
 */
export interface UserCouponView {
  id: string;
  code: string;
  title: string;
  description: string | null;
  discountType: UserCouponDiscountType;
  discountValue: number;
  maxDiscountScoin: number | null;
  minOrderValueScoin: number | null;
  quotaTotal: number | null;
  remainingQuota: number | null;
  /** Whether THIS account can still use it (per-user quota…); not tied to a specific booking. */
  isUsable: boolean;
  unusableReason: string | null;
}
