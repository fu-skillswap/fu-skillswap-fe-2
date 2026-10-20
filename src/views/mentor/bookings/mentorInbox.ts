/**
 * @file mentorInbox.ts
 * @description Mentor "Lịch đặt" inbox model: section/tab grouping, mentor-side status labels,
 * explanation lines for ended bookings and date formatting. Status resolution and tones come
 * from the shared booking status config so mentor and mentee pages stay consistent.
 */

import type { MentorBookingResponse } from '@/models/auth';
import {
  BOOKING_TONES,
  type BookingStateKey,
  type BookingToneStyle,
  formatDayMonth,
  formatTime,
  formatWeekday,
  getBookingPrice,
  getBookingStateKey,
  getPlatformLabel,
  isBookingPaid,
  toDate,
} from '@/views/mentee/my-bookings/bookingStatusConfig';

export type InboxGroup = 'PENDING' | 'UPCOMING' | 'CONFIRM' | 'ENDED' | 'CANCELED';
export type InboxTab = 'ALL' | InboxGroup;

export const INBOX_TABS: Array<{ value: InboxTab; label: string }> = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'PENDING', label: 'Cần phản hồi' },
  { value: 'UPCOMING', label: 'Sắp tới' },
  { value: 'CONFIRM', label: 'Chờ xác nhận' },
  { value: 'ENDED', label: 'Đã kết thúc' },
  { value: 'CANCELED', label: 'Đã hủy & quá hạn' },
];

const GROUP_BY_STATE: Record<BookingStateKey, InboxGroup> = {
  PENDING: 'PENDING',
  PAYMENT: 'UPCOMING',
  UPCOMING: 'UPCOMING',
  IN_SESSION: 'UPCOMING',
  CONFIRM: 'CONFIRM',
  FEEDBACK: 'CONFIRM',
  ISSUE: 'CONFIRM',
  DONE: 'ENDED',
  NO_SHOW: 'ENDED',
  CANCELED_BY_ME: 'CANCELED',
  CANCELED_BY_MENTOR: 'CANCELED',
  REJECTED: 'CANCELED',
  EXPIRED: 'CANCELED',
};

export const inboxGroupOf = (booking: MentorBookingResponse) =>
  GROUP_BY_STATE[getBookingStateKey(booking)];

/* ------------------------------ Status labels ------------------------------ */

// The shared config speaks to the mentee ("Bạn đã hủy"); these are the mentor's words.
const MENTOR_LABELS: Partial<Record<BookingStateKey, string>> = {
  PAYMENT: 'Chờ mentee thanh toán',
  CONFIRM: 'Chờ mentee xác nhận',
  FEEDBACK: 'Chờ mentee đánh giá',
  ISSUE: 'Đang xử lý sự cố',
  IN_SESSION: 'Đang diễn ra',
  DONE: 'Đã hoàn thành',
  NO_SHOW: 'Vắng mặt',
  CANCELED_BY_ME: 'Mentee đã hủy',
  CANCELED_BY_MENTOR: 'Bạn đã hủy',
  REJECTED: 'Đã từ chối',
  EXPIRED: 'Quá hạn',
};

export function mentorStatusPill(
  booking: MentorBookingResponse,
): { label: string; tone: BookingToneStyle } | undefined {
  const key = getBookingStateKey(booking);
  const label = MENTOR_LABELS[key];
  if (!label) return undefined;
  const tone =
    key === 'DONE'
      ? BOOKING_TONES.done
      : key === 'PAYMENT'
        ? BOOKING_TONES.payment
        : GROUP_BY_STATE[key] === 'CONFIRM' || key === 'IN_SESSION'
          ? BOOKING_TONES.action
          : BOOKING_TONES.ended;
  return { label, tone };
}

const withReason = (text: string, reason?: string | null) =>
  reason?.trim() ? `${text} · Lý do: ${reason.trim()}` : text;

/** One plain sentence telling the mentor why an ended booking ended. */
export function endedExplanation(booking: MentorBookingResponse) {
  const mentee = booking.menteeDisplayName || 'Mentee';
  switch (getBookingStateKey(booking)) {
    case 'EXPIRED':
      // TODO(api): responseDeadline / expiredAt — say "trước HH:mm, dd/MM".
      return 'Bạn chưa phản hồi kịp nên yêu cầu đã tự hủy. Mentee đã được gợi ý tìm mentor khác.';
    case 'REJECTED':
      return withReason('Bạn đã từ chối', booking.rejectReason);
    case 'CANCELED_BY_ME':
      return withReason(`${mentee} đã hủy`, booking.cancelReason);
    case 'CANCELED_BY_MENTOR':
      return withReason('Bạn đã hủy', booking.cancelReason);
    case 'NO_SHOW':
      return `${mentee} vắng mặt`;
    case 'DONE':
      return 'Buổi học đã hoàn thành.';
    default:
      return '';
  }
}

export const isExpired = (booking: MentorBookingResponse) =>
  getBookingStateKey(booking) === 'EXPIRED';

/* -------------------------------- Formatting ------------------------------- */

const dayKey = (date: Date) => date.toDateString();

function relativeDay(date: Date) {
  const today = new Date();
  const offset = (days: number) => {
    const target = new Date(today);
    target.setDate(today.getDate() + days);
    return dayKey(target);
  };
  if (dayKey(date) === offset(0)) return 'hôm nay';
  if (dayKey(date) === offset(-1)) return 'hôm qua';
  if (dayKey(date) === offset(1)) return 'ngày mai';
  return undefined;
}

/** "Gửi lúc 16:20 hôm qua" / "Gửi lúc 16:20 18/10". */
export function sentLabel(booking: MentorBookingResponse) {
  const created = toDate(booking.createdAt);
  if (!created) return undefined;
  const day = relativeDay(created);
  return `Gửi lúc ${formatTime(created)} ${day && day !== 'ngày mai' ? day : formatDayMonth(created)}`;
}

/** Day header for the upcoming list: "Hôm nay", "Ngày mai" or "Thứ Năm, 22/10". */
export function dayHeader(date: Date) {
  const day = relativeDay(date);
  if (day === 'hôm nay') return 'Hôm nay';
  if (day === 'ngày mai') return 'Ngày mai';
  return `${formatWeekday(date)}, ${formatDayMonth(date)}`;
}

export { dayKey };

/** "20:00 – 21:00" */
export function timeRange(booking: MentorBookingResponse) {
  const start = toDate(booking.selectedStartTime);
  const end = toDate(booking.selectedEndTime);
  if (!start) return '';
  return end ? `${formatTime(start)} – ${formatTime(end)}` : formatTime(start);
}

/** "Thứ Tư 21/10 · 20:00 – 21:00" */
export function sessionLabel(booking: MentorBookingResponse) {
  const start = toDate(booking.selectedStartTime);
  if (!start) return '';
  return `${formatWeekday(start)} ${formatDayMonth(start)} · ${timeRange(booking)}`;
}

/** "18/10 · 19:00" for compact ended rows. */
export function shortStamp(booking: MentorBookingResponse) {
  const start = toDate(booking.selectedStartTime);
  return start ? `${formatDayMonth(start)} · ${formatTime(start)}` : '';
}

export function durationMinutes(booking: MentorBookingResponse) {
  const start = toDate(booking.selectedStartTime);
  const end = toDate(booking.selectedEndTime);
  return (
    booking.serviceDurationSnapshot ||
    (start && end ? Math.round((end.getTime() - start.getTime()) / 60000) : 0)
  );
}

export function priceLabel(booking: MentorBookingResponse) {
  const price = getBookingPrice(booking);
  return price > 0 ? `${new Intl.NumberFormat('vi-VN').format(price)} S-coins` : 'Miễn phí';
}

export { getPlatformLabel, isBookingPaid, toDate, formatTime };

/** Sort helper: earliest session first. */
export const byStartAsc = (a: MentorBookingResponse, b: MentorBookingResponse) =>
  (toDate(a.selectedStartTime)?.getTime() ?? 0) - (toDate(b.selectedStartTime)?.getTime() ?? 0);

/**
 * Local state shown right after "Nhận lịch" succeeds optimistically: a paid service waits for
 * the mentee's payment, a free one is confirmed. The next refetch replaces it with server data.
 */
export function acceptedPatch(booking: MentorBookingResponse): Partial<MentorBookingResponse> {
  const paid = getBookingPrice(booking) > 0;
  return {
    bookingStatus: paid ? 'ACCEPTED_AWAITING_PAYMENT' : 'CONFIRMED',
    displayState: paid ? 'PAYMENT_REQUIRED' : 'UPCOMING',
    canAccept: false,
    canReject: false,
  };
}
