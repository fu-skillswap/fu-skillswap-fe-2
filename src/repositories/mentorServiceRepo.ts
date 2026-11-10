/**
 * @file mentorServiceRepo.ts
 * @description Repository quản lý dịch vụ mentoring của mentor hiện tại.
 */

import { apiClient } from '@/models/apiClient';
import axios from 'axios';
import type {
  CreateMentorServiceRequest,
  MentorServiceActiveRequest,
  MentorServiceCoverAssetResponse,
  MentorServiceCoverUploadIntentRequest,
  MentorServiceCoverUploadIntentResponse,
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

  createCoverUploadIntent: (
    data: MentorServiceCoverUploadIntentRequest,
  ): Promise<MentorServiceCoverUploadIntentResponse> =>
    apiClient<MentorServiceCoverUploadIntentResponse>(
      '/api/me/mentor-services/cover-image/upload-intents',
      { method: 'POST', data },
    ),

  /**
   * PUTs the file straight to the signed storage URL. Uses plain axios (not `apiClient`) so the
   * Authorization header is never sent to storage; headers are exactly `requiredHeaders`.
   */
  uploadCoverFile: async (
    intent: MentorServiceCoverUploadIntentResponse,
    file: File,
    onProgress?: (percent: number) => void,
  ): Promise<void> => {
    await axios.put(intent.uploadUrl, file, {
      headers: intent.requiredHeaders ?? { 'Content-Type': file.type },
      onUploadProgress: (event) => {
        if (onProgress && event.total) onProgress(Math.round((event.loaded / event.total) * 100));
      },
    });
  },

  confirmCoverUpload: (uploadIntentId: string): Promise<MentorServiceCoverAssetResponse> =>
    apiClient<MentorServiceCoverAssetResponse>(
      `/api/me/mentor-services/cover-image/${uploadIntentId}/confirm`,
      { method: 'POST' },
    ),
};
