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

export type MenteeBookingTab = 'ALL' | 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
export type MenteeBookingMutation =
  | { type: 'cancel'; reason: string }
  | { type: 'checkIn' }
  | { type: 'confirm'; data?: ConfirmBookingRequest }
  | { type: 'reportIssue'; data: SubmitBookingIssueRequest }
  | { type: 'respondIssue'; responseNote: string }
  | { type: 'pay' };

function tabOf(booking: MentorBookingResponse): MenteeBookingTab {
  if (booking.displayState === 'COMPLETED' || booking.displayState === 'FEEDBACK_REQUIRED') {
    return 'COMPLETED';
  }
  if (booking.displayState === 'CANCELED_OR_EXPIRED') return 'CANCELLED';
  if (
    booking.displayState === 'PENDING_MENTOR_RESPONSE' ||
    booking.displayState === 'PAYMENT_REQUIRED'
  ) {
    return 'PENDING';
  }
  return 'CONFIRMED';
}

export function useMyBookings() {
  const { isBootstrapping } = useAuth();
  const [allBookings, setAllBookings] = useState<MentorBookingResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [activeTab, setActiveTab] = useState<MenteeBookingTab>('ALL');

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
    () => allBookings.filter((booking) => activeTab === 'ALL' || tabOf(booking) === activeTab),
    [activeTab, allBookings],
  );

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
    error,
    isLoading: isLoading || isBootstrapping,
    isSaving,
    mutate,
    refresh,
    setActiveTab,
    totalCount: allBookings.length,
  };
}
