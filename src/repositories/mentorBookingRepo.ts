/**
 * @file mentorBookingRepo.ts
 * @description Repository quản lý danh sách và vòng đời booking theo góc nhìn Mentor.
 */

import { apiClient } from '@/models/apiClient';
import type {
  AcceptMentorBookingRequest,
  CancelMentorBookingRequest,
  CompleteMentorBookingRequest,
  MentorBookingPageResponse,
  MentorBookingResponse,
  RejectMentorBookingRequest,
} from '@/models/auth';

function createIdempotencyKey(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `idem_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export const mentorBookingRepo = {
  list: (): Promise<MentorBookingPageResponse> =>
    apiClient<MentorBookingPageResponse>(
      '/api/me/bookings?role=MENTOR&page=0&size=100&sortBy=createdAt&direction=DESC',
    ),
  /** Total bookings for one side only (size=1 page, read `totalElements`). */
  count: (role: 'MENTOR' | 'MENTEE'): Promise<number> =>
    apiClient<MentorBookingPageResponse>(`/api/me/bookings?role=${role}&page=0&size=1`).then(
      (page) => page.totalElements ?? 0,
    ),
  detail: (bookingId: string): Promise<MentorBookingResponse> =>
    apiClient<MentorBookingResponse>(`/api/me/bookings/${bookingId}`),
  accept: (bookingId: string, data: AcceptMentorBookingRequest): Promise<MentorBookingResponse> =>
    apiClient<MentorBookingResponse>(`/api/mentor/bookings/${bookingId}/accept`, {
      method: 'POST',
      data,
      headers: {
        'Idempotency-Key': createIdempotencyKey(),
      },
    }),
  reject: (bookingId: string, data: RejectMentorBookingRequest): Promise<MentorBookingResponse> =>
    apiClient<MentorBookingResponse>(`/api/mentor/bookings/${bookingId}/reject`, {
      method: 'POST',
      data,
      headers: {
        'Idempotency-Key': createIdempotencyKey(),
      },
    }),
  complete: (
    bookingId: string,
    data: CompleteMentorBookingRequest,
  ): Promise<MentorBookingResponse> =>
    apiClient<MentorBookingResponse>(`/api/mentor/bookings/${bookingId}/complete`, {
      method: 'POST',
      data,
      headers: {
        'Idempotency-Key': createIdempotencyKey(),
      },
    }),
  cancel: (bookingId: string, data: CancelMentorBookingRequest): Promise<MentorBookingResponse> =>
    apiClient<MentorBookingResponse>(`/api/mentor/bookings/${bookingId}/cancel`, {
      method: 'POST',
      data,
      headers: {
        'Idempotency-Key': createIdempotencyKey(),
      },
    }),
};
