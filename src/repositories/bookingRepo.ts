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
import { reviewRepo } from '@/repositories/reviewRepo';

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

/**
 * The BE keeps a reviewed booking at FEEDBACK_REQUIRED with `canSubmitFeedback: true`, so the
 * mentee was asked to review again forever. Look up the saved review of those bookings and show
 * the reviewed ones as completed. A failed lookup leaves the booking as the BE sent it.
 * TODO(api): return a hasFeedback flag (or the right displayState) in the booking list instead.
 */
async function markReviewedBookings(bookings: MentorBookingResponse[]) {
  return Promise.all(
    bookings.map(async (booking) => {
      const awaitsReview =
        String(booking.displayState || '').toUpperCase() === 'FEEDBACK_REQUIRED' ||
        Boolean(booking.canSubmitFeedback);
      if (!awaitsReview) return booking;
      try {
        const review = await reviewRepo.getByBooking(booking.bookingId);
        if (!review) return booking;
        return {
          ...booking,
          displayState: 'COMPLETED' as MentorBookingResponse['displayState'],
          canSubmitFeedback: false,
        };
      } catch {
        return booking;
      }
    }),
  );
}

function normalizeCouponCode(couponCode: string | null | undefined) {
  const trimmed = couponCode?.trim();
  return trimmed ? trimmed.toUpperCase() : null;
}

export const bookingRepo = {
  listForMentee: async (): Promise<MentorBookingPageResponse> => {
    const page = await apiClient<MentorBookingPageResponse>(
      '/api/me/bookings?role=MENTEE&page=0&size=100&sortBy=createdAt&direction=DESC',
    );
    return { ...page, content: await markReviewedBookings(page.content ?? []) };
  },
  /** Mentee bookings without the per-booking review lookup (receipts do not need it). */
  listForMenteePlain: () =>
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
      // The BE rejects booking state changes without this header (400 IDEMPOTENCY_KEY_REQUIRED).
      headers: { 'Idempotency-Key': idempotencyKey() },
    }),
  reportIssue: (bookingId: string, data: SubmitBookingIssueRequest) =>
    apiClient(`/api/me/bookings/${bookingId}/issue`, {
      method: 'POST',
      data,
      headers: { 'Idempotency-Key': idempotencyKey() },
    }),
  respondIssue: (bookingId: string, data: RespondBookingIssueRequest) =>
    apiClient(`/api/me/bookings/${bookingId}/issue/respond`, {
      method: 'POST',
      data,
      headers: { 'Idempotency-Key': idempotencyKey() },
    }),
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
