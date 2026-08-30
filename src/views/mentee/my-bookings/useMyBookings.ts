/**
 * @file useMyBookings.ts
 * @description Hook quản lý lấy danh sách Booking cá nhân của Mentee từ API GET /api/me/bookings.
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import type { UserBookingItem } from '@/models/auth';
import { mentorRepo } from '@/repositories/mentorRepo';
import { useAuth } from '@/providers/AuthProvider';

export function useMyBookings() {
  const { isBootstrapping } = useAuth();
  const [bookings, setBookings] = useState<UserBookingItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>();
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'CONFIRMED' | 'CANCELLED'>('ALL');

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
    // Chỉ gọi API sau khi quá trình làm mới token và tải người dùng ban đầu hoàn tất
    if (!isBootstrapping) {
      void fetchBookings();
    }
  }, [isBootstrapping, fetchBookings]);

  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 'ALL') return true;
    const status = (b.status || 'PENDING').toUpperCase();
    if (activeTab === 'PENDING') return status === 'PENDING';
    if (activeTab === 'CONFIRMED') return status === 'CONFIRMED' || status === 'ACCEPTED';
    if (activeTab === 'CANCELLED') return status === 'CANCELLED' || status === 'REJECTED';
    return true;
  });

  return {
    bookings: filteredBookings,
    totalCount: bookings.length,
    isLoading: isLoading || isBootstrapping,
    error,
    activeTab,
    setActiveTab,
    refresh: fetchBookings,
  };
}
