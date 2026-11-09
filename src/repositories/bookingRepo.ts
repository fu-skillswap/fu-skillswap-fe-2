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
import type { CheckoutPreviewResponse } from '@/models/coupon';

/**
 * New `Idempotency-Key` value. Callers that retry the SAME attempt (e.g. after a timeout) must
 * reuse the key they got the first time; a new attempt gets a new key.
 */
export function newIdempotencyKey() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `idem_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

const idempotencyKey = newIdempotencyKey;

function normalizeCouponCode(couponCode: string | null | undefined) {
  const trimmed = couponCode?.trim();
  return trimmed ? trimmed.toUpperCase() : null;
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
  /** Read-only estimate: does not create a payment order or reserve the coupon/credit. */
  previewCheckout: (bookingId: string, couponCode: string | null = null) =>
    apiClient<CheckoutPreviewResponse>(`/api/me/bookings/${bookingId}/checkout-preview`, {
      method: 'POST',
      data: { couponCode: normalizeCouponCode(couponCode) },
    }),
  /**
   * Creates the payment order. Pass the same `key` when retrying the same attempt after a
   * timeout/network error; omit it (or pass a fresh `newIdempotencyKey()`) for a new attempt.
   */
  checkout: (bookingId: string, couponCode: string | null = null, key: string = idempotencyKey()) =>
    apiClient<PaymentCheckoutResponse>('/api/me/payment-orders/checkout', {
      method: 'POST',
      data: { bookingId, couponCode: normalizeCouponCode(couponCode) },
      headers: { 'Idempotency-Key': key },
    }),
};
