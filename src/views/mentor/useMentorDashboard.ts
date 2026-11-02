/**
 * @file useMentorDashboard.ts
 * @description Tải và tổng hợp dữ liệu cho Bảng điều khiển Mentor (hồ sơ, booking, ví, đánh giá).
 */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  MentorBookingResponse,
  MentorProfileResponse,
  MentorReviewResponse,
  MentorWalletResponse,
  WalletTransactionResponse,
} from '@/models/auth';
import { useAuth } from '@/providers/AuthProvider';
import { mentorBookingRepo } from '@/repositories/mentorBookingRepo';
import { mentorDiscoveryRepo } from '@/repositories/mentorDiscoveryRepo';
import { mentorProfileRepo } from '@/repositories/mentorProfileRepo';
import { walletRepo } from '@/repositories/walletRepo';
import { bookingFilterOf } from '@/views/mentor/bookings/useMentorBookings';

export interface DailyIncome {
  dateKey: string;
  label: string;
  amount: number;
}

const UPCOMING_LIMIT = 4;
const REVIEW_LIMIT = 3;
// Entries that move coins into the mentor wallet without being new earnings.
const NON_EARNING_ENTRY_TYPES = new Set(['RELEASE', 'REFUND', 'VOID']);

function localDateKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function isEarning(transaction: WalletTransactionResponse) {
  return transaction.balanceEffectScoin > 0 && !NON_EARNING_ENTRY_TYPES.has(transaction.entryType);
}

export function useMentorDashboard() {
  const { isBootstrapping } = useAuth();
  const [profile, setProfile] = useState<MentorProfileResponse>();
  const [bookings, setBookings] = useState<MentorBookingResponse[]>([]);
  const [wallet, setWallet] = useState<MentorWalletResponse>();
  const [reviews, setReviews] = useState<MentorReviewResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [failedSections, setFailedSections] = useState<string[]>([]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    const [profileResult, bookingResult, walletResult] = await Promise.allSettled([
      mentorProfileRepo.get(true),
      mentorBookingRepo.list(),
      walletRepo.getMentorWallet(),
    ]);
    const failed: string[] = [];

    if (profileResult.status === 'fulfilled') setProfile(profileResult.value);
    else failed.push('hồ sơ');
    if (bookingResult.status === 'fulfilled') setBookings(bookingResult.value.content ?? []);
    else failed.push('lịch đặt');
    if (walletResult.status === 'fulfilled') setWallet(walletResult.value);
    else failed.push('ví S-coin');

    const mentorUserId = profileResult.status === 'fulfilled' ? profileResult.value.userId : '';
    if (mentorUserId) {
      try {
        const page = await mentorDiscoveryRepo.getReviews(mentorUserId);
        setReviews((page.content ?? []).slice(0, REVIEW_LIMIT));
      } catch {
        failed.push('đánh giá');
      }
    }

    setFailedSections(failed);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isBootstrapping) void refresh();
  }, [isBootstrapping, refresh]);

  const stats = useMemo(() => {
    const now = Date.now();
    const upcoming = bookings
      .filter(
        (booking) =>
          bookingFilterOf(booking) === 'IN_PROGRESS' &&
          new Date(booking.selectedEndTime).getTime() > now,
      )
      .sort(
        (left, right) =>
          new Date(left.selectedStartTime).getTime() - new Date(right.selectedStartTime).getTime(),
      );
    const pendingRequests = bookings.filter((booking) => booking.canAccept);
    const menteeIds = new Set(
      bookings
        .filter((booking) => ['IN_PROGRESS', 'COMPLETED'].includes(bookingFilterOf(booking)))
        .map((booking) => booking.menteeUserId),
    );
    const completedSessions =
      profile?.completedSessions ??
      bookings.filter((booking) => bookingFilterOf(booking) === 'COMPLETED').length;

    return {
      upcoming: upcoming.slice(0, UPCOMING_LIMIT),
      upcomingCount: upcoming.length,
      pendingRequestCount: pendingRequests.length,
      menteeCount: menteeIds.size,
      completedSessions,
    };
  }, [bookings, profile?.completedSessions]);

  // TODO(api): GET /api/me/mentor-wallet/earnings-summary — income is derived from
  // `recentTransactions`, which may not cover the whole month.
  const income = useMemo(() => {
    const today = new Date();
    const days: DailyIncome[] = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));
      return {
        dateKey: localDateKey(date),
        label: new Intl.DateTimeFormat('vi-VN', { weekday: 'short' }).format(date),
        amount: 0,
      };
    });
    const dayByKey = new Map(days.map((day) => [day.dateKey, day]));
    let monthTotal = 0;

    (wallet?.recentTransactions ?? []).filter(isEarning).forEach((transaction) => {
      const date = new Date(transaction.createdAt);
      if (Number.isNaN(date.getTime())) return;
      if (date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth()) {
        monthTotal += transaction.balanceEffectScoin;
      }
      const day = dayByKey.get(localDateKey(date));
      if (day) day.amount += transaction.balanceEffectScoin;
    });

    return { monthTotal, days, weekTotal: days.reduce((sum, day) => sum + day.amount, 0) };
  }, [wallet]);

  return {
    profile,
    wallet,
    reviews,
    stats,
    income,
    failedSections,
    isLoading: isLoading || isBootstrapping,
    refresh,
  };
}
