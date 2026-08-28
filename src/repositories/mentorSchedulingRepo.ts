/**
 * @file mentorSchedulingRepo.ts
 * @description Repository for reading the current mentor scheduling configuration and availability.
 */

import { apiClient } from '@/models/apiClient';
import type {
  AvailabilitySlotsQuery,
  AvailabilitySlotsResponse,
  AvailabilityTemplateResponse,
  AvailabilityTemplateVersionRequest,
  CreateAvailabilitySlotRequest,
  CreateAvailabilityTemplateRequest,
  CursorPageResponseAvailabilityTemplateResponse,
  DeactivateAvailabilitySlotRequest,
  GoogleCalendarStatusResponse,
  MentorManagedAvailabilitySlotResponse,
  MentorBookingPolicyResponse,
  MentorSchedulingConstraintsResponse,
  UpdateAvailabilitySlotRequest,
  UpdateAvailabilityTemplateRequest,
  UpdateMentorBookingPolicyRequest,
} from '@/models/auth';

function queryString(query: AvailabilitySlotsQuery) {
  const params = new URLSearchParams();
  if (query.isActive !== undefined) params.set('isActive', String(query.isActive));
  if (query.fromDate !== undefined) params.set('fromDate', query.fromDate);
  if (query.toDate !== undefined) params.set('toDate', query.toDate);
  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

/** Read & write scheduling operations for the authenticated mentor. */
export const mentorSchedulingRepo = {
  getBookingPolicy: (): Promise<MentorBookingPolicyResponse> =>
    apiClient<MentorBookingPolicyResponse>('/api/me/mentor-booking-policy'),

  updateBookingPolicy: (
    data: UpdateMentorBookingPolicyRequest,
  ): Promise<MentorBookingPolicyResponse> =>
    apiClient<MentorBookingPolicyResponse>('/api/me/mentor-booking-policy', {
      method: 'PATCH',
      data,
    }),

  getConstraints: (): Promise<MentorSchedulingConstraintsResponse> =>
    apiClient<MentorSchedulingConstraintsResponse>('/api/me/mentor-scheduling-constraints'),

  getGoogleCalendarStatus: (): Promise<GoogleCalendarStatusResponse> =>
    apiClient<GoogleCalendarStatusResponse>('/api/me/google-calendar/status'),

  listAvailabilitySlots: (query: AvailabilitySlotsQuery = {}): Promise<AvailabilitySlotsResponse> =>
    apiClient<AvailabilitySlotsResponse>(`/api/me/availability-slots${queryString(query)}`),

  createAvailabilitySlot: (
    data: CreateAvailabilitySlotRequest,
  ): Promise<MentorManagedAvailabilitySlotResponse> =>
    apiClient<MentorManagedAvailabilitySlotResponse>('/api/me/availability-slots', {
      method: 'POST',
      data,
    }),

  updateAvailabilitySlot: (
    slotId: string,
    data: UpdateAvailabilitySlotRequest,
  ): Promise<MentorManagedAvailabilitySlotResponse> =>
    apiClient<MentorManagedAvailabilitySlotResponse>(`/api/me/availability-slots/${slotId}`, {
      method: 'PUT',
      data,
    }),

  deactivateAvailabilitySlot: (
    slotId: string,
    data: DeactivateAvailabilitySlotRequest,
  ): Promise<MentorManagedAvailabilitySlotResponse> =>
    apiClient<MentorManagedAvailabilitySlotResponse>(
      `/api/me/availability-slots/${slotId}/deactivate`,
      {
        method: 'POST',
        data,
      },
    ),

  listAvailabilityTemplates: (
    cursor?: string,
    limit: number = 20,
  ): Promise<CursorPageResponseAvailabilityTemplateResponse> => {
    const params = new URLSearchParams();
    if (cursor) params.set('cursor', cursor);
    if (limit) params.set('limit', String(limit));
    const query = params.toString();
    return apiClient<CursorPageResponseAvailabilityTemplateResponse>(
      `/api/me/availability-templates${query ? `?${query}` : ''}`,
    );
  },

  getAvailabilityTemplate: (templateId: string): Promise<AvailabilityTemplateResponse> =>
    apiClient<AvailabilityTemplateResponse>(`/api/me/availability-templates/${templateId}`),

  createAvailabilityTemplate: (
    data: CreateAvailabilityTemplateRequest,
  ): Promise<AvailabilityTemplateResponse> =>
    apiClient<AvailabilityTemplateResponse>('/api/me/availability-templates', {
      method: 'POST',
      data,
    }),

  updateAvailabilityTemplate: (
    templateId: string,
    data: UpdateAvailabilityTemplateRequest,
  ): Promise<AvailabilityTemplateResponse> =>
    apiClient<AvailabilityTemplateResponse>(`/api/me/availability-templates/${templateId}`, {
      method: 'PUT',
      data,
    }),

  pauseAvailabilityTemplate: (
    templateId: string,
    data: AvailabilityTemplateVersionRequest,
  ): Promise<AvailabilityTemplateResponse> =>
    apiClient<AvailabilityTemplateResponse>(`/api/me/availability-templates/${templateId}/pause`, {
      method: 'POST',
      data,
    }),

  resumeAvailabilityTemplate: (
    templateId: string,
    data: AvailabilityTemplateVersionRequest,
  ): Promise<AvailabilityTemplateResponse> =>
    apiClient<AvailabilityTemplateResponse>(`/api/me/availability-templates/${templateId}/resume`, {
      method: 'POST',
      data,
    }),

  archiveAvailabilityTemplate: (
    templateId: string,
    data: AvailabilityTemplateVersionRequest,
  ): Promise<AvailabilityTemplateResponse> =>
    apiClient<AvailabilityTemplateResponse>(`/api/me/availability-templates/${templateId}/archive`, {
      method: 'POST',
      data,
    }),
};
