/**
 * @file useAdminMentorViolations.ts
 * @description Loads a mentor's penalty score and one page of the violation history for admins,
 * and records a verified violation. Reversing lives in `ReverseViolationDialog`.
 */

'use client';

import type { AdminMentorViolationRequest } from '@/models/admin';
import { adminRepo } from '@/repositories/adminRepo';
import { getUserFriendlyErrorMessage, showError, showSuccess } from '@/utils/toast';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  ADMIN_MENTORS_QUERY_KEY,
  ADMIN_VIOLATIONS_STALE_TIME,
  mentorViolationsQueryKey,
} from './mentorViolations.helpers';

export const VIOLATION_PAGE_SIZE = 10;

export function useAdminMentorViolations(
  mentorUserId: string,
  { pageSize = VIOLATION_PAGE_SIZE, onChanged }: { pageSize?: number; onChanged?: () => void } = {},
) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const query = useQuery({
    queryKey: [...mentorViolationsQueryKey(mentorUserId), 'history', page, pageSize],
    queryFn: () => adminRepo.getMentorViolations(mentorUserId, page, pageSize),
    enabled: Boolean(mentorUserId),
    retry: false,
    staleTime: ADMIN_VIOLATIONS_STALE_TIME,
    placeholderData: keepPreviousData,
  });

  /** Resolves to true when the BE accepted the violation, so the caller can close its dialog. */
  const record = async (request: AdminMentorViolationRequest) => {
    setIsSubmitting(true);
    try {
      await adminRepo.recordMentorViolation(mentorUserId, request);
      showSuccess('Đã ghi nhận vi phạm của mentor.');
      setPage(0);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: mentorViolationsQueryKey(mentorUserId) }),
        queryClient.invalidateQueries({ queryKey: ADMIN_MENTORS_QUERY_KEY }),
      ]);
      onChanged?.();
      return true;
    } catch (reason) {
      showError(reason, { title: 'Không thể ghi nhận vi phạm' });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    data: query.data,
    page,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.isError
      ? getUserFriendlyErrorMessage(query.error, 'Không thể tải lịch sử vi phạm của mentor.')
      : undefined,
    isSubmitting,
    goToPage: setPage,
    reload: () => void query.refetch(),
    record,
  };
}
