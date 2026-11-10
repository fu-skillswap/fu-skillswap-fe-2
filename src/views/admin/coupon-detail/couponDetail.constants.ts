/**
 * @file couponDetail.constants.ts
 * @description Redemption status mapping and time helpers for the admin coupon detail screen.
 */

import type { CouponRedemptionView, CouponView } from '@/models/coupon';

export const REDEMPTION_PAGE_SIZE = 10;
/** Redemptions fetched once to total the S-coins discounted. */
export const REDEMPTION_SUMMARY_SIZE = 100;

export type RedemptionTone = 'paid' | 'pending' | 'released' | 'unknown';

/**
 * TODO(api): confirm redemption status values with BE. Unknown values show the raw text.
 */
const REDEMPTION_STATUS: Record<string, { label: string; tone: RedemptionTone }> = {
  PAID: { label: 'Đã thanh toán', tone: 'paid' },
  REDEEMED: { label: 'Đã thanh toán', tone: 'paid' },
  RESERVED: { label: 'Đang thanh toán', tone: 'pending' },
  PENDING: { label: 'Đang thanh toán', tone: 'pending' },
  RELEASED: { label: 'Đã hoàn', tone: 'released' },
  REFUNDED: { label: 'Đã hoàn', tone: 'released' },
  CANCELLED: { label: 'Đã hoàn', tone: 'released' },
};

export function getRedemptionStatusUi(status: string | null | undefined) {
  const key = (status ?? '').toUpperCase();
  return REDEMPTION_STATUS[key] ?? { label: status || 'Không rõ', tone: 'unknown' as const };
}

export function isPaidRedemption(redemption: CouponRedemptionView) {
  return getRedemptionStatusUi(redemption.status).tone === 'paid';
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** "Còn N ngày" | "Còn dưới 1 ngày" | "Bắt đầu sau N ngày" | "Đã kết thúc". */
export function describeTimeLeft(coupon: Pick<CouponView, 'startAt' | 'endAt'>, now: number) {
  const start = Date.parse(coupon.startAt);
  const end = Date.parse(coupon.endAt);
  if (!Number.isNaN(start) && now < start) {
    const days = Math.ceil((start - now) / DAY_MS);
    return days <= 1 ? 'Bắt đầu trong hôm nay' : `Bắt đầu sau ${days} ngày`;
  }
  if (Number.isNaN(end)) return '—';
  if (now > end) return 'Đã kết thúc';
  const days = Math.floor((end - now) / DAY_MS);
  return days < 1 ? 'Còn dưới 1 ngày' : `Còn ${days} ngày`;
}

const dateTime = new Intl.DateTimeFormat('vi-VN', {
  timeZone: 'Asia/Ho_Chi_Minh',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/** dd/MM/yyyy HH:mm in Vietnam time. */
export function formatDateTime(value: string | null | undefined) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : dateTime.format(date);
}
