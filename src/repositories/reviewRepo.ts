/**
 * @file reviewRepo.ts
 * @description Mentee reviews of finished sessions. The backend only accepts a review for a
 * COMPLETED booking of the current mentee, one per booking (409 when one already exists).
 */

import { ApiClientError, apiClient } from '@/models/apiClient';
import type { SessionFeedbackResponse, SubmitFeedbackRequest } from '@/models/review';

/** React Query key of a booking's saved review (booking card and review page share it). */
export const bookingFeedbackQueryKey = (bookingId: string) => ['booking-feedback', bookingId];

/** True only for a stored review, not for an API envelope or an empty object. */
function isSavedReview(value: unknown): value is SessionFeedbackResponse {
  if (!value || typeof value !== 'object') return false;
  const review = value as Partial<SessionFeedbackResponse>;
  return Boolean(review.id) && typeof review.rating === 'number';
}

export const reviewRepo = {
  /** The booking's saved review, or `null` when there is none yet. */
  getByBooking: async (bookingId: string): Promise<SessionFeedbackResponse | null> => {
    try {
      const result = await apiClient<unknown>(`/api/bookings/${bookingId}/feedback`);
      // "No review yet" comes back as 200 with no `data` field (the BE drops null fields), which
      // apiClient hands back as the bare envelope. Treat anything that is not a review as none.
      return isSavedReview(result) ? result : null;
    } catch (error) {
      // An explicit `data: null` on a 2xx is raised by apiClient as an error; it means "none".
      if (error instanceof ApiClientError && error.status >= 200 && error.status < 300) {
        return null;
      }
      throw error;
    }
  },
  create: async (bookingId: string, data: SubmitFeedbackRequest) => {
    const created = await apiClient<unknown>(`/api/bookings/${bookingId}/feedback`, {
      method: 'POST',
      data,
    });
    if (isSavedReview(created)) return created;
    // Stored but not echoed back: read it so the UI shows the real rating.
    const saved = await reviewRepo.getByBooking(bookingId);
    if (!saved) throw new Error('Feedback was not stored.');
    return saved;
  },
};
