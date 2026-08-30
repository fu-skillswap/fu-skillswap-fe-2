/**
 * @file mentorPostRepo.ts
 * @description Repository quản lý bài viết Blog thuộc Mentor đang đăng nhập.
 */

import { apiClient } from '@/models/apiClient';
import type {
  BlogExpectedVersionRequest,
  MentorBlogPostCreateRequest,
  MentorBlogPostDetailResponse,
  MentorBlogPostUpdateRequest,
} from '@/models/auth';

export const mentorPostRepo = {
  list: (): Promise<MentorBlogPostDetailResponse[]> =>
    apiClient<MentorBlogPostDetailResponse[]>('/api/me/blog/posts'),
  detail: (postId: string): Promise<MentorBlogPostDetailResponse> =>
    apiClient<MentorBlogPostDetailResponse>(`/api/me/blog/posts/${postId}`),
  create: (data: MentorBlogPostCreateRequest): Promise<MentorBlogPostDetailResponse> =>
    apiClient<MentorBlogPostDetailResponse>('/api/me/blog/posts', { method: 'POST', data }),
  update: (
    postId: string,
    data: MentorBlogPostUpdateRequest,
  ): Promise<MentorBlogPostDetailResponse> =>
    apiClient<MentorBlogPostDetailResponse>(`/api/me/blog/posts/${postId}`, {
      method: 'PUT',
      data,
    }),
  publish: (
    postId: string,
    data: BlogExpectedVersionRequest,
  ): Promise<MentorBlogPostDetailResponse> =>
    apiClient<MentorBlogPostDetailResponse>(`/api/me/blog/posts/${postId}/publish`, {
      method: 'POST',
      data,
    }),
  archive: (
    postId: string,
    data: BlogExpectedVersionRequest,
  ): Promise<MentorBlogPostDetailResponse> =>
    apiClient<MentorBlogPostDetailResponse>(`/api/me/blog/posts/${postId}/archive`, {
      method: 'POST',
      data,
    }),
};
