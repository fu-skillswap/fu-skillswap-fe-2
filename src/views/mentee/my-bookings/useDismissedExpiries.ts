/**
 * @file useDismissedExpiries.ts
 * @description Tracks expired requests the mentee chose to "Bỏ qua", plus a minute clock so an
 * expired booking leaves "Cần bạn xử lý" once its session start passes.
 */

'use client';

import { useCallback, useEffect, useState } from 'react';

// TODO(api): persist dismissals server-side (e.g. POST /api/me/bookings/{id}/dismiss) so they
// follow the mentee across devices; localStorage is a per-browser stopgap.
const STORAGE_KEY = 'skillswap.mentee.dismissedExpiredBookings';
const TICK_MS = 60_000;

function readStoredIds(): string[] {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export function useDismissedExpiries() {
  const [dismissedIds, setDismissedIds] = useState<ReadonlySet<string>>(() => new Set());
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    setDismissedIds(new Set(readStoredIds()));
    const timer = window.setInterval(() => setNow(Date.now()), TICK_MS);
    return () => window.clearInterval(timer);
  }, []);

  const dismiss = useCallback((bookingId: string) => {
    setDismissedIds((current) => {
      const next = new Set(current).add(bookingId);
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      } catch {
        // Storage can be unavailable (private mode); the dismissal still applies for this visit.
      }
      return next;
    });
  }, []);

  return { dismissedIds, dismiss, now };
}
