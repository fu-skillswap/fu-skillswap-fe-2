/**
 * @file mentorDiscoveryRepo.ts
 * @description Repository đọc hồ sơ mentor công khai và các service có thể đặt lịch.
 */

import { apiClient } from '@/models/apiClient';
import type { MentorDiscoveryDetailResponse } from '@/models/auth';

/** Thao tác discovery công khai phục vụ mentee xem và chọn service. */
export const mentorDiscoveryRepo = {
  getDetail: (mentorUserId: string): Promise<MentorDiscoveryDetailResponse> =>
    apiClient<MentorDiscoveryDetailResponse>(`/api/mentors/${mentorUserId}`),
};
