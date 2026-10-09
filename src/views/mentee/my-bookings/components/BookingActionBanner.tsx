/**
 * @file BookingActionBanner.tsx
 * @description Banner above every bookings view pointing at the next step the mentee must take:
 * pay for an accepted booking, or confirm a finished session.
 */

'use client';

import { AlertTriangle, CheckCircle2, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { MentorBookingResponse } from '@/models/auth';
import { getBookingActions } from '../bookingActions';

function byStart(left: MentorBookingResponse, right: MentorBookingResponse) {
  return new Date(left.selectedStartTime).getTime() - new Date(right.selectedStartTime).getTime();
}

export function BookingActionBanner({
  bookings,
  isSaving,
  onPay,
  onConfirm,
  onReportIssue,
  onShowPending,
}: {
  bookings: MentorBookingResponse[];
  isSaving: boolean;
  onPay: (booking: MentorBookingResponse) => void;
  onConfirm: (booking: MentorBookingResponse) => void;
  onReportIssue: (booking: MentorBookingResponse) => void;
  onShowPending: () => void;
}) {
  const payable = bookings.filter((booking) => booking.canPay).sort(byStart);
  const toConfirm = bookings.filter((booking) => booking.canConfirmByMentee).sort(byStart);

  if (payable.length > 0) {
    const booking = payable[0];
    const price = booking.servicePriceScoinSnapshot;
    return (
      <div
        className="flex flex-col gap-3 rounded-2xl border border-orange-200 bg-orange-50 p-4 sm:flex-row sm:items-center"
        role="status"
      >
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-orange-700 shadow-xs">
          <CreditCard className="h-5 w-5" aria-hidden="true" />
        </span>
        <p className="m-0 flex-1 text-sm text-text-secondary">
          <b className="text-text-main">
            {booking.serviceTitle || 'Dịch vụ mentoring'} với{' '}
            {booking.mentorDisplayName || 'mentor'}
          </b>{' '}
          đang chờ bạn thanh toán
          {/* TODO(api): append "· giữ chỗ đến {HH:mm hôm nay|dd/MM}" in orange once the booking
              response exposes a payment deadline. */}
          {payable.length > 1 && (
            <>
              {' · '}
              <button
                type="button"
                onClick={onShowPending}
                className="font-bold text-orange-800 underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-orange-300"
              >
                +{payable.length - 1} buổi khác
              </button>
            </>
          )}
        </p>
        <Button
          className="!border-orange-700 !bg-orange-700 hover:!bg-orange-800"
          leftIcon={<CreditCard className="h-4 w-4" />}
          loading={isSaving}
          onClick={() => onPay(booking)}
        >
          {price != null ? `Thanh toán ${price.toLocaleString('vi-VN')} S-coins` : 'Thanh toán'}
        </Button>
      </div>
    );
  }

  if (toConfirm.length > 0) {
    const booking = toConfirm[0];
    return (
      <div
        className="flex flex-col gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-4 sm:flex-row sm:items-center"
        role="status"
      >
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-primary shadow-xs">
          <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
        </span>
        <p className="m-0 flex-1 text-sm font-bold text-text-main">
          Xác nhận buổi {booking.serviceTitle || 'mentoring'} với{' '}
          {booking.mentorDisplayName || 'mentor'}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            leftIcon={<CheckCircle2 className="h-4 w-4" />}
            onClick={() => onConfirm(booking)}
          >
            Đã học
          </Button>
          {getBookingActions(booking).canReportIssue && (
            <Button
              variant="outline"
              leftIcon={<AlertTriangle className="h-4 w-4" />}
              onClick={() => onReportIssue(booking)}
            >
              Báo sự cố
            </Button>
          )}
        </div>
      </div>
    );
  }

  return null;
}
