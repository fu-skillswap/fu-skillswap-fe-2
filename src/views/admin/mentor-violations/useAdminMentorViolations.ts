/**
 * @file useAdminMentorViolations.ts
 * @description Loads a mentor's penalty score and violation history for admins, and records or
 * reverses violations.
 */

'use client';

import type { AdminMentorViolationRequest } from '@/models/admin';
import type { MentorViolationHistoryResponse } from '@/models/auth';
import { adminRepo } from '@/repositories/adminRepo';
import { getUserFriendlyErrorMessage, showError, showSuccess } from '@/utils/toast';
import { useCallback, useEffect, useState } from 'react';

export const VIOLATION_PAGE_SIZE = 10;

export function useAdminMentorViolations(mentorUserId: string, onChanged?: () => void) {
  const [data, setData] = useState<MentorViolationHistoryResponse>();
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = useCallback(
    async (targetPage: number) => {
      setIsLoading(true);
      setError(undefined);
      try {
        setData(await adminRepo.getMentorViolations(mentorUserId, targetPage, VIOLATION_PAGE_SIZE));
        setPage(targetPage);
      } catch (reason) {
        setError(getUserFriendlyErrorMessage(reason, 'Không thể tải lịch sử vi phạm của mentor.'));
      } finally {
        setIsLoading(false);
      }
    },
    [mentorUserId],
  );

  useEffect(() => {
    void load(0);
  }, [load]);

  /** Resolves to true when the BE accepted the change, so the caller can close its dialog. */
  const submit = async (action: () => Promise<unknown>, successMessage: string, title: string) => {
    setIsSubmitting(true);
    try {
      await action();
      showSuccess(successMessage);
      await load(0);
      onChanged?.();
      return true;
    } catch (reason) {
      showError(reason, { title });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const record = (request: AdminMentorViolationRequest) =>
    submit(
      () => adminRepo.recordMentorViolation(mentorUserId, request),
      'Đã ghi nhận vi phạm của mentor.',
      'Không thể ghi nhận vi phạm',
    );

  const reverse = (violationId: string, reason: string) =>
    submit(
      () => adminRepo.reverseMentorViolation(mentorUserId, violationId, reason),
      'Đã đảo vi phạm. Điểm phạt của mentor đã được tính lại.',
      'Không thể đảo vi phạm',
    );

  return {
    data,
    page,
    isLoading,
    error,
    isSubmitting,
    goToPage: (targetPage: number) => void load(targetPage),
    reload: () => void load(page),
    record,
    reverse,
  };
}
