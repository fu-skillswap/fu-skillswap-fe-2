/**
 * @file useMentorReviews.ts
 * @description Paged mentee reviews of a mentor (`GET /api/mentors/{mentorUserId}/reviews`).
 * The endpoint rejects guests, so it only runs for signed-in users.
 */

'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { mentorDiscoveryRepo } from '@/repositories/mentorDiscoveryRepo';

export const MENTOR_REVIEWS_PAGE_SIZE = 6;

export type MentorReviewSort = 'new' | 'old';

/** Prefix shared by every review list of a mentor; invalidate it after a new review. */
export const mentorReviewsQueryKey = (mentorUserId: string) => ['mentor-reviews', mentorUserId];

export function useMentorReviews(mentorUserId: string | undefined, sort: MentorReviewSort) {
  const { isAuthenticated, isBootstrapping } = useAuth();
  const enabled = Boolean(mentorUserId) && isAuthenticated && !isBootstrapping;

  const query = useInfiniteQuery({
    queryKey: [...mentorReviewsQueryKey(mentorUserId ?? ''), sort],
    queryFn: ({ pageParam }) =>
      mentorDiscoveryRepo.getReviews(mentorUserId ?? '', {
        page: pageParam,
        size: MENTOR_REVIEWS_PAGE_SIZE,
        direction: sort === 'new' ? 'DESC' : 'ASC',
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.last ? undefined : lastPage.page + 1),
    enabled,
    staleTime: 60 * 1000,
  });

  const pages = query.data?.pages ?? [];
  return {
    reviews: pages.flatMap((page) => page.content ?? []),
    total: pages[0]?.totalElements,
    /** Every review is loaded, so counts per star are exact. */
    isComplete: pages.length > 0 && !query.hasNextPage,
    needsLogin: !isBootstrapping && !isAuthenticated,
    isLoading: isBootstrapping || (enabled && query.isPending),
    isError: query.isError,
    hasMore: Boolean(query.hasNextPage),
    isLoadingMore: query.isFetchingNextPage,
    loadMore: () => void query.fetchNextPage(),
    retry: () => void query.refetch(),
  };
}
