/**
 * @file adminCoupons.constants.ts
 * @description Filter options and formatters for the admin coupon list.
 */

import type { CouponDiscountType, CouponStatus, CouponView } from '@/models/coupon';

export const COUPON_PAGE_SIZE = 20;
/** Size of the unfiltered request used for the stat cards. */
export const COUPON_SUMMARY_SIZE = 100;

export const STATUS_FILTER_OPTIONS: Array<{ value: '' | CouponStatus; label: string }> = [
  { value: '', label: 'Mọi trạng thái' },
  { value: 'ACTIVE', label: 'Đang bật' },
  { value: 'INACTIVE', label: 'Tạm tắt' },
  { value: 'SUSPENDED', label: 'Đình chỉ' },
];

export const DISCOUNT_TYPE_FILTER_OPTIONS: Array<{
  value: '' | CouponDiscountType;
  label: string;
}> = [
  { value: '', label: 'Mọi loại giảm' },
  { value: 'PERCENTAGE', label: 'Giảm theo %' },
  { value: 'FIXED_SCOIN', label: 'Giảm số S-coins' },
];

/** URL value → filter value; anything not offered in the select is ignored. */
export function parseOption<T extends string>(
  options: Array<{ value: T | '' }>,
  value: string | null,
): T | '' {
  return (options.find((option) => option.value === value)?.value ?? '') as T | '';
}

/** "Tất cả mentor" | "3 mentor" | "2 dịch vụ" | "3 mentor · 2 dịch vụ". */
export function describeScope(
  coupon: Pick<CouponView, 'applicableMentorIds' | 'applicableServiceIds'>,
) {
  const mentors = coupon.applicableMentorIds?.length ?? 0;
  const services = coupon.applicableServiceIds?.length ?? 0;
  if (!mentors && !services) return 'Tất cả mentor';
  return [mentors && `${mentors} mentor`, services && `${services} dịch vụ`]
    .filter(Boolean)
    .join(' · ');
}

const TIME_ZONE = 'Asia/Ho_Chi_Minh';
const dayMonth = new Intl.DateTimeFormat('vi-VN', {
  timeZone: TIME_ZONE,
  day: '2-digit',
  month: '2-digit',
});
const dayMonthYear = new Intl.DateTimeFormat('vi-VN', {
  timeZone: TIME_ZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});
const fullDateTime = new Intl.DateTimeFormat('vi-VN', {
  timeZone: TIME_ZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});
const yearOnly = new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE, year: 'numeric' });

function parseDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDay(date: Date | null, currentYear: string) {
  if (!date) return '—';
  return yearOnly.format(date) === currentYear ? dayMonth.format(date) : dayMonthYear.format(date);
}

/** "01/11 – 30/11" (year added when not the current year, GMT+7) + a full 24h tooltip. */
export function formatCouponPeriod(startAt: string, endAt: string, now: number) {
  const start = parseDate(startAt);
  const end = parseDate(endAt);
  const currentYear = yearOnly.format(now);
  return {
    label: `${formatDay(start, currentYear)} – ${formatDay(end, currentYear)}`,
    title:
      start && end ? `${fullDateTime.format(start)} – ${fullDateTime.format(end)} (GMT+7)` : '',
  };
}
