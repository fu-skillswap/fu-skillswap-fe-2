/**
 * @file bookingStatusConfig.ts
 * @description Single source of truth for how a mentee booking is presented: status label, tone,
 * progress step, "next step" copy, tab group and the card actions derived from backend capability flags.
 */

import type { MentorBookingResponse } from '@/models/auth';

export type BookingTone = 'pending' | 'payment' | 'upcoming' | 'action' | 'done' | 'ended';

export interface BookingToneStyle {
  bg: string;
  text: string;
  border?: string;
  dot?: string;
}

/** Tone palette, shared with the calendar prompt — keep the values identical. */
export const BOOKING_TONES: Record<BookingTone, BookingToneStyle> = {
  pending: { bg: '#FEF3C7', text: '#854D0E', border: '#F3D27A', dot: '#D97706' },
  payment: { bg: '#FFEDD5', text: '#9A3412', dot: '#EA580C' },
  upcoming: { bg: '#E0F2FE', text: '#075985', border: '#A5D8F7', dot: '#0284C7' },
  action: { bg: '#E0E7FF', text: '#3730A3', dot: '#6366F1' },
  done: { bg: '#DCFCE7', text: '#166534', dot: '#16A34A' },
  ended: { bg: '#F1F5F9', text: '#475569' },
};

export type BookingStateKey =
  | 'PENDING'
  | 'PAYMENT'
  | 'UPCOMING'
  | 'IN_SESSION'
  | 'CONFIRM'
  | 'FEEDBACK'
  | 'ISSUE'
  | 'DONE'
  | 'CANCELED_BY_ME'
  | 'CANCELED_BY_MENTOR'
  | 'REJECTED'
  | 'EXPIRED'
  | 'NO_SHOW';

/** Progress tracker step that is "current" for a state; `complete` means every step is done. */
export type BookingStepId = 'request' | 'accept' | 'pay' | 'learn' | 'review' | 'complete';

export interface BookingStatusConfig {
  key: BookingStateKey;
  label: string;
  tone: BookingTone;
  step: BookingStepId | null;
  /** Builds the "Việc tiếp theo" copy: a bold headline + one sentence of explanation. */
  nextText?: (mentor: string) => { title: string; detail: string };
}

export const BOOKING_STATUS_CONFIG: Record<BookingStateKey, BookingStatusConfig> = {
  PENDING: {
    key: 'PENDING',
    label: 'Chờ mentor nhận',
    tone: 'pending',
    step: 'accept',
    // TODO(api): responseDeadline — expose the server-enforced mentor response deadline on
    // MentorBookingResponse; only then replace this box with the calm/urgent deadline panel.
    // TODO(api): POST /api/me/bookings/{id}/nudge + nudgedAt to enable the "Nhắc mentor" button.
    nextText: (mentor) => ({
      title: `Việc tiếp theo: đợi ${mentor} nhận lịch.`,
      detail: 'Bạn sẽ có thông báo ngay khi mentor nhận lịch.',
    }),
  },
  PAYMENT: {
    key: 'PAYMENT',
    label: 'Chờ thanh toán',
    tone: 'payment',
    step: 'pay',
    nextText: (mentor) => ({
      title: 'Việc tiếp theo: thanh toán để giữ chỗ.',
      detail: `${mentor} đã nhận lịch. Buổi học chỉ được xác nhận sau khi bạn thanh toán.`,
    }),
  },
  UPCOMING: { key: 'UPCOMING', label: 'Sắp diễn ra', tone: 'upcoming', step: 'learn' },
  IN_SESSION: { key: 'IN_SESSION', label: 'Đang diễn ra', tone: 'upcoming', step: 'learn' },
  CONFIRM: {
    key: 'CONFIRM',
    label: 'Chờ bạn xác nhận',
    tone: 'action',
    step: 'learn',
    nextText: (mentor) => ({
      title: 'Việc tiếp theo: xác nhận buổi học đã hoàn tất.',
      detail: `${mentor} đã báo hoàn tất buổi học. Nếu có vấn đề, hãy báo trước khi xác nhận.`,
    }),
  },
  FEEDBACK: {
    key: 'FEEDBACK',
    label: 'Chờ đánh giá',
    tone: 'action',
    step: 'review',
    nextText: (mentor) => ({
      title: `Việc tiếp theo: đánh giá buổi học với ${mentor}.`,
      detail: 'Đánh giá của bạn giúp mentor cải thiện và giúp bạn khác chọn mentor phù hợp.',
    }),
  },
  ISSUE: {
    key: 'ISSUE',
    label: 'Đang xử lý sự cố',
    tone: 'action',
    step: 'learn',
    nextText: () => ({
      title: 'Việc tiếp theo: theo dõi kết quả xử lý sự cố.',
      detail: 'SkillSwap đang xem xét báo cáo. Bạn sẽ nhận thông báo khi có kết quả.',
    }),
  },
  DONE: { key: 'DONE', label: 'Đã học', tone: 'done', step: 'complete' },
  NO_SHOW: { key: 'NO_SHOW', label: 'Vắng mặt', tone: 'ended', step: null },
  CANCELED_BY_ME: { key: 'CANCELED_BY_ME', label: 'Bạn đã hủy', tone: 'ended', step: null },
  CANCELED_BY_MENTOR: {
    key: 'CANCELED_BY_MENTOR',
    label: 'Mentor đã hủy',
    tone: 'ended',
    step: null,
  },
  REJECTED: { key: 'REJECTED', label: 'Mentor từ chối', tone: 'ended', step: null },
  EXPIRED: { key: 'EXPIRED', label: 'Quá hạn', tone: 'ended', step: null },
};

const STATUS_KEYS: Record<string, BookingStateKey> = {
  PENDING: 'PENDING',
  REQUESTED: 'PENDING',
  ACCEPTED_AWAITING_PAYMENT: 'PAYMENT',
  WAITING_PAYMENT: 'PAYMENT',
  PAID: 'UPCOMING',
  CONFIRMED: 'UPCOMING',
  AWAITING_MENTOR_COMPLETION: 'IN_SESSION',
  AWAITING_MENTEE_CONFIRMATION: 'CONFIRM',
  UNDER_REVIEW: 'ISSUE',
  COMPLETED: 'DONE',
  AUTO_CLOSED: 'DONE',
  NO_SHOW: 'NO_SHOW',
  CANCELLED_BY_MENTEE: 'CANCELED_BY_ME',
  CANCELED_BY_MENTEE: 'CANCELED_BY_ME',
  CANCELLED_BY_MENTOR: 'CANCELED_BY_MENTOR',
  CANCELED_BY_MENTOR: 'CANCELED_BY_MENTOR',
  REJECTED: 'REJECTED',
  REJECTED_BY_MENTOR: 'REJECTED',
  REQUEST_EXPIRED: 'EXPIRED',
  EXPIRED_PENDING_MENTOR: 'EXPIRED',
  EXPIRED_AWAITING_PAYMENT: 'EXPIRED',
  PAYMENT_EXPIRED: 'EXPIRED',
};

const DISPLAY_STATE_KEYS: Record<string, BookingStateKey> = {
  PENDING_MENTOR_RESPONSE: 'PENDING',
  PAYMENT_REQUIRED: 'PAYMENT',
  UPCOMING: 'UPCOMING',
  IN_SESSION: 'IN_SESSION',
  WAITING_CONFIRMATION: 'CONFIRM',
  UNDER_REVIEW: 'ISSUE',
  FEEDBACK_REQUIRED: 'FEEDBACK',
  COMPLETED: 'DONE',
  CANCELED_OR_EXPIRED: 'EXPIRED',
};

const ENDED_KEYS: BookingStateKey[] = [
  'NO_SHOW',
  'CANCELED_BY_ME',
  'CANCELED_BY_MENTOR',
  'REJECTED',
  'EXPIRED',
];

/** Resolves the presentation state: displayState first, bookingStatus to disambiguate/fallback. */
export function getBookingStateKey(booking: MentorBookingResponse): BookingStateKey {
  const status = String(booking.bookingStatus || '')
    .trim()
    .toUpperCase();
  const display = String(booking.displayState || '')
    .trim()
    .toUpperCase();
  const fromStatus = STATUS_KEYS[status];

  // Terminal statuses are more specific than the combined CANCELED_OR_EXPIRED display state.
  if (fromStatus && ENDED_KEYS.includes(fromStatus)) return fromStatus;
  if (display === 'MENTOR_ACTION_REQUIRED') {
    return fromStatus === 'PENDING' || !fromStatus ? 'PENDING' : 'IN_SESSION';
  }
  return DISPLAY_STATE_KEYS[display] ?? fromStatus ?? 'PENDING';
}

export function getBookingStatusConfig(booking: MentorBookingResponse): BookingStatusConfig {
  return BOOKING_STATUS_CONFIG[getBookingStateKey(booking)];
}

/* ---------------------------------- Tabs ---------------------------------- */

export type BookingTabGroup =
  'ALL' | 'NEEDS_ACTION' | 'WAITING' | 'UPCOMING' | 'ENDED' | 'CANCELED';

export const BOOKING_TAB_GROUPS: Array<{ value: BookingTabGroup; label: string }> = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'NEEDS_ACTION', label: 'Cần bạn xử lý' },
  { value: 'WAITING', label: 'Chờ mentor' },
  { value: 'UPCOMING', label: 'Sắp tới' },
  { value: 'ENDED', label: 'Đã kết thúc' },
  { value: 'CANCELED', label: 'Đã hủy' },
];

/**
 * A mentee can still act on an expired request (pick another mentor or resend) while the session
 * start is in the future and they have not dismissed it; such bookings belong in "Cần bạn xử lý".
 */
export function getBookingTabGroup(
  booking: MentorBookingResponse,
  isActionableExpiry = false,
): Exclude<BookingTabGroup, 'ALL'> {
  if (isActionableExpiry) return 'NEEDS_ACTION';
  const config = getBookingStatusConfig(booking);
  if (config.key === 'NO_SHOW' || config.tone === 'done') return 'ENDED';
  if (config.tone === 'ended') return 'CANCELED';
  if (config.tone === 'payment' || config.tone === 'action') return 'NEEDS_ACTION';
  if (config.tone === 'upcoming') return 'UPCOMING';
  return 'WAITING';
}

/* --------------------------------- Expiry --------------------------------- */

const MENTOR_EXPIRY_STATUSES = ['REQUEST_EXPIRED', 'EXPIRED_PENDING_MENTOR'];

/** The request expired because the mentor never accepted it (not a missed payment). */
export function isMentorResponseExpiry(booking: MentorBookingResponse) {
  return MENTOR_EXPIRY_STATUSES.includes(
    String(booking.bookingStatus || '')
      .trim()
      .toUpperCase(),
  );
}

/** Expired by the mentor, session still ahead and not dismissed: the mentee can still rebook. */
export function isActionableExpiry(
  booking: MentorBookingResponse,
  dismissedIds: ReadonlySet<string>,
  now: number,
) {
  const start = toDate(booking.selectedStartTime);
  return (
    isMentorResponseExpiry(booking) &&
    !dismissedIds.has(booking.bookingId) &&
    Boolean(start && start.getTime() > now)
  );
}

/* --------------------------------- Helpers -------------------------------- */

export function getMentorName(booking: MentorBookingResponse) {
  return booking.mentorDisplayName?.trim() || 'Mentor';
}

export function getBookingPrice(booking: MentorBookingResponse) {
  return Math.max(0, Number(booking.servicePriceScoinSnapshot) || 0);
}

/** A priced booking counts as paid once it has moved past the payment step. */
export function isBookingPaid(booking: MentorBookingResponse) {
  const key = getBookingStateKey(booking);
  return (
    getBookingPrice(booking) > 0 &&
    ['UPCOMING', 'IN_SESSION', 'CONFIRM', 'FEEDBACK', 'ISSUE', 'DONE'].includes(key)
  );
}

const PLATFORM_LABELS: Record<string, string> = {
  GOOGLE_MEET: 'Google Meet',
  ZOOM: 'Zoom',
  MICROSOFT_TEAMS: 'Microsoft Teams',
  DISCORD: 'Discord',
  OTHER: 'Online 1:1',
};

/** Human label for where the session happens, or undefined when unknown. */
export function getPlatformLabel(booking: MentorBookingResponse) {
  if (booking.meetingPlatform === 'OFFLINE') return booking.location?.trim() || 'Gặp trực tiếp';
  if (booking.meetingPlatform) return PLATFORM_LABELS[booking.meetingPlatform];
  return booking.location?.trim() || undefined;
}

export function toDate(value?: string | null) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

const pad = (value: number) => String(value).padStart(2, '0');
const WEEKDAYS = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
const SHORT_WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

export const formatTime = (date: Date) => `${pad(date.getHours())}:${pad(date.getMinutes())}`;
export const formatDayMonth = (date: Date) => `${pad(date.getDate())}/${pad(date.getMonth() + 1)}`;
export const formatWeekday = (date: Date) => WEEKDAYS[date.getDay()];
export const formatShortWeekday = (date: Date) => SHORT_WEEKDAYS[date.getDay()];
export const formatFullDate = (date: Date) =>
  `${formatWeekday(date)} ${formatDayMonth(date)}/${date.getFullYear()}`;

/** "Hôm nay, 18:20" for today, otherwise "dd/MM". */
export function formatRelativeStamp(date: Date) {
  const now = new Date();
  if (date.toDateString() === now.toDateString()) return `Hôm nay, ${formatTime(date)}`;
  return formatDayMonth(date);
}

/** "20:00 – 21:00 (60 phút)" */
export function formatTimeRange(booking: MentorBookingResponse, withDuration = true) {
  const start = toDate(booking.selectedStartTime);
  const end = toDate(booking.selectedEndTime);
  if (!start) return undefined;
  const range = end ? `${formatTime(start)} – ${formatTime(end)}` : formatTime(start);
  const minutes =
    booking.serviceDurationSnapshot ||
    (end ? Math.round((end.getTime() - start.getTime()) / 60000) : 0);
  return withDuration && minutes > 0 ? `${range} (${minutes} phút)` : range;
}

/* --------------------------------- Actions -------------------------------- */

export type BookingPrimaryAction =
  | { kind: 'pay'; label: string }
  | { kind: 'confirm'; label: string }
  | { kind: 'join'; label: string; disabled?: boolean }
  | { kind: 'checkIn'; label: string };

export interface BookingActions {
  primary?: BookingPrimaryAction;
  /** Secondary capabilities, rendered as outline buttons. */
  canCheckIn: boolean;
  canMessage: boolean;
  canReportIssue: boolean;
  canRespondIssue: boolean;
  canCancel: boolean;
  cancelLabel: 'Hủy yêu cầu' | 'Hủy lịch';
}

/** Derives card actions from the same backend capability flags the page used before. */
export function getBookingActions(booking: MentorBookingResponse): BookingActions {
  const key = getBookingStateKey(booking);
  const canCheckIn = Boolean(
    booking.attendance?.canCheckIn && !booking.attendance.currentUserCheckedIn,
  );
  const canMessage =
    Boolean(booking.conversationId || booking.mentorUserId) &&
    [
      'UPCOMING',
      'IN_SESSION',
      'WAITING_CONFIRMATION',
      'UNDER_REVIEW',
      'FEEDBACK_REQUIRED',
      'COMPLETED',
    ].includes(booking.displayState);
  const isPendingStatus =
    booking.bookingStatus === 'PENDING' ||
    booking.bookingStatus === 'REQUESTED' ||
    booking.displayState === 'PENDING_MENTOR_RESPONSE';
  const canCancel = Boolean(booking.canCancel && isPendingStatus);
  const platform = getPlatformLabel(booking);
  const joinTarget =
    booking.meetingPlatform && booking.meetingPlatform !== 'OFFLINE' && platform !== 'Online 1:1'
      ? platform
      : 'phòng học';
  const joinAt = toDate(booking.joinAvailableAt);

  let primary: BookingPrimaryAction | undefined;
  if (booking.canPay) primary = { kind: 'pay', label: 'Thanh toán' };
  else if (booking.canConfirmByMentee) primary = { kind: 'confirm', label: 'Xác nhận hoàn tất' };
  else if (booking.canJoin && booking.meetingLink) {
    primary = { kind: 'join', label: `Vào ${joinTarget}` };
  } else if (
    (key === 'UPCOMING' || key === 'IN_SESSION') &&
    booking.meetingLink &&
    joinAt &&
    joinAt.getTime() > Date.now()
  ) {
    primary = {
      kind: 'join',
      label: `Vào ${joinTarget} · mở lúc ${formatTime(joinAt)}`,
      disabled: true,
    };
  } else if (canCheckIn) primary = { kind: 'checkIn', label: 'Check-in' };

  return {
    primary,
    canCheckIn: canCheckIn && primary?.kind !== 'checkIn',
    canMessage,
    canReportIssue: Boolean(booking.canReportIssue),
    canRespondIssue: Boolean(booking.canRespondIssue),
    canCancel,
    cancelLabel: key === 'PENDING' ? 'Hủy yêu cầu' : 'Hủy lịch',
  };
}
