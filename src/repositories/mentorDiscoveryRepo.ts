/**
 * @file mentorDiscoveryRepo.ts
 * @description Repository đọc hồ sơ mentor công khai và các service có thể đặt lịch.
 */

import { apiClient } from '@/models/apiClient';
import type {
  BlogFollowResponse,
  MentorDiscoveryDetailResponse,
  MentorReviewPageResponse,
} from '@/models/auth';

/** Thao tác discovery công khai phục vụ mentee xem và chọn service. */
export const mentorDiscoveryRepo = {
  getDetail: (mentorUserId: string): Promise<MentorDiscoveryDetailResponse> =>
    apiClient<MentorDiscoveryDetailResponse>(`/api/mentors/${mentorUserId}`),
  getReviews: (mentorUserId: string): Promise<MentorReviewPageResponse> =>
    apiClient<MentorReviewPageResponse>(
      `/api/mentors/${mentorUserId}/reviews?page=0&size=6&sortBy=createdAt&direction=DESC`,
    ),
  getFollowing: (): Promise<BlogFollowResponse> =>
    apiClient<BlogFollowResponse>('/api/me/blog/follows'),
  follow: (mentorUserId: string): Promise<BlogFollowResponse> =>
    apiClient<BlogFollowResponse>(`/api/blog/mentors/${mentorUserId}/follow`, { method: 'PUT' }),
  unfollow: (mentorUserId: string): Promise<BlogFollowResponse> =>
    apiClient<BlogFollowResponse>(`/api/blog/mentors/${mentorUserId}/follow`, {
      method: 'DELETE',
    }),
};
