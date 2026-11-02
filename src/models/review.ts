/**
 * @file review.ts
 * @description Types for the mentee's review of a finished session
 * (`/api/bookings/{bookingId}/feedback`).
 */

/** Body of `POST /api/bookings/{bookingId}/feedback`. */
export interface SubmitFeedbackRequest {
  /** Overall rating for the mentor, 1–5. */
  rating: number;
  comment?: string;
  /** Show the review on the mentor's public profile. */
  isPublic?: boolean;
}

/** A saved review; `GET` returns `null` while the booking has none. */
export interface SessionFeedbackResponse {
  id: string;
  sessionId: string;
  reviewerUserId: string;
  reviewerDisplayName: string;
  revieweeUserId: string;
  revieweeDisplayName: string;
  rating: number;
  satisfactionLevel?: number | null;
  comment?: string | null;
  wouldRecommend?: boolean | null;
  createdAt: string;
  public?: boolean;
}
