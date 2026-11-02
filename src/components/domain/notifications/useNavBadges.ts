/**
 * @file useNavBadges.ts
 * @description Red marks for the sidebars, header and in-page tabs.
 * - count = things that still need the user. Bookings use the real lists (the same rule as the
 *   pages' "Cần bạn xử lý" / "Cần phản hồi"), so the count drops only once the action is done.
 *   Sections without such an API fall back to unread action notifications.
 * - dot = at least one unread info notification for the section.
 * A section shows the count when it is above 0, else the dot, never both.
 */

'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useRef } from 'react';
import { bookingRepo } from '@/repositories/bookingRepo';
import { mentorBookingRepo } from '@/repositories/mentorBookingRepo';
import {
  getBookingTabGroup,
  isActionableExpiry,
} from '@/views/mentee/my-bookings/bookingStatusConfig';
import { useDismissedExpiries } from '@/views/mentee/my-bookings/useDismissedExpiries';
import { inboxGroupOf } from '@/views/mentor/bookings/mentorInbox';
import { sectionOfPath, type NavSection } from './notificationTargets';
import { notificationKeys, POLL_OPTIONS, useNotificationCenter } from './useNotificationCenter';

export interface SectionBadge {
  /** Items that still need the user; shown as a pill. */
  count: number;
  /** Unseen news; shown as a dot only when count is 0. */
  dot: boolean;
}

const NO_BADGE: SectionBadge = { count: 0, dot: false };

/** Sections whose count comes from a real list rather than from notifications. */
const COUNTED_SECTIONS: ReadonlySet<NavSection> = new Set(['booking', 'mentorBookings']);

export function useNavBadges() {
  const center = useNotificationCenter();
  const { enabled, isMentor, entries } = center;
  const { dismissedIds, now } = useDismissedExpiries();

  const menteeBookings = useQuery({
    queryKey: ['nav-badges', 'mentee-bookings'],
    queryFn: async () => (await bookingRepo.listForMentee()).content ?? [],
    enabled: enabled && !isMentor,
    ...POLL_OPTIONS,
  });

  const mentorBookings = useQuery({
    queryKey: ['nav-badges', 'mentor-bookings'],
    queryFn: async () => (await mentorBookingRepo.list()).content ?? [],
    enabled: enabled && isMentor,
    ...POLL_OPTIONS,
  });

  const badges = useMemo(() => {
    const result = new Map<NavSection, SectionBadge>();
    const add = (section: NavSection, patch: Partial<SectionBadge>) => {
      const current = result.get(section) ?? NO_BADGE;
      result.set(section, {
        count: current.count + (patch.count ?? 0),
        dot: current.dot || Boolean(patch.dot),
      });
    };

    // Failed requests leave the section without a badge.
    if (menteeBookings.data) {
      const needsAction = menteeBookings.data.filter(
        (booking) =>
          getBookingTabGroup(booking, isActionableExpiry(booking, dismissedIds, now)) ===
          'NEEDS_ACTION',
      ).length;
      add('booking', { count: needsAction });
    }
    if (mentorBookings.data) {
      add('mentorBookings', {
        count: mentorBookings.data.filter((booking) => inboxGroupOf(booking) === 'PENDING').length,
      });
    }

    entries.forEach(({ notification, target }) => {
      if (notification.read) return;
      if (target.kind === 'info') add(target.section, { dot: true });
      else if (!COUNTED_SECTIONS.has(target.section)) add(target.section, { count: 1 });
    });

    if (center.hasUnreadMessages) add('messages', { dot: true });
    return result;
  }, [
    center.hasUnreadMessages,
    dismissedIds,
    entries,
    menteeBookings.data,
    mentorBookings.data,
    now,
  ]);

  return {
    ...center,
    badgeFor: (section: NavSection): SectionBadge => {
      const badge = badges.get(section) ?? NO_BADGE;
      return badge.count > 0 ? { count: badge.count, dot: false } : badge;
    },
  };
}

/**
 * Opening a section marks its unread info notifications read (action ones stay until done).
 * The ids are kept under `notificationKeys.seen(section)` so the page can still point at what was
 * new (e.g. a dot on the "Sắp tới" tab) after the nav dot clears.
 */
export function useMarkSectionSeen() {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { entries, markRead } = useNotificationCenter();
  const section = sectionOfPath(pathname);
  const markReadRef = useRef(markRead);
  markReadRef.current = markRead;

  useEffect(() => {
    if (!section) return;
    const unseen = entries.filter(
      ({ notification, target }) =>
        !notification.read && target.kind === 'info' && target.section === section,
    );
    if (!unseen.length) return;
    queryClient.setQueryData<string[]>(notificationKeys.seen(section), (previous = []) => [
      ...new Set([
        ...previous,
        ...unseen.map(({ notification }) => notification.relatedEntityId ?? '').filter(Boolean),
      ]),
    ]);
    markReadRef.current(unseen.map(({ notification }) => notification.notificationId));
  }, [entries, queryClient, section]);
}

/** Entity ids (e.g. booking ids) whose news was new when this section was opened. */
export function useSectionSeenIds(section: NavSection) {
  const { data } = useQuery({
    queryKey: notificationKeys.seen(section),
    queryFn: () => [] as string[],
    enabled: false,
    initialData: [] as string[],
  });
  return useMemo(() => new Set(data), [data]);
}
