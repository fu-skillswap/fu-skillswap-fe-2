/**
 * @file useMentorArticles.ts
 * @description Bài Blog của một Mentor cho tab "Blog" ở hồ sơ Mentor.
 * `GET /api/mentors/{id}` chỉ trả các bài PUBLIC, nên hook này gộp thêm bài từ `/api/blog/posts`
 * (gọi bằng token người xem) để bài "Chỉ người đăng nhập" / "Thành viên đã đặt lịch" cũng hiện.
 */

'use client';

import type { BlogPostReaderCardResponse } from '@/models/blog';
import { useAuth } from '@/providers/AuthProvider';
import { blogRepo } from '@/repositories/blogRepo';
import { useQuery } from '@tanstack/react-query';

const PAGE_SIZE = 20;
const MAX_PAGES = 5;

// TODO(api): an author filter on GET /api/blog/posts (e.g. `mentorUserId`) would replace this scan.
async function fetchAuthorPosts(mentorUserId: string) {
  const posts: BlogPostReaderCardResponse[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const result = await blogRepo.list({ cursor, limit: PAGE_SIZE });
    posts.push(
      ...result.items.filter(
        (post) =>
          post.authorConversion?.mentorUserId === mentorUserId || post.author?.id === mentorUserId,
      ),
    );
    if (!result.hasNext || !result.nextCursor) break;
    cursor = result.nextCursor;
  }
  return posts;
}

function publishedTime(post: BlogPostReaderCardResponse) {
  const time = Date.parse(post.publishedAt ?? post.createdAt ?? '');
  return Number.isNaN(time) ? 0 : time;
}

export function useMentorArticles(
  mentorUserId: string | undefined,
  profileArticles: BlogPostReaderCardResponse[],
) {
  const { user, isBootstrapping } = useAuth();
  const query = useQuery({
    queryKey: ['mentor-articles', mentorUserId, user?.id ?? null],
    queryFn: () => fetchAuthorPosts(mentorUserId as string),
    enabled: Boolean(mentorUserId) && !isBootstrapping,
    staleTime: 60 * 1000,
  });

  // Profile previews first, then the extra posts; newest first, without duplicates.
  const byId = new Map<string, BlogPostReaderCardResponse>();
  [...profileArticles, ...(query.data ?? [])].forEach((post) => {
    byId.set(post.id, { ...byId.get(post.id), ...post });
  });
  const articles = [...byId.values()].sort((a, b) => publishedTime(b) - publishedTime(a));

  return { articles, isLoading: query.isPending && query.fetchStatus === 'fetching' };
}
