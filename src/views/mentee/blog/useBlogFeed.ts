/**
 * @file useBlogFeed.ts
 * @description Danh sách bài Blog đã xuất bản (cuộn tải thêm theo cursor) và chuyên mục để lọc.
 */

'use client';

import { useAuth } from '@/providers/AuthProvider';
import { blogRepo } from '@/repositories/blogRepo';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

const PAGE_SIZE = 12;

export function useBlogFeed({ categoryId, keyword }: { categoryId?: string; keyword?: string }) {
  const { user, isBootstrapping } = useAuth();

  const categories = useQuery({
    queryKey: ['blog-categories'],
    queryFn: blogRepo.categories,
    staleTime: 30 * 60 * 1000,
  });

  const posts = useInfiniteQuery({
    // The user id is part of the key: logged-in readers also see AUTHENTICATED posts.
    queryKey: ['blog-posts', user?.id ?? null, categoryId ?? null, keyword ?? ''],
    queryFn: ({ pageParam }) =>
      blogRepo.list({ cursor: pageParam, limit: PAGE_SIZE, categoryId, keyword }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) => (page.hasNext && page.nextCursor ? page.nextCursor : undefined),
    // Wait for the session restore so the first request already carries the token.
    enabled: !isBootstrapping,
    staleTime: 60 * 1000,
  });

  return {
    categories: categories.data ?? [],
    items: posts.data?.pages.flatMap((page) => page.items) ?? [],
    isLoading: posts.isPending,
    isError: posts.isError,
    refetch: posts.refetch,
    hasNextPage: posts.hasNextPage,
    fetchNextPage: posts.fetchNextPage,
    isFetchingNextPage: posts.isFetchingNextPage,
  };
}
