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
  MentorBookingResponse,
  RejectMentorBookingRequest,
} from '@/models/auth';
import { useAuth } from '@/providers/AuthProvider';
import { mentorBookingRepo } from '@/repositories/mentorBookingRepo';

export type MentorBookingFilter =
  'NEW' | 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'ALL';

export type MentorBookingMutation =
  | { type: 'accept'; data: AcceptMentorBookingRequest }
  | { type: 'reject'; data: RejectMentorBookingRequest }
  | { type: 'complete'; data: CompleteMentorBookingRequest }
  | { type: 'cancel'; data: CancelMentorBookingRequest };

export function bookingFilterOf(booking: MentorBookingResponse): MentorBookingFilter {
  if (booking.canAccept || booking.displayState === 'PENDING_MENTOR_RESPONSE') return 'NEW';
  if (
    booking.displayState === 'IN_SESSION' ||
    booking.displayState === 'WAITING_CONFIRMATION' ||
    booking.displayState === 'UNDER_REVIEW' ||
    booking.actualSessionStatus === 'IN_PROGRESS'
  ) {
    return 'IN_PROGRESS';
  }
  if (booking.displayState === 'COMPLETED' || booking.bookingStatus === 'COMPLETED') {
    return 'COMPLETED';
  }
  if (
    booking.displayState === 'CANCELED_OR_EXPIRED' ||
    booking.bookingStatus === 'REJECTED_BY_MENTOR' ||
    booking.bookingStatus === 'CANCELED_BY_MENTEE' ||
    booking.bookingStatus === 'CANCELED_BY_MENTOR' ||
    booking.bookingStatus === 'REQUEST_EXPIRED' ||
    booking.bookingStatus === 'PAYMENT_EXPIRED'
  ) {
    return 'CANCELLED';
  }
  return 'UPCOMING';
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
  const [activeFilter, setActiveFilter] = useState<MentorBookingFilter>('NEW');
  const [selectedDate, setSelectedDate] = useState('');
  const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>('ASC');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>();

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(undefined);
    try {
      const page = await mentorBookingRepo.list();
      setAllBookings(page.content ?? []);
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
      NEW: 0,
      UPCOMING: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
      CANCELLED: 0,
      ALL: allBookings.length,
    };
    allBookings.forEach((booking) => {
      result[bookingFilterOf(booking)] += 1;
    });
    return result;
  }, [allBookings]);

  const bookings = useMemo(() => {
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

  const loadDetail = (bookingId: string) => mentorBookingRepo.detail(bookingId);

  const mutate = async (bookingId: string, mutation: MentorBookingMutation) => {
    setIsSaving(true);
    try {
      if (mutation.type === 'accept') await mentorBookingRepo.accept(bookingId, mutation.data);
      if (mutation.type === 'reject') await mentorBookingRepo.reject(bookingId, mutation.data);
      if (mutation.type === 'complete') await mentorBookingRepo.complete(bookingId, mutation.data);
      if (mutation.type === 'cancel') await mentorBookingRepo.cancel(bookingId, mutation.data);
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
    error,
    isLoading: isLoading || isBootstrapping,
    isSaving,
    loadDetail,
    mutate,
    refresh,
    selectedDate,
    setActiveFilter,
    setSelectedDate,
    setSortDirection,
    sortDirection,
  };
}
