/**
 * @file useMentorBookings.ts
 * @description Điều phối danh sách, bộ lọc và các action booking dành cho Mentor.
 */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  AcceptMentorBookingRequest,
  CancelMentorBookingRequest,
  CompleteMentorBookingRequest,
  GoogleCalendarStatusResponse,
  MentorBookingResponse,
  RejectMentorBookingRequest,
} from '@/models/auth';
import { useAuth } from '@/providers/AuthProvider';
import { mentorBookingRepo } from '@/repositories/mentorBookingRepo';
import { bookingRepo } from '@/repositories/bookingRepo';
import { mentorSchedulingRepo } from '@/repositories/mentorSchedulingRepo';
import { getUserFriendlyErrorMessage } from '@/utils/toast';

export type MentorBookingFilter =
  | 'ALL'
  | 'WAITING'
  | 'COMPLETED'
  | 'NO_SHOW'
  | 'REJECTED'
  | 'EXPIRED'
  | 'IN_PROGRESS'
  | 'CANCELLED_BY_MENTEE'
  | 'CANCELLED_BY_MENTOR';

export type MentorBookingMutation =
  | { type: 'accept'; data: AcceptMentorBookingRequest }
  | { type: 'reject'; data: RejectMentorBookingRequest }
  | { type: 'complete'; data: CompleteMentorBookingRequest }
  | { type: 'cancel'; data: CancelMentorBookingRequest }
  | { type: 'checkIn' };

export function bookingFilterOf(booking: MentorBookingResponse): MentorBookingFilter {
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
  if (
    ['PAID', 'AWAITING_MENTOR_COMPLETION', 'CONFIRMED', 'IN_SESSION', 'UPCOMING'].includes(status)
  ) {
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

function localDateKey(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function useMentorBookings() {
  const { isBootstrapping } = useAuth();
  const [allBookings, setAllBookings] = useState<MentorBookingResponse[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [googleCalendarStatus, setGoogleCalendarStatus] = useState<GoogleCalendarStatusResponse>();

  /** `silent` keeps the current list on screen (used after mutations, no skeleton flash). */
  const refresh = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    setError(undefined);
    try {
      const [page, calendarStatus] = await Promise.all([
        mentorBookingRepo.list(),
        mentorSchedulingRepo.getGoogleCalendarStatus().catch(() => undefined),
      ]);
      setAllBookings(page.content ?? []);
      setGoogleCalendarStatus(calendarStatus);
    } catch (reason) {
      if (!silent) setAllBookings([]);
      setError(getUserFriendlyErrorMessage(reason, 'Không thể tải lịch đặt. Vui lòng thử lại.'));
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isBootstrapping) void refresh();
  }, [isBootstrapping, refresh]);

  const serviceOptions = useMemo(
    () =>
      [...new Set(allBookings.map((booking) => booking.serviceTitle?.trim()).filter(Boolean))]
        .map(String)
        .sort((a, b) => a.localeCompare(b, 'vi')),
    [allBookings],
  );

  // Grouping and ordering per inbox section happen in the view.
  const bookings = useMemo(
    () =>
      allBookings.filter(
        (booking) =>
          (!selectedDate || localDateKey(booking.selectedStartTime) === selectedDate) &&
          (!serviceFilter || booking.serviceTitle?.trim() === serviceFilter),
      ),
    [allBookings, selectedDate, serviceFilter],
  );

  const loadDetail = (bookingId: string) => mentorBookingRepo.detail(bookingId);

  /**
   * Runs a booking action, then refetches quietly. With `optimistic`, the booking is patched
   * locally first and restored if the request fails (the error is rethrown for the caller).
   */
  const mutate = async (
    bookingId: string,
    mutation: MentorBookingMutation,
    optimistic?: Partial<MentorBookingResponse>,
  ) => {
    const previous = allBookings.find((booking) => booking.bookingId === bookingId);
    const patchLocal = (patch: Partial<MentorBookingResponse> | MentorBookingResponse) =>
      setAllBookings((current) =>
        current.map((booking) =>
          booking.bookingId === bookingId ? { ...booking, ...patch } : booking,
        ),
      );
    setIsSaving(true);
    if (optimistic) patchLocal(optimistic);
    try {
      if (mutation.type === 'accept') await mentorBookingRepo.accept(bookingId, mutation.data);
      if (mutation.type === 'reject') await mentorBookingRepo.reject(bookingId, mutation.data);
      if (mutation.type === 'complete') await mentorBookingRepo.complete(bookingId, mutation.data);
      if (mutation.type === 'cancel') await mentorBookingRepo.cancel(bookingId, mutation.data);
      if (mutation.type === 'checkIn') await bookingRepo.checkIn(bookingId);
      void refresh(true);
      return true;
    } catch (reason) {
      if (optimistic && previous) patchLocal(previous);
      throw reason;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    bookings,
    error,
    googleCalendarStatus,
    isLoading: isLoading || isBootstrapping,
    isSaving,
    loadDetail,
    mutate,
    refresh,
    selectedDate,
    serviceFilter,
    serviceOptions,
    setSelectedDate,
    setServiceFilter,
  };
}
