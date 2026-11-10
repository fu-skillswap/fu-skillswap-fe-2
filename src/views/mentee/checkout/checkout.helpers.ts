/**
 * @file checkout.helpers.ts
 * @description Pure helpers for the booking checkout confirmation page.
 */

import type { MentorBookingResponse } from '@/models/auth';
import { ApiClientError } from '@/models/apiClient';
import { formatDayMonth, formatTime, toDate } from '../my-bookings/bookingStatusConfig';

/** "HH:mm hôm nay" | "HH:mm dd/MM" (24h, device time like the booking card). */
export function formatWhen(date: Date, now = new Date()) {
  const sameDay = date.toDateString() === now.toDateString();
  return `${formatTime(date)} ${sameDay ? 'hôm nay' : formatDayMonth(date)}`;
}

/** Axios network failures / timeouts surface as these codes in ApiClientError. */
const NETWORK_CODES = ['ECONNABORTED', 'ETIMEDOUT', 'ERR_NETWORK', 'NETWORK_ERROR'];

export function isNetworkError(error: unknown) {
  return error instanceof ApiClientError && NETWORK_CODES.includes(error.code);
}

/**
 * True when checkout rejected the coupon (not the payment itself).
 * TODO(api): replace heuristics with BE coupon error codes.
 */
export function isCouponRejection(error: unknown) {
  if (!(error instanceof ApiClientError) || error.status < 400 || error.status >= 500) return false;
  const code = error.code.toUpperCase();
  return ['COUPON', 'EXPIRED', 'NOT_STARTED', 'QUOTA', 'NOT_APPLICABLE', 'MIN_ORDER'].some((part) =>
    code.includes(part),
  );
}

export type RefundSegment = {
  key: 'early' | 'late' | 'session' | 'review';
  label: string;
  caption: string;
  /** The window is already over (shown dimmed). */
  passed: boolean;
};

export type RefundTimeline = {
  segments: RefundSegment[];
  ariaLabel: string;
  mentorRefundPercent: number;
};

/** Refund timeline from the booking's policy; null when the policy or start time is missing. */
export function buildRefundTimeline(
  booking: MentorBookingResponse,
  now = new Date(),
): RefundTimeline | null {
  const policy = booking.cancellationRefundPolicy;
  const start = toDate(booking.selectedStartTime);
  if (!policy || !start) return null;
  const early = new Date(start.getTime() - policy.earlyMenteeCancellationDeadlineMinutes * 60000);
  const earlyWhen = formatWhen(early, now);
  const startWhen = formatWhen(start, now);
  const earlyPassed = now.getTime() > early.getTime();
  const segments: RefundSegment[] = [
    {
      key: 'early',
      label: `Hoàn ${policy.earlyMenteeRefundPercent}%`,
      caption: earlyPassed ? `Đã qua mốc ${earlyWhen}` : `Hủy trước ${earlyWhen}`,
      passed: earlyPassed,
    },
    {
      key: 'late',
      label: `Hoàn ${policy.lateMenteeRefundPercent}%`,
      caption: `Từ ${formatTime(early)} đến giờ học`,
      passed: now.getTime() > start.getTime(),
    },
    { key: 'session', label: 'Học', caption: startWhen, passed: false },
    {
      key: 'review',
      label: '24 giờ xác nhận',
      caption: 'Báo sự cố nếu buổi học có vấn đề',
      passed: false,
    },
  ];
  const ariaLabel =
    (earlyPassed
      ? `Mốc hủy được hoàn ${policy.earlyMenteeRefundPercent}% đã qua lúc ${earlyWhen}. `
      : `Hủy trước ${earlyWhen} được hoàn ${policy.earlyMenteeRefundPercent}%. `) +
    `Hủy từ ${formatTime(early)} đến giờ học được hoàn ${policy.lateMenteeRefundPercent}%. ` +
    `Buổi học bắt đầu lúc ${startWhen}. ` +
    'Sau buổi học bạn có 24 giờ để xác nhận hoặc báo sự cố.';
  return { segments, ariaLabel, mentorRefundPercent: policy.mentorCancellationRefundPercent };
}
