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
export interface MentorReviewsQuery {
  page?: number;
  size?: number;
  /** By review date. */
  direction?: 'ASC' | 'DESC';
}

export const mentorDiscoveryRepo = {
  getDetail: (mentorUserId: string): Promise<MentorDiscoveryDetailResponse> =>
    apiClient<MentorDiscoveryDetailResponse>(`/api/mentors/${mentorUserId}`),
  /**
   * Public reviews of a mentor, newest first by default. Needs a signed-in user despite being
   * documented as public (401 for guests).
   */
  getReviews: (
    mentorUserId: string,
    { page = 0, size = 6, direction = 'DESC' }: MentorReviewsQuery = {},
  ): Promise<MentorReviewPageResponse> =>
    apiClient<MentorReviewPageResponse>(
      `/api/mentors/${mentorUserId}/reviews?page=${page}&size=${size}&sortBy=createdAt&direction=${direction}`,
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
