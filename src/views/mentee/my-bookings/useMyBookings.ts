/**
 * @file useMyBookings.ts
 * @description Điều phối danh sách và các action booking theo capability backend của Mentee.
 */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  ConfirmBookingRequest,
  MentorBookingResponse,
  SubmitBookingIssueRequest,
} from '@/models/auth';
import { useAuth } from '@/providers/AuthProvider';
import { bookingRepo } from '@/repositories/bookingRepo';

export type MenteeBookingTab =
  | 'ALL'
  | 'WAITING'
  | 'COMPLETED'
  | 'NO_SHOW'
  | 'REJECTED'
  | 'EXPIRED'
  | 'IN_PROGRESS'
  | 'CANCELLED_BY_MENTEE'
  | 'CANCELLED_BY_MENTOR';

export type MenteeBookingMutation =
  | { type: 'cancel'; reason: string }
  | { type: 'checkIn' }
  | { type: 'confirm'; data?: ConfirmBookingRequest }
  | { type: 'reportIssue'; data: SubmitBookingIssueRequest }
  | { type: 'respondIssue'; responseNote: string }
  | { type: 'pay' };

function tabOf(booking: MentorBookingResponse): MenteeBookingTab {
  const status = String(booking.bookingStatus || booking.displayState || 'PENDING').toUpperCase();

  // 1. Đang chờ: PENDING, ACCEPTED_AWAITING_PAYMENT, UNDER_REVIEW, AWAITING_MENTEE_CONFIRMATION
  if (
    [
      'PENDING',
      'REQUESTED',
      'PENDING_MENTOR_RESPONSE',
      'ACCEPTED_AWAITING_PAYMENT',
      'WAITING_PAYMENT',
      'PAYMENT_REQUIRED',
      'UNDER_REVIEW',
      'AWAITING_MENTEE_CONFIRMATION',
      'WAITING_CONFIRMATION',
    ].includes(status)
  ) {
    return 'WAITING';
  }

  // 2. Đã hoàn thành: COMPLETED, AUTO_CLOSED
  if (['COMPLETED', 'AUTO_CLOSED', 'FEEDBACK_REQUIRED'].includes(status)) {
    return 'COMPLETED';
  }

  // 3. Vắng mặt: NO_SHOW
  if (status === 'NO_SHOW') {
    return 'NO_SHOW';
  }

  // 4. Bị từ chối: REJECTED
  if (['REJECTED', 'REJECTED_BY_MENTOR'].includes(status)) {
    return 'REJECTED';
  }

  // 5. Quá hạn: REQUEST_EXPIRED, EXPIRED_PENDING_MENTOR, EXPIRED_AWAITING_PAYMENT
  if (
    [
      'REQUEST_EXPIRED',
      'EXPIRED_PENDING_MENTOR',
      'EXPIRED_AWAITING_PAYMENT',
      'PAYMENT_EXPIRED',
      'CANCELED_OR_EXPIRED',
    ].includes(status)
  ) {
    return 'EXPIRED';
  }

  // 6. Đang diễn ra: PAID, AWAITING_MENTOR_COMPLETION
  if (['PAID', 'AWAITING_MENTOR_COMPLETION', 'CONFIRMED', 'IN_SESSION', 'UPCOMING'].includes(status)) {
    return 'IN_PROGRESS';
  }

  // 7. Mentee hủy: CANCELLED_BY_MENTEE
  if (['CANCELLED_BY_MENTEE', 'CANCELED_BY_MENTEE'].includes(status)) {
    return 'CANCELLED_BY_MENTEE';
  }

  // 8. Mentor hủy: CANCELLED_BY_MENTOR
  if (['CANCELLED_BY_MENTOR', 'CANCELED_BY_MENTOR'].includes(status)) {
    return 'CANCELLED_BY_MENTOR';
  }

  return 'WAITING';
}

export function useMyBookings() {
  const { isBootstrapping } = useAuth();
  const [allBookings, setAllBookings] = useState<MentorBookingResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [activeTab, setActiveTab] = useState<MenteeBookingTab>('ALL');
  const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>('DESC');

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(undefined);
    try {
      const page = await bookingRepo.listForMentee();
      setAllBookings(page.content ?? []);
    } catch {
      setError('Không thể tải danh sách đặt lịch. Vui lòng thử lại sau.');
      setAllBookings([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isBootstrapping) void refresh();
  }, [isBootstrapping, refresh]);

  const bookings = useMemo(
    () =>
      allBookings
        .filter((booking) => activeTab === 'ALL' || tabOf(booking) === activeTab)
        .sort((left, right) => {
          const diff =
            new Date(left.selectedStartTime).getTime() - new Date(right.selectedStartTime).getTime();
          return sortDirection === 'ASC' ? diff : -diff;
        }),
    [activeTab, allBookings, sortDirection],
  );

  const counts = useMemo(() => {
    const result: Record<MenteeBookingTab, number> = {
      ALL: allBookings.length,
      WAITING: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
      NO_SHOW: 0,
      REJECTED: 0,
      EXPIRED: 0,
      CANCELLED_BY_MENTEE: 0,
      CANCELLED_BY_MENTOR: 0,
    };
    allBookings.forEach((booking) => {
      const tab = tabOf(booking);
      if (result[tab] !== undefined) {
        result[tab] += 1;
      }
    });
    return result;
  }, [allBookings]);

  const mutate = async (bookingId: string, mutation: MenteeBookingMutation) => {
    setIsSaving(true);
    try {
      if (mutation.type === 'cancel') await bookingRepo.cancel(bookingId, mutation.reason);
      if (mutation.type === 'checkIn') await bookingRepo.checkIn(bookingId);
      if (mutation.type === 'confirm') await bookingRepo.confirm(bookingId, mutation.data);
      if (mutation.type === 'reportIssue') await bookingRepo.reportIssue(bookingId, mutation.data);
      if (mutation.type === 'respondIssue') {
        await bookingRepo.respondIssue(bookingId, { responseNote: mutation.responseNote });
      }
      if (mutation.type === 'pay') {
        const payment = await bookingRepo.checkout(bookingId);
        const target = payment.checkoutUrl || payment.paymentLink;
        if (target) window.location.assign(target);
      }
      await refresh();
    } finally {
      setIsSaving(false);
    }
  };

  return {
    activeTab,
    bookings,
    counts,
    error,
    isLoading: isLoading || isBootstrapping,
    isSaving,
    mutate,
    refresh,
    setActiveTab,
    setSortDirection,
    sortDirection,
    totalCount: allBookings.length,
  };
}
