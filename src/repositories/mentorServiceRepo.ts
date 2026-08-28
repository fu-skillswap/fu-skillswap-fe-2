/**
 * @file mentorServiceRepo.ts
 * @description Repository quản lý dịch vụ mentoring của mentor hiện tại.
 */

import { apiClient } from '@/models/apiClient';
import type {
  CreateMentorServiceRequest,
  MentorServiceActiveRequest,
  MentorServiceConstraintsResponse,
  MentorServiceManagementResponse,
  UpdateMentorServiceRequest,
} from '@/models/auth';

/** Các thao tác API cho service 1-1 của mentor. */
export const mentorServiceRepo = {
  getConstraints: (): Promise<MentorServiceConstraintsResponse> =>
    apiClient<MentorServiceConstraintsResponse>('/api/me/mentor-services/constraints'),

  list: (isActive?: boolean): Promise<MentorServiceManagementResponse[]> => {
    const query = isActive === undefined ? '' : `?isActive=${isActive}`;
    return apiClient<MentorServiceManagementResponse[]>(`/api/me/mentor-services${query}`);
  },

  getById: (serviceId: string): Promise<MentorServiceManagementResponse> =>
    apiClient<MentorServiceManagementResponse>(`/api/me/mentor-services/${serviceId}`),

  update: (
    serviceId: string,
    data: UpdateMentorServiceRequest,
  ): Promise<MentorServiceManagementResponse> =>
    apiClient<MentorServiceManagementResponse>(`/api/me/mentor-services/${serviceId}`, {
      method: 'PUT',
      data,
    }),

  create: (data: CreateMentorServiceRequest): Promise<MentorServiceManagementResponse> =>
    apiClient<MentorServiceManagementResponse>('/api/me/mentor-services', {
      method: 'POST',
      data,
    }),

  setActive: (
    serviceId: string,
    data: MentorServiceActiveRequest,
  ): Promise<MentorServiceManagementResponse> =>
    apiClient<MentorServiceManagementResponse>(`/api/me/mentor-services/${serviceId}/active`, {
      method: 'PATCH',
      data,
    }),
};
