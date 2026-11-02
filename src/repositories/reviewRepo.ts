/**
 * @file reviewRepo.ts
 * @description Mentee reviews of finished sessions. The backend only accepts a review for a
 * COMPLETED booking of the current mentee, one per booking (409 when one already exists).
 */

import { apiClient } from '@/models/apiClient';
import type { SessionFeedbackResponse, SubmitFeedbackRequest } from '@/models/review';

/** React Query key of a booking's saved review (booking card and review page share it). */
export const bookingFeedbackQueryKey = (bookingId: string) => ['booking-feedback', bookingId];

export const reviewRepo = {
  /** The booking's saved review, or `null` when there is none yet. */
  getByBooking: async (bookingId: string) =>
    (await apiClient<SessionFeedbackResponse | null>(`/api/bookings/${bookingId}/feedback`)) ??
    null,
  create: (bookingId: string, data: SubmitFeedbackRequest) =>
    apiClient<SessionFeedbackResponse>(`/api/bookings/${bookingId}/feedback`, {
      method: 'POST',
      data,
    }),
};
