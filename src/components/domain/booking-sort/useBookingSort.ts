/**
 * @file useBookingSort.ts
 * @description Shared session-time ordering for the mentee "Booking của tôi" and mentor "Lịch đặt"
 * lists, persisted in the URL as `?sort=new|old`.
 *
 * TODO(api): server-side sort. GET /api/me/bookings takes sortBy/direction, but only `createdAt`
 * is documented; once `sortBy=selectedStartTime` is confirmed, sort there instead. Until then the
 * lists sort the page they already loaded, after fetching.
 */

'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import type { MentorBookingResponse } from '@/models/auth';

/** `new` = latest session start first, `old` = earliest session start first. */
export type BookingSortMode = 'new' | 'old';

const SORT_PARAM = 'sort';

/** Older links used the previous select values; `null` means "use the tab's default". */
const LEGACY_SORT_VALUES: Record<string, BookingSortMode | null> = {
  recent: 'new',
  upcoming: null,
};

function parseSort(value: string | null): BookingSortMode | null {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return null;
  if (normalized === 'new' || normalized === 'old') return normalized;
  return LEGACY_SORT_VALUES[normalized] ?? null;
}

const timeOf = (value?: string | null) => {
  const time = value ? new Date(value).getTime() : NaN;
  return Number.isNaN(time) ? 0 : time;
};

/** Session start time, then createdAt, then id, all in the same direction so ties are stable. */
export function compareBookings(mode: BookingSortMode) {
  const sign = mode === 'new' ? -1 : 1;
  return (left: MentorBookingResponse, right: MentorBookingResponse) =>
    sign *
    (timeOf(left.selectedStartTime) - timeOf(right.selectedStartTime) ||
      timeOf(left.createdAt) - timeOf(right.createdAt) ||
      left.bookingId.localeCompare(right.bookingId));
}

export function sortBookings(bookings: MentorBookingResponse[], mode: BookingSortMode) {
  return [...bookings].sort(compareBookings(mode));
}

/** Sort select options; "Sắp tới" calls the earliest-first order "Gần nhất trước". */
export function bookingSortCopy(isUpcomingTab: boolean) {
  return {
    options: [
      { value: 'new' as const, label: 'Mới nhất trước' },
      { value: 'old' as const, label: isUpcomingTab ? 'Gần nhất trước' : 'Cũ nhất trước' },
    ],
  };
}

/**
 * Effective sort for the current tab: the user's pick (from the URL or the select, on this visit)
 * wins; otherwise the tab default (soonest first on "Sắp tới", newest first elsewhere).
 */
export function useBookingSort(tabDefault: BookingSortMode) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [picked, setPicked] = useState<BookingSortMode | null>(() =>
    parseSort(searchParams.get(SORT_PARAM)),
  );

  const setSort = useCallback(
    (mode: BookingSortMode) => {
      setPicked(mode);
      const params = new URLSearchParams(searchParams.toString());
      params.set(SORT_PARAM, mode);
      // Keep the `#booking-…` anchor that notification links rely on.
      router.replace(`${pathname}?${params.toString()}${window.location.hash}`, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const sort = picked ?? tabDefault;
  return useMemo(() => ({ sort, setSort }), [setSort, sort]);
}
