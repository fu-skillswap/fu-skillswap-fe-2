/**
 * @file mentorViolations.helpers.ts
 * @description Shared logic of the admin mentor-violation screens: query keys, the single date
 * format, booking-suspension and violation-state rules.
 */

import type { MentorViolationItemResponse } from '@/models/auth';

/** Root key of every admin query about one mentor's violations (history pages + summary). */
export const mentorViolationsQueryKey = (mentorUserId: string) =>
  ['admin', 'mentor-violations', mentorUserId] as const;

/** Root key of the admin mentors list. */
export const ADMIN_MENTORS_QUERY_KEY = ['admin', 'mentors'] as const;

export const ADMIN_VIOLATIONS_STALE_TIME = 60_000;

const pad = (value: number) => String(value).padStart(2, '0');

/** "HH:mm dd/MM/yyyy" in local time: the only date format of the mentor-violation screens. */
export function formatViolationDateTime(value?: string | null, fallback = '—') {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return `${pad(date.getHours())}:${pad(date.getMinutes())} ${pad(date.getDate())}/${pad(
    date.getMonth() + 1,
  )}/${date.getFullYear()}`;
}

export function formatPoints(value?: number | null) {
  return value == null ? '—' : new Intl.NumberFormat('vi-VN').format(value);
}

/** "0964509006" -> "0964 509 006"; other shapes are returned unchanged. */
export function formatPhoneNumber(value: string) {
  const digits = value.replace(/[\s.-]/g, '');
  if (/^0\d{9}$/.test(digits)) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  if (/^\+84\d{9}$/.test(digits)) {
    return `+84 ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`;
  }
  return value;
}

export function isBookingSuspended(
  summary?: { bookingSuspendedUntil?: string | null } | null,
  now: number = Date.now(),
) {
  const until = summary?.bookingSuspendedUntil;
  if (!until) return false;
  const time = new Date(until).getTime();
  return !Number.isNaN(time) && time > now;
}

export type ViolationState = 'active' | 'expired' | 'reversed';

export const VIOLATION_STATE_LABELS: Record<ViolationState, string> = {
  active: 'Đang tính điểm',
  expired: 'Hết hạn tính điểm',
  reversed: 'Đã gỡ',
};

/** Reversed -> "Đã gỡ"; older than the active window -> "Hết hạn tính điểm"; else "Đang tính điểm". */
export function violationState(
  item: Pick<MentorViolationItemResponse, 'reversedAt' | 'occurredAt'>,
  activeWindowStartAt?: string | null,
): ViolationState {
  if (item.reversedAt) return 'reversed';
  if (item.occurredAt && activeWindowStartAt) {
    const occurred = new Date(item.occurredAt).getTime();
    const windowStart = new Date(activeWindowStartAt).getTime();
    if (!Number.isNaN(occurred) && !Number.isNaN(windowStart) && occurred < windowStart) {
      return 'expired';
    }
  }
  return 'active';
}

export function shortBookingId(bookingId: string) {
  return bookingId.slice(0, 8);
}

/** Overrides for `<Button variant="outline">`: the outlined red "Gỡ vi phạm" action. */
export const DANGER_OUTLINE_BUTTON_CLASS =
  '!border-red-200 !bg-white !text-red-700 hover:!border-red-600 hover:!bg-red-50';
