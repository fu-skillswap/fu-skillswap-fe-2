/**
 * @file useMyBookings.ts
 * @description Hook quản lý lấy danh sách Booking cá nhân của Mentee từ API GET /api/me/bookings.
 */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { UserBookingItem } from '@/models/auth';
import { mentorRepo } from '@/repositories/mentorRepo';
import { useAuth } from '@/providers/AuthProvider';

export type BookingFilterTab =
  | 'ALL'
  | 'PENDING'
  | 'ACCEPTED_AWAITING_PAYMENT'
  | 'PAID'
  | 'AWAITING_MENTOR_COMPLETION'
  | 'AWAITING_MENTEE_CONFIRMATION'
  | 'COMPLETED'
  | 'UNDER_REVIEW'
  | 'NO_SHOW'
  | 'CANCELLED_BY_MENTEE'
  | 'CANCELLED_BY_MENTOR'
  | 'REJECTED'
  | 'EXPIRED_PENDING_MENTOR'
  | 'EXPIRED_AWAITING_PAYMENT';

export const FILTER_TABS: Array<{ key: BookingFilterTab; label: string }> = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'PENDING', label: 'Đang chờ' },
  { key: 'ACCEPTED_AWAITING_PAYMENT', label: 'Chờ thanh toán' },
  { key: 'PAID', label: 'Đã thanh toán' },
  { key: 'AWAITING_MENTOR_COMPLETION', label: 'Đang diễn ra' },
  { key: 'AWAITING_MENTEE_CONFIRMATION', label: 'Chờ xác nhận' },
  { key: 'COMPLETED', label: 'Hoàn thành' },
  { key: 'UNDER_REVIEW', label: 'Đang xử lý' },
  { key: 'NO_SHOW', label: 'Vắng mặt' },
  { key: 'CANCELLED_BY_MENTEE', label: 'Người dùng đã hủy' },
  { key: 'CANCELLED_BY_MENTOR', label: 'Mentor đã hủy' },
  { key: 'REJECTED', label: 'Bị từ chối' },
  { key: 'EXPIRED_PENDING_MENTOR', label: 'Quá hạn' },
  { key: 'EXPIRED_AWAITING_PAYMENT', label: 'Quá hạn thanh toán' },
];

function matchesTab(statusStr: string | undefined, tab: BookingFilterTab): boolean {
  if (tab === 'ALL') return true;
  const status = (statusStr || 'PENDING').trim().toUpperCase();

  switch (tab) {
    case 'PENDING':
      return status === 'PENDING' || status === 'REQUESTED';
    case 'ACCEPTED_AWAITING_PAYMENT':
      return status === 'ACCEPTED_AWAITING_PAYMENT' || status === 'WAITING_PAYMENT';
    case 'PAID':
      return status === 'PAID' || status === 'CONFIRMED' || status === 'ACCEPTED';
    case 'AWAITING_MENTOR_COMPLETION':
      return status === 'AWAITING_MENTOR_COMPLETION' || status === 'IN_PROGRESS';
    case 'AWAITING_MENTEE_CONFIRMATION':
      return status === 'AWAITING_MENTEE_CONFIRMATION';
    case 'COMPLETED':
      return status === 'COMPLETED' || status === 'AUTO_CLOSED';
    case 'UNDER_REVIEW':
      return status === 'UNDER_REVIEW';
    case 'NO_SHOW':
      return status === 'NO_SHOW';
    case 'CANCELLED_BY_MENTEE':
      return status === 'CANCELLED_BY_MENTEE' || status === 'CANCELED_BY_MENTEE' || status === 'CANCELLED';
    case 'CANCELLED_BY_MENTOR':
      return status === 'CANCELLED_BY_MENTOR' || status === 'CANCELED_BY_MENTOR';
    case 'REJECTED':
      return status === 'REJECTED' || status === 'REJECTED_BY_MENTOR';
    case 'EXPIRED_PENDING_MENTOR':
      return status === 'EXPIRED_PENDING_MENTOR' || status === 'REQUEST_EXPIRED';
    case 'EXPIRED_AWAITING_PAYMENT':
      return status === 'EXPIRED_AWAITING_PAYMENT' || status === 'PAYMENT_EXPIRED';
    default:
      return status === tab;
  }
}

export function useMyBookings() {
  const { isBootstrapping } = useAuth();
  const [bookings, setBookings] = useState<UserBookingItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>();
  const [activeTab, setActiveTab] = useState<BookingFilterTab>('ALL');

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    setError(undefined);
    try {
      const data = await mentorRepo.getMyBookings();
      setBookings(data);
    } catch {
      setError('Không thể tải danh sách đặt lịch. Vui lòng thử lại sau.');
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isBootstrapping) {
      void fetchBookings();
    }
  }, [isBootstrapping, fetchBookings]);

  const counts = useMemo(() => {
    const map: Record<BookingFilterTab, number> = {
      ALL: bookings.length,
      PENDING: 0,
      ACCEPTED_AWAITING_PAYMENT: 0,
      PAID: 0,
      AWAITING_MENTOR_COMPLETION: 0,
      AWAITING_MENTEE_CONFIRMATION: 0,
      COMPLETED: 0,
      UNDER_REVIEW: 0,
      NO_SHOW: 0,
      CANCELLED_BY_MENTEE: 0,
      CANCELLED_BY_MENTOR: 0,
      REJECTED: 0,
      EXPIRED_PENDING_MENTOR: 0,
      EXPIRED_AWAITING_PAYMENT: 0,
    };

    FILTER_TABS.forEach((tab) => {
      if (tab.key === 'ALL') return;
      map[tab.key] = bookings.filter((b) => matchesTab(b.bookingStatus || b.status, tab.key)).length;
    });

    return map;
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => matchesTab(b.bookingStatus || b.status, activeTab));
  }, [bookings, activeTab]);

  return {
    bookings: filteredBookings,
    rawBookings: bookings,
    totalCount: bookings.length,
    counts,
    isLoading: isLoading || isBootstrapping,
    error,
    activeTab,
    setActiveTab,
    refresh: fetchBookings,
  };
}
