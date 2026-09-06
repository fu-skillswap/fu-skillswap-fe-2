/**
 * @file bookingRepo.ts
 * @description Repository cho các action vòng đời booking dùng chung theo participant hiện tại.
 */

import { apiClient } from '@/models/apiClient';
import type {
  ConfirmBookingRequest,
  MentorBookingPageResponse,
  MentorBookingResponse,
  PaymentCheckoutResponse,
  RespondBookingIssueRequest,
  SubmitBookingIssueRequest,
} from '@/models/auth';

function idempotencyKey() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `idem_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export const bookingRepo = {
  listForMentee: () =>
    apiClient<MentorBookingPageResponse>(
      '/api/me/bookings?role=MENTEE&page=0&size=100&sortBy=createdAt&direction=DESC',
    ),
  detail: (bookingId: string) => apiClient<MentorBookingResponse>(`/api/me/bookings/${bookingId}`),
  cancel: (bookingId: string, cancelReason: string) =>
    apiClient<MentorBookingResponse>(`/api/me/bookings/${bookingId}/cancel`, {
      method: 'POST',
      data: { cancelReason },
      headers: {
        'Idempotency-Key': idempotencyKey(),
      },
    }),
  checkIn: (bookingId: string) =>
    apiClient<MentorBookingResponse>(`/api/me/bookings/${bookingId}/check-in`, {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey() },
    }),
  confirm: (bookingId: string, data: ConfirmBookingRequest = {}) =>
    apiClient<MentorBookingResponse>(`/api/me/bookings/${bookingId}/confirm`, {
      method: 'POST',
      data,
    }),
  reportIssue: (bookingId: string, data: SubmitBookingIssueRequest) =>
    apiClient(`/api/me/bookings/${bookingId}/issue`, { method: 'POST', data }),
  respondIssue: (bookingId: string, data: RespondBookingIssueRequest) =>
    apiClient(`/api/me/bookings/${bookingId}/issue/respond`, { method: 'POST', data }),
  checkout: (bookingId: string) =>
    apiClient<PaymentCheckoutResponse>('/api/me/payment-orders/checkout', {
      method: 'POST',
      data: { bookingId },
      headers: { 'Idempotency-Key': idempotencyKey() },
    }),
};
