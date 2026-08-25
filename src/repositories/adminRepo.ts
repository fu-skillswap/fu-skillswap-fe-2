/**
 * @file adminRepo.ts
 * @description Repository gọi các API vận hành dành riêng cho ADMIN và SYSTEM_ADMIN.
 */

import { apiClient } from '@/models/apiClient';
import type {
  AdminDashboardOverviewResponse,
  AdminDashboardQueuesResponse,
  AdminDashboardTimeseriesResponse,
  AdminPageResponse,
  AdminQueueItem,
  AdminQueueItemsQuery,
  AdminMentorsQuery,
  AdminMentorsResponse,
  AdminMentorDetail,
  AdminUsersQuery,
  AdminUsersResponse,
  AdminUserSummary,
  MentorVerificationRequestsQuery,
  MentorVerificationRequestsResponse,
  MentorVerificationLock,
  MentorVerificationRequestDetail,
} from '@/models/admin';

function queryString(query: object) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined) params.set(key, String(value));
  });
  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

export const adminRepo = {
  getOverview: () => apiClient<AdminDashboardOverviewResponse>('/api/admin/dashboard/overview'),

  getQueues: () => apiClient<AdminDashboardQueuesResponse>('/api/admin/dashboard/queues'),

  getTimeseries: () =>
    apiClient<AdminDashboardTimeseriesResponse>('/api/admin/dashboard/timeseries'),

  getQueueItems: (query: AdminQueueItemsQuery) =>
    apiClient<AdminPageResponse<AdminQueueItem>>(
      `/api/admin/dashboard/queue-items${queryString(query)}`,
    ),

  getUsers: (query: AdminUsersQuery) =>
    apiClient<AdminUsersResponse>(`/api/admin/users${queryString(query)}`),

  getMentors: (query: AdminMentorsQuery) =>
    apiClient<AdminMentorsResponse>(`/api/admin/mentors${queryString(query)}`),

  getMentor: (mentorUserId: string) =>
    apiClient<AdminMentorDetail>(`/api/admin/mentors/${mentorUserId}`),

  getUserSummary: (userId: string) =>
    apiClient<AdminUserSummary>(`/api/admin/users/${userId}/summary`),

  banUser: (userId: string, reason: string) =>
    apiClient<unknown>(`/api/admin/users/${userId}/ban`, {
      method: 'POST',
      data: { reason },
    }),

  unbanUser: (userId: string, reason: string) =>
    apiClient<unknown>(`/api/admin/users/${userId}/unban`, {
      method: 'POST',
      data: { reason },
    }),

  getMentorVerificationRequests: (query: MentorVerificationRequestsQuery) =>
    apiClient<MentorVerificationRequestsResponse>(
      `/api/admin/mentor-verification/requests${queryString(query)}`,
    ),

  getMentorVerificationRequest: (requestId: string) =>
    apiClient<MentorVerificationRequestDetail>(
      `/api/admin/mentor-verification/requests/${requestId}`,
    ),

  getMentorVerificationLock: (requestId: string) =>
    apiClient<MentorVerificationLock>(`/api/admin/mentor-verification/requests/${requestId}/lock`),

  releaseMentorVerificationLock: (requestId: string) =>
    apiClient<MentorVerificationLock>(
      `/api/admin/mentor-verification/requests/${requestId}/lock/release`,
      { method: 'POST' },
    ),

  refreshMentorVerificationLock: (requestId: string) =>
    apiClient<MentorVerificationLock>(
      `/api/admin/mentor-verification/requests/${requestId}/lock/refresh`,
      { method: 'POST' },
    ),

  requestMentorRevision: (requestId: string, note: string) =>
    apiClient<MentorVerificationRequestDetail>(
      `/api/admin/mentor-verification/requests/${requestId}/request-revision`,
      { method: 'POST', data: { note } },
    ),

  rejectMentorVerification: (requestId: string, note: string) =>
    apiClient<MentorVerificationRequestDetail>(
      `/api/admin/mentor-verification/requests/${requestId}/reject`,
      { method: 'POST', data: { note } },
    ),

  approveMentorVerification: (requestId: string) =>
    apiClient<MentorVerificationRequestDetail>(
      `/api/admin/mentor-verification/requests/${requestId}/approve`,
      { method: 'POST' },
    ),

  assignCase: (caseType: string, caseId: string) =>
    apiClient<unknown>(`/api/admin/cases/${caseType}/${caseId}/assign`, { method: 'POST' }),
};
