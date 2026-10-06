/**
 * @file mentorPostRepo.ts
 * @description Repository quản lý bài viết Blog thuộc Mentor đang đăng nhập.
 */

import { apiClient } from '@/models/apiClient';
import axios from 'axios';
import type {
  BlogCategoryResponse,
  BlogExpectedVersionRequest,
  BlogFileAssetMetadata,
  BlogTagResponse,
  BlogUploadIntent,
  BlogUploadRequest,
  MentorBlogPostCreateRequest,
  MentorBlogPostDetailResponse,
  MentorBlogPostUpdateRequest,
} from '@/models/auth';

export const mentorPostRepo = {
  categories: (): Promise<BlogCategoryResponse[]> =>
    apiClient<BlogCategoryResponse[]>('/api/blog/categories'),
  tags: (): Promise<BlogTagResponse[]> => apiClient<BlogTagResponse[]>('/api/blog/tags'),
  createUploadIntent: (data: BlogUploadRequest): Promise<BlogUploadIntent> =>
    apiClient<BlogUploadIntent>('/api/me/blog/assets/upload-intents', {
      method: 'POST',
      data,
    }),
  uploadFile: async (intent: BlogUploadIntent, file: File): Promise<void> => {
    await axios.put(intent.uploadUrl, file, {
      headers: intent.requiredHeaders ?? { 'Content-Type': file.type },
    });
  },
  confirmUpload: (intentId: string): Promise<BlogFileAssetMetadata> =>
    apiClient<BlogFileAssetMetadata>(`/api/me/blog/assets/${intentId}/confirm`, {
      method: 'POST',
    }),
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
