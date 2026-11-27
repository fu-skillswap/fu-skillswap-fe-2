/**
 * @file revenue.helpers.ts
 * @description Pure helpers for the admin revenue screen: derive ratios from the
 * `financial` block of `GET /api/admin/dashboard/overview` and format S-coin / VND values.
 */

import { SCOIN_TO_VND } from '@/constants/legal';
import type { AdminFinancialPeriodMetrics, AdminStatusBreakdown } from '@/models/admin';

export type RevenuePeriod = 'thisMonth' | 'thisQuarter' | 'thisYear';

export const REVENUE_PERIODS: Array<{ value: RevenuePeriod; label: string; noun: string }> = [
  { value: 'thisMonth', label: 'Tháng này', noun: 'tháng này' },
  { value: 'thisQuarter', label: 'Quý này', noun: 'quý này' },
  { value: 'thisYear', label: 'Năm nay', noun: 'năm nay' },
];

const numberFormatter = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 });
const percentFormatter = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 });

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/** vi-VN grouping, `—` when the backend did not send the value. */
export function formatCount(value?: number | null) {
  return isFiniteNumber(value) ? numberFormatter.format(value) : '—';
}

/** "12.500.000 VNĐ", `—` when absent. */
export function formatVnd(value?: number | null) {
  return isFiniteNumber(value) ? `${numberFormatter.format(Math.round(value))} VNĐ` : '—';
}

/** S-coin amount (backend unit) shown in VNĐ using `SCOIN_TO_VND` (1:1 when unset). */
export function formatScoinAsVnd(value?: number | null) {
  return isFiniteNumber(value) ? formatVnd(value * (SCOIN_TO_VND ?? 1)) : '—';
}

/** Share of GMV the platform keeps, in percent; `undefined` when GMV is 0 or unknown. */
export function getTakeRate(metrics?: AdminFinancialPeriodMetrics | null) {
  const gmv = metrics?.gmvScoin;
  const fee = metrics?.platformFeeScoin;
  if (!isFiniteNumber(gmv) || !isFiniteNumber(fee) || gmv <= 0) return undefined;
  return (fee / gmv) * 100;
}

/** Average order value in S-coin; `undefined` when there is no transaction. */
export function getAverageOrderValue(metrics?: AdminFinancialPeriodMetrics | null) {
  const gmv = metrics?.gmvScoin;
  const count = metrics?.totalTransactions;
  if (!isFiniteNumber(gmv) || !isFiniteNumber(count) || count <= 0) return undefined;
  return gmv / count;
}

export function formatPercent(value?: number | null) {
  return isFiniteNumber(value) ? `${percentFormatter.format(value)}%` : '—';
}

/** Payment order statuses in the order an operator reads them; unknown keys are appended. */
const PAYMENT_ORDER_STATUS_LABELS: Record<string, { label: string; tone: string }> = {
  PAID: { label: 'Đã thanh toán', tone: 'success' },
  AWAITING_PROVIDER_PAYMENT: { label: 'Đang chờ cổng thanh toán', tone: 'pending' },
  PARTIALLY_COVERED_BY_CREDIT: { label: 'Đã trừ một phần S-coin', tone: 'pending' },
  PENDING: { label: 'Mới tạo', tone: 'pending' },
  FAILED: { label: 'Thất bại', tone: 'danger' },
  EXPIRED: { label: 'Hết hạn', tone: 'neutral' },
  CANCELLED: { label: 'Đã hủy', tone: 'neutral' },
};

export function getPaymentOrderRows(breakdown?: AdminStatusBreakdown | null) {
  if (!breakdown) return [];
  const known = Object.keys(PAYMENT_ORDER_STATUS_LABELS);
  const keys = [...known, ...Object.keys(breakdown).filter((key) => !known.includes(key))];
  return keys
    .filter((key) => key in breakdown)
    .map((key) => ({
      key,
      label: PAYMENT_ORDER_STATUS_LABELS[key]?.label ?? key,
      tone: PAYMENT_ORDER_STATUS_LABELS[key]?.tone ?? 'neutral',
      count: Number(breakdown[key]) || 0,
    }));
}

/** "27/11" from an ISO date (`2026-11-27`) without timezone shifting. */
export function formatShortDate(isoDate: string) {
  const [, month, day] = isoDate.split('-');
  return month && day ? `${day}/${month}` : isoDate;
}

/** "14:05 27/11/2026" for the snapshot timestamp. */
export function formatSnapshotTime(value?: string | null) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(date);
}
