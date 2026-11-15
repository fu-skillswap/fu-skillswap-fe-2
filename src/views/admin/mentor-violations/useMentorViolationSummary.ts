/**
 * @file useMentorViolationSummary.ts
 * @description Penalty score, violation count and booking suspension of one mentor, read from the
 * first row of GET /api/admin/mentors/{mentorUserId}/violations (page=0, size=1).
 */

'use client';

import { adminRepo } from '@/repositories/adminRepo';
import { useQuery } from '@tanstack/react-query';
import { ADMIN_VIOLATIONS_STALE_TIME, mentorViolationsQueryKey } from './mentorViolations.helpers';

export interface MentorViolationSummary {
  activePenaltyScore: number;
  lifetimePenaltyScore: number;
  totalViolations: number;
  bookingSuspendedUntil: string | null;
  activeWindowStartAt: string | null;
  /** True when the newest violation has not been reversed, so there is something left to reverse. */
  hasUnreversedLatest: boolean;
}

export function useMentorViolationSummary(mentorUserId: string, enabled = true) {
  const query = useQuery({
    queryKey: [...mentorViolationsQueryKey(mentorUserId), 'summary'],
    queryFn: async (): Promise<MentorViolationSummary> => {
      const response = await adminRepo.getMentorViolations(mentorUserId, 0, 1);
      const latest = response.history?.content?.[0];
      return {
        activePenaltyScore: response.activePenaltyScore ?? 0,
        lifetimePenaltyScore: response.lifetimePenaltyScore ?? 0,
        totalViolations: response.totalViolations ?? 0,
        bookingSuspendedUntil: response.bookingSuspendedUntil ?? null,
        activeWindowStartAt: response.activeWindowStartAt ?? null,
        hasUnreversedLatest: Boolean(latest && !latest.reversedAt),
      };
    },
    enabled: enabled && Boolean(mentorUserId),
    retry: false,
    staleTime: ADMIN_VIOLATIONS_STALE_TIME,
  });

  return { summary: query.data, isLoading: query.isLoading, isError: query.isError };
}
