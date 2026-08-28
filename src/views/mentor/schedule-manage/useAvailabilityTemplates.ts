/**
 * @file useAvailabilityTemplates.ts
 * @description Hook for fetching, paginating, and managing Weekly Availability Templates.
 */

import { useState, useCallback, useEffect } from 'react';
import { mentorSchedulingRepo } from '@/repositories/mentorSchedulingRepo';
import type { AvailabilityTemplateResponse } from '@/models/auth';
import { ApiClientError } from '@/models/apiClient';

export function useAvailabilityTemplates() {
  const [templates, setTemplates] = useState<AvailabilityTemplateResponse[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async (cursor?: string) => {
    try {
      if (cursor) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const res = await mentorSchedulingRepo.listAvailabilityTemplates(cursor, 20);
      if (cursor) {
        setTemplates((prev) => [...prev, ...res.items]);
      } else {
        setTemplates(res.items);
      }
      setNextCursor(res.nextCursor ?? null);
      setHasNext(res.hasNext);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError('Không thể tải danh sách mẫu lịch lặp.');
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    void fetchTemplates();
  }, [fetchTemplates]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || isLoadingMore) return;
    await fetchTemplates(nextCursor);
  }, [nextCursor, isLoadingMore, fetchTemplates]);

  const reloadTemplates = useCallback(async () => {
    await fetchTemplates();
  }, [fetchTemplates]);

  return {
    templates,
    isLoading,
    isLoadingMore,
    error,
    hasNext,
    loadMore,
    reloadTemplates,
  };
}
