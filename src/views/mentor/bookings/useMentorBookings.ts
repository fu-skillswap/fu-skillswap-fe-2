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
  'ALL' | 'REQUESTED' | 'WAITING_PAYMENT' | 'CONFIRMED' | 'UNDER_REVIEW' | 'COMPLETED' | 'CLOSED';

export type MentorBookingMutation =
  | { type: 'accept'; data: AcceptMentorBookingRequest }
  | { type: 'reject'; data: RejectMentorBookingRequest }
  | { type: 'complete'; data: CompleteMentorBookingRequest }
  | { type: 'cancel'; data: CancelMentorBookingRequest }
  | { type: 'checkIn' };

const PAGE_SIZE = 5;

export function bookingFilterOf(booking: MentorBookingResponse): MentorBookingFilter {
  if (booking.bookingStatus === 'REQUESTED') return 'REQUESTED';
  if (booking.bookingStatus === 'WAITING_PAYMENT') return 'WAITING_PAYMENT';
  if (booking.bookingStatus === 'CONFIRMED') return 'CONFIRMED';
  if (booking.bookingStatus === 'UNDER_REVIEW') return 'UNDER_REVIEW';
  if (booking.bookingStatus === 'COMPLETED') return 'COMPLETED';
  return 'CLOSED';
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
      REQUESTED: 0,
      WAITING_PAYMENT: 0,
      CONFIRMED: 0,
      UNDER_REVIEW: 0,
      COMPLETED: 0,
      CLOSED: 0,
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
