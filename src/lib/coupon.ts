/**
 * @file coupon.ts
 * @description Pure coupon helpers (formatting, state derivation, error mapping). No React, no
 * network — safe to unit test and to use from both Server and Client Components.
 */

import type { CouponView } from '@/models/coupon';

const scoinFormatter = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 });

/** vi-VN grouping: 16500 → "16.500". Non-finite input renders as "0". */
export function formatScoin(value: number | null | undefined): string {
  return scoinFormatter.format(Number.isFinite(value) ? (value as number) : 0);
}

type DiscountFields = Pick<
  CouponView,
  'discountType' | 'discountValue' | 'maxDiscountScoin' | 'minOrderValueScoin'
>;

/**
 * "Giảm 20%, tối đa 3.000 S-coins" | "Giảm 2.000 S-coins" (+ ", đơn từ 10.000").
 * Unknown discount types fall back to the raw type and value.
 */
export function describeDiscount(coupon: DiscountFields): string {
  let text: string;
  switch (coupon.discountType) {
    case 'PERCENTAGE':
      text = `Giảm ${coupon.discountValue}%`;
      if (coupon.maxDiscountScoin != null && coupon.maxDiscountScoin > 0) {
        text += `, tối đa ${formatScoin(coupon.maxDiscountScoin)} S-coins`;
      }
      break;
    case 'FIXED_SCOIN':
      text = `Giảm ${formatScoin(coupon.discountValue)} S-coins`;
      break;
    default:
      text = `Giảm ${formatScoin(coupon.discountValue)} (${coupon.discountType || 'không rõ'})`;
  }
  if (coupon.minOrderValueScoin != null && coupon.minOrderValueScoin > 0) {
    text += `, đơn từ ${formatScoin(coupon.minOrderValueScoin)}`;
  }
  return text;
}

/** "-20%" | "-2.000". Unknown types show the plain value. */
export function couponBadgeText(coupon: Pick<CouponView, 'discountType' | 'discountValue'>) {
  if (coupon.discountType === 'PERCENTAGE') return `-${coupon.discountValue}%`;
  return `-${formatScoin(coupon.discountValue)}`;
}

export type CouponState =
  'running' | 'scheduled' | 'expired' | 'exhausted' | 'inactive' | 'suspended';

type StateFields = Pick<
  CouponView,
  'status' | 'startAt' | 'endAt' | 'quotaTotal' | 'totalRedemptions'
>;

function toTime(value: string | null | undefined): number | null {
  if (!value) return null;
  const time = Date.parse(value);
  return Number.isNaN(time) ? null : time;
}

/**
 * Display state, in priority order: suspended → inactive → scheduled → expired → exhausted →
 * running. An unknown `status` is treated like ACTIVE so dates/quota still decide the state.
 */
export function deriveCouponState(
  coupon: StateFields,
  now: Date | number = Date.now(),
): CouponState {
  const nowTime = typeof now === 'number' ? now : now.getTime();
  if (coupon.status === 'SUSPENDED') return 'suspended';
  if (coupon.status === 'INACTIVE') return 'inactive';

  const start = toTime(coupon.startAt);
  const end = toTime(coupon.endAt);
  if (start !== null && nowTime < start) return 'scheduled';
  if (end !== null && nowTime > end) return 'expired';
  if (coupon.quotaTotal != null && coupon.totalRedemptions >= coupon.quotaTotal) {
    return 'exhausted';
  }
  return 'running';
}

export interface CouponStateTone {
  /** CSS values, token first with the spec hex as fallback. */
  background: string;
  color: string;
  border: string;
}

export interface CouponStateUi {
  label: string;
  tone: CouponStateTone;
}

const NEUTRAL_TONE: CouponStateTone = {
  background: 'var(--border-light, #f1f5f9)',
  color: 'var(--text-secondary, #475569)',
  border: '1px solid transparent',
};

export const COUPON_STATE_UI: Record<CouponState, CouponStateUi> = {
  running: {
    label: 'Đang chạy',
    tone: {
      background: 'var(--success-soft, #ecfdf5)',
      color: '#047857',
      border: '1px solid transparent',
    },
  },
  scheduled: {
    label: 'Sắp diễn ra',
    tone: {
      background: 'var(--primary-light, #eff6ff)',
      color: 'var(--site-blue-hover, #1d4ed8)',
      border: '1px solid transparent',
    },
  },
  expired: { label: 'Hết hạn', tone: NEUTRAL_TONE },
  exhausted: { label: 'Hết lượt', tone: NEUTRAL_TONE },
  inactive: {
    label: 'Tạm tắt',
    tone: {
      background: 'var(--surface, #ffffff)',
      color: 'var(--text-secondary, #475569)',
      border: '1px solid var(--border-strong, #cbd5e1)',
    },
  },
  suspended: {
    label: 'Đình chỉ',
    tone: {
      background: 'var(--danger-soft, #fef2f2)',
      color: '#b91c1c',
      border: '1px solid transparent',
    },
  },
};

/** UI for any state string; unknown values render the raw value with the neutral tone. */
export function getCouponStateUi(state: string): CouponStateUi {
  return (
    (COUPON_STATE_UI as Record<string, CouponStateUi | undefined>)[state] ?? {
      label: state || 'Không rõ',
      tone: NEUTRAL_TONE,
    }
  );
}

/** 0–100 share of the total quota already used; null when the quota is unlimited. */
export function usagePercent(
  coupon: Pick<CouponView, 'quotaTotal' | 'totalRedemptions'>,
): number | null {
  if (coupon.quotaTotal == null) return null;
  if (coupon.quotaTotal <= 0) return 100;
  return Math.min(100, Math.max(0, (coupon.totalRedemptions / coupon.quotaTotal) * 100));
}

export function isNearlyExhausted(coupon: Pick<CouponView, 'quotaTotal' | 'totalRedemptions'>) {
  const percent = usagePercent(coupon);
  return percent !== null && percent >= 80;
}

interface CouponErrorLike {
  status?: number;
  code?: string;
  message?: string;
}

function asErrorLike(error: unknown): CouponErrorLike {
  if (!error || typeof error !== 'object') return {};
  const { status, code, message } = error as Record<string, unknown>;
  return {
    status: typeof status === 'number' ? status : undefined,
    code: typeof code === 'string' ? code : undefined,
    message: typeof message === 'string' ? message : undefined,
  };
}

/**
 * Vietnamese message for a failed coupon preview/checkout. Accepts an `ApiClientError` or any
 * `{ status, code, message }` object.
 * TODO(api): replace heuristics with BE error codes.
 */
export function mapCouponError(
  error: unknown,
  couponCode: string,
  options: { minOrderValueScoin?: number | null } = {},
): string {
  const { status, code = '', message } = asErrorLike(error);
  const upper = code.toUpperCase();
  const label = couponCode.trim().toUpperCase();

  if (upper.includes('EXPIRED')) return `Mã ${label} đã hết hạn.`;
  if (upper.includes('NOT_STARTED')) return `Mã ${label} chưa đến ngày dùng.`;
  if (upper.includes('QUOTA')) return `Mã ${label} đã hết lượt dùng.`;
  if (upper.includes('MIN_ORDER')) {
    return options.minOrderValueScoin != null
      ? `Đơn chưa đạt tối thiểu ${formatScoin(options.minOrderValueScoin)} S-coins để dùng mã ${label}.`
      : `Đơn chưa đạt giá trị tối thiểu để dùng mã ${label}.`;
  }
  if (upper.includes('NOT_APPLICABLE')) return `Mã ${label} không áp dụng cho dịch vụ này.`;
  if (upper.includes('NOT_FOUND') || status === 404) {
    return `Không tìm thấy mã ${label}. Kiểm tra lại chính tả.`;
  }
  return message?.trim() || 'Không áp dụng được mã này.';
}

/**
 * Discount a coupon gives on an order of `orderScoin` (the price the mentee pays, surcharge
 * included). 0 when the minimum order is not met or the value is not usable.
 * TODO(api): confirm rounding with BE (FE floors percentage discounts).
 */
export function computeCouponDiscount(
  coupon: Pick<
    CouponView,
    'discountType' | 'discountValue' | 'maxDiscountScoin' | 'minOrderValueScoin'
  >,
  orderScoin: number,
): number {
  if (!Number.isFinite(orderScoin) || orderScoin <= 0) return 0;
  if (!Number.isFinite(coupon.discountValue) || coupon.discountValue <= 0) return 0;
  if (coupon.minOrderValueScoin != null && orderScoin < coupon.minOrderValueScoin) return 0;
  let discount: number;
  if (coupon.discountType === 'PERCENTAGE') {
    discount = Math.floor((orderScoin * Math.min(coupon.discountValue, 100)) / 100);
    if (coupon.maxDiscountScoin != null && coupon.maxDiscountScoin > 0) {
      discount = Math.min(discount, coupon.maxDiscountScoin);
    }
  } else {
    discount = coupon.discountValue;
  }
  return Math.max(0, Math.min(discount, orderScoin));
}

/** Order price from which a percentage coupon hits its cap; null when there is no cap. */
export function capReachedAtScoin(
  coupon: Pick<CouponView, 'discountType' | 'discountValue' | 'maxDiscountScoin'>,
): number | null {
  if (coupon.discountType !== 'PERCENTAGE') return null;
  if (!coupon.maxDiscountScoin || coupon.maxDiscountScoin <= 0 || coupon.discountValue <= 0) {
    return null;
  }
  return Math.ceil((coupon.maxDiscountScoin * 100) / Math.min(coupon.discountValue, 100));
}
