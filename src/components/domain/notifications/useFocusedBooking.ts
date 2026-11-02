/**
 * @file useFocusedBooking.ts
 * @description `?focus={bookingId}` on the two booking lists. Finds the booking in the loaded list;
 * when it is not there (older than the list window, or on the other side) it is fetched by id:
 * a booking of this side is shown on top, a booking of the other side is handed to that list,
 * anything else ends in the "no longer here" notice.
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import type { MentorBookingResponse } from '@/models/auth';
import { useAuth } from '@/providers/AuthProvider';
import { bookingRepo } from '@/repositories/bookingRepo';
import { FOCUS_PARAM } from './notificationTargets';
import { useFocusParam, useHighlightElement } from './useNotificationFocus';

type Side = 'mentee' | 'mentor';

interface UseFocusedBookingOptions {
  side: Side;
  locale: string;
  bookings: MentorBookingResponse[];
  isLoading: boolean;
  /** Called once the focused booking is known, so the page can switch to the tab holding it. */
  onLocate?: (booking: MentorBookingResponse) => void;
}

/** What the last `?focus=` resolved to; kept after the param is removed from the URL. */
interface FocusOutcome {
  id: string;
  extraBooking?: MentorBookingResponse;
  isMissing?: boolean;
}

const otherListPath = (side: Side, locale: string) =>
  side === 'mentee' ? `/${locale}/mentor/bookings` : `/${locale}/my-bookings`;

export function useFocusedBooking({
  side,
  locale,
  bookings,
  isLoading,
  onLocate,
}: UseFocusedBookingOptions) {
  const router = useRouter();
  const { user } = useAuth();
  const { focusId, clearFocus } = useFocusParam();
  const [outcome, setOutcome] = useState<FocusOutcome>();
  const onLocateRef = useRef(onLocate);
  onLocateRef.current = onLocate;

  const inList = focusId ? bookings.find((booking) => booking.bookingId === focusId) : undefined;
  const inListRef = useRef(inList);
  inListRef.current = inList;
  const inListId = inList?.bookingId;
  const userId = user?.id;
  const needsLookup = Boolean(focusId) && !isLoading && !inList;

  const lookup = useQuery({
    queryKey: ['focused-booking', focusId],
    queryFn: () => bookingRepo.detail(focusId ?? ''),
    enabled: needsLookup,
    retry: false,
  });

  useEffect(() => {
    if (!focusId || isLoading) return;
    const listed = inListRef.current;
    if (inListId && listed) {
      setOutcome({ id: focusId });
      onLocateRef.current?.(listed);
      return;
    }
    if (lookup.isError) {
      setOutcome({ id: focusId, isMissing: true });
      clearFocus();
      return;
    }
    const fetched = lookup.data;
    if (!fetched) return;
    const fetchedSide: Side | undefined =
      fetched.menteeUserId === userId
        ? 'mentee'
        : fetched.mentorUserId === userId
          ? 'mentor'
          : undefined;
    if (fetchedSide === side) {
      setOutcome({ id: focusId, extraBooking: fetched });
      onLocateRef.current?.(fetched);
    } else if (fetchedSide) {
      // The booking lives on the other list: hand it over (that list resolves it on its side).
      router.replace(
        `${otherListPath(side, locale)}?${FOCUS_PARAM}=${encodeURIComponent(focusId)}`,
        { scroll: false },
      );
    } else {
      setOutcome({ id: focusId, isMissing: true });
      clearFocus();
    }
    // Keyed on the booking id, not the list, so a background refresh doesn't switch tabs again.
  }, [
    clearFocus,
    focusId,
    inListId,
    isLoading,
    locale,
    lookup.data,
    lookup.isError,
    router,
    side,
    userId,
  ]);

  const focusedId =
    outcome && outcome.id === focusId && !outcome.isMissing ? `booking-${outcome.id}` : undefined;
  useHighlightElement(focusedId, Boolean(focusedId), clearFocus);

  return {
    /** Fetched booking that is not in the loaded list; render it at the top. */
    extraBooking: bookings.some((booking) => booking.bookingId === outcome?.extraBooking?.bookingId)
      ? undefined
      : outcome?.extraBooking,
    /** The focused booking is gone: show FocusMissingNotice. */
    isMissing: Boolean(outcome?.isMissing),
  };
}
