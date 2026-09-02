/**
 * @file useMentorBookings.ts
 * @description Điều phối danh sách, bộ lọc và các action booking dành cho Mentor.
 */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiClientError } from '@/models/apiClient';
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

const PAGE_SIZE = 5;

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
  const [activeFilter, setActiveFilter] = useState<MentorBookingFilter>('ALL');
  const [selectedDate, setSelectedDate] = useState('');
  const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>('ASC');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [googleCalendarStatus, setGoogleCalendarStatus] = useState<GoogleCalendarStatusResponse>();

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(undefined);
    try {
      const [page, calendarStatus] = await Promise.all([
        mentorBookingRepo.list(),
        mentorSchedulingRepo.getGoogleCalendarStatus().catch(() => undefined),
      ]);
      setAllBookings(page.content ?? []);
      setGoogleCalendarStatus(calendarStatus);
    } catch (reason) {
      setAllBookings([]);
      setError(
        reason instanceof ApiClientError
          ? reason.message
          : 'Không thể tải lịch đặt. Vui lòng thử lại.',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isBootstrapping) void refresh();
  }, [isBootstrapping, refresh]);

  const counts = useMemo(() => {
    const result: Record<MentorBookingFilter, number> = {
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
      result[bookingFilterOf(booking)] += 1;
    });
    return result;
  }, [allBookings]);

  const filteredBookings = useMemo(() => {
    return allBookings
      .filter((booking) => {
        const matchesStatus = activeFilter === 'ALL' || bookingFilterOf(booking) === activeFilter;
        const matchesDate =
          !selectedDate || localDateKey(booking.selectedStartTime) === selectedDate;
        return matchesStatus && matchesDate;
      })
      .sort((left, right) => {
        const difference =
          new Date(left.selectedStartTime).getTime() - new Date(right.selectedStartTime).getTime();
        return sortDirection === 'ASC' ? difference : -difference;
      });
  }, [activeFilter, allBookings, selectedDate, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / PAGE_SIZE));
  const bookings = useMemo(() => {
    const safePage = Math.min(currentPage, totalPages);
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredBookings.slice(start, start + PAGE_SIZE);
  }, [currentPage, filteredBookings, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, selectedDate, sortDirection]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const loadDetail = (bookingId: string) => mentorBookingRepo.detail(bookingId);

  const mutate = async (bookingId: string, mutation: MentorBookingMutation) => {
    setIsSaving(true);
    try {
      if (mutation.type === 'accept') await mentorBookingRepo.accept(bookingId, mutation.data);
      if (mutation.type === 'reject') await mentorBookingRepo.reject(bookingId, mutation.data);
      if (mutation.type === 'complete') await mentorBookingRepo.complete(bookingId, mutation.data);
      if (mutation.type === 'cancel') await mentorBookingRepo.cancel(bookingId, mutation.data);
      if (mutation.type === 'checkIn') await bookingRepo.checkIn(bookingId);
      await refresh();
      return true;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    activeFilter,
    bookings,
    counts,
    currentPage,
    error,
    googleCalendarStatus,
    isLoading: isLoading || isBootstrapping,
    isSaving,
    loadDetail,
    mutate,
    refresh,
    selectedDate,
    setActiveFilter,
    setCurrentPage,
    setSelectedDate,
    setSortDirection,
    sortDirection,
    totalPages,
  };
}
