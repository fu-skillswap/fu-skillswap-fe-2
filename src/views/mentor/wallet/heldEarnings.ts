/**
 * @file heldEarnings.ts
 * @description Tiền mentee đã trả nhưng SkillSwap đang tạm giữ (settlement `HELD`) cho tới khi buổi
 * học hoàn tất. Ví mentor (`GET /api/me/mentor-wallet`) chỉ trả số dư đã nhận, nên khoản đang giữ
 * được tính từ danh sách booking của mentor.
 * TODO(api): add `heldScoin` (mentor share after commission) to MentorWalletResponse so this
 * panel can show the exact amount the mentor will receive.
 */

import type { MentorBookingResponse } from '@/models/auth';

export type HeldStep = 'upcoming' | 'inSession' | 'needsMentor' | 'waitingMentee' | 'underReview';

export interface HeldEarning {
  bookingId: string;
  serviceTitle: string;
  menteeName: string;
  start?: Date;
  end?: Date;
  /** Session price paid by the mentee (before the platform fee). */
  priceScoin: number;
  step: HeldStep;
  /** When the money is released automatically if nobody reports an issue. */
  releaseBy?: Date;
}

const REVIEW_WINDOW_MS = 24 * 60 * 60 * 1000;
const FINISHED_STATES = ['COMPLETED', 'CANCELED_OR_EXPIRED'];

const toDate = (value?: string | null) => {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

function isHeld(booking: MentorBookingResponse) {
  if (booking.serviceIsFreeSnapshot) return false;
  if (booking.settlementStatus) return booking.settlementStatus === 'HELD';
  // Some list responses omit settlementStatus: a paid, unfinished booking is still held.
  return (
    String(booking.paymentStatus ?? '').toUpperCase() === 'PAID' &&
    !FINISHED_STATES.includes(String(booking.displayState ?? '').toUpperCase())
  );
}

function stepOf(booking: MentorBookingResponse, now: number, start?: Date, end?: Date): HeldStep {
  const state = String(booking.displayState ?? '').toUpperCase();
  if (state === 'UNDER_REVIEW') return 'underReview';
  if (start && now < start.getTime()) return 'upcoming';
  if (state === 'IN_SESSION' || (end && now < end.getTime())) return 'inSession';
  return booking.canCompleteByMentor ? 'needsMentor' : 'waitingMentee';
}

export function getHeldEarnings(
  bookings: MentorBookingResponse[],
  now = Date.now(),
): HeldEarning[] {
  return bookings
    .filter(isHeld)
    .map((booking) => {
      const start = toDate(booking.selectedStartTime);
      const end = toDate(booking.selectedEndTime);
      const step = stepOf(booking, now, start, end);
      return {
        bookingId: booking.bookingId,
        serviceTitle:
          booking.serviceTitle?.trim() || booking.learningGoalTitle || 'Buổi mentoring 1:1',
        menteeName: booking.menteeDisplayName,
        start,
        end,
        priceScoin: Math.max(
          0,
          Number(booking.servicePriceWithSurchargeScoin ?? booking.servicePriceScoinSnapshot) || 0,
        ),
        step,
        releaseBy:
          step === 'underReview'
            ? undefined
            : (toDate(booking.reviewDeadlineAt) ??
              (end ? new Date(end.getTime() + REVIEW_WINDOW_MS) : undefined)),
      };
    })
    .filter((item) => item.priceScoin > 0)
    .sort((a, b) => (a.start?.getTime() ?? 0) - (b.start?.getTime() ?? 0));
}

export const HELD_STEP_COPY: Record<HeldStep, { label: string; className: string }> = {
  upcoming: { label: 'Chưa diễn ra', className: 'bg-blue-50 text-primary border-blue-200' },
  inSession: { label: 'Đang diễn ra', className: 'bg-blue-50 text-primary border-blue-200' },
  needsMentor: {
    label: 'Cần bạn xác nhận',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  waitingMentee: {
    label: 'Chờ mentee xác nhận',
    className: 'bg-slate-100 text-slate-700 border-slate-200',
  },
  underReview: { label: 'Đang xử lý sự cố', className: 'bg-rose-50 text-rose-700 border-rose-200' },
};
