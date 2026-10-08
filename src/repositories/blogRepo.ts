/**
 * @file blogRepo.ts
 * @description Repository Blog phía người đọc: danh sách bài đã xuất bản, chi tiết, bài liên quan,
 * thích / lưu bài và ghi nhận lượt xem.
 */

import { apiClient } from '@/models/apiClient';
import type { BlogCategoryResponse } from '@/models/auth';
import type {
  BlogCursorPage,
  BlogEngagementMutationResponse,
  BlogPostListParams,
  BlogPostReaderCardResponse,
  BlogPostReaderDetailResponse,
} from '@/models/blog';

function toQuery(params: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') query.set(key, String(value));
  });
  const text = query.toString();
  return text ? `?${text}` : '';
}

const postPath = (postId: string) => `/api/blog/posts/${encodeURIComponent(postId)}`;

export const blogRepo = {
  list: (params: BlogPostListParams = {}): Promise<BlogCursorPage<BlogPostReaderCardResponse>> =>
    apiClient<BlogCursorPage<BlogPostReaderCardResponse>>(
      `/api/blog/posts${toQuery({ ...params })}`,
    ),
  detail: (slug: string): Promise<BlogPostReaderDetailResponse> =>
    apiClient<BlogPostReaderDetailResponse>(`/api/blog/posts/${encodeURIComponent(slug)}`),
  related: (slug: string, limit = 3): Promise<BlogPostReaderCardResponse[]> =>
    apiClient<BlogPostReaderCardResponse[]>(
      `/api/blog/posts/${encodeURIComponent(slug)}/related${toQuery({ limit })}`,
    ),
  categories: (): Promise<BlogCategoryResponse[]> =>
    apiClient<BlogCategoryResponse[]>('/api/blog/categories'),
  like: (postId: string) =>
    apiClient<BlogEngagementMutationResponse>(`${postPath(postId)}/like`, { method: 'PUT' }),
  unlike: (postId: string) =>
    apiClient<BlogEngagementMutationResponse>(`${postPath(postId)}/like`, { method: 'DELETE' }),
  bookmark: (postId: string) =>
    apiClient<BlogEngagementMutationResponse>(`${postPath(postId)}/bookmark`, { method: 'PUT' }),
  unbookmark: (postId: string) =>
    apiClient<BlogEngagementMutationResponse>(`${postPath(postId)}/bookmark`, {
      method: 'DELETE',
    }),
  /** Deduplicated by the backend per `sessionId`. */
  recordView: (postId: string, sessionId: string) =>
    apiClient<void>(`${postPath(postId)}/view`, { method: 'POST', data: { sessionId } }),
  recordAuthorCtaClick: (postId: string, sessionId: string, ctaType: string) =>
    apiClient<void>(`${postPath(postId)}/author-cta-click`, {
      method: 'POST',
      data: { sessionId, ctaType },
    }),
};
