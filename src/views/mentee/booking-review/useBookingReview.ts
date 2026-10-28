/**
 * @file useBookingReview.ts
 * @description Loads a booking and its saved review, and submits the mentee's review through the
 * real API. Success is only shown once the server has stored the review.
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mentorReviewsQueryKey } from '@/components/domain/mentor-detail/useMentorReviews';
import { ApiClientError } from '@/models/apiClient';
import type { SessionFeedbackResponse } from '@/models/review';
import { useAuth } from '@/providers/AuthProvider';
import { bookingRepo } from '@/repositories/bookingRepo';
import { bookingFeedbackQueryKey, reviewRepo } from '@/repositories/reviewRepo';

export const bookingDetailQueryKey = (bookingId: string) => ['booking', bookingId];

export interface ReviewSubmission {
  rating: number;
  comment: string;
  // TODO(api): SubmitFeedbackRequest has no tags field; send the picked tags once it does.
  // TODO(api): no anonymity field either (`isPublic` hides the whole review, it does not hide the
  // name), so "Hiện tên của tôi trong đánh giá" is not offered yet.
}

const isAccessError = (error: unknown) =>
  error instanceof ApiClientError && [401, 403, 404].includes(error.status);

export function useBookingReview(bookingId: string) {
  const { isBootstrapping } = useAuth();
  const queryClient = useQueryClient();
  const feedbackKey = bookingFeedbackQueryKey(bookingId);

  const booking = useQuery({
    queryKey: bookingDetailQueryKey(bookingId),
    queryFn: () => bookingRepo.detail(bookingId),
    enabled: !isBootstrapping,
    retry: (count, error) => !isAccessError(error) && count < 1,
  });

  const feedback = useQuery({
    queryKey: feedbackKey,
    queryFn: () => reviewRepo.getByBooking(bookingId),
    enabled: !isBootstrapping && booking.isSuccess,
    retry: false,
  });

  const submit = useMutation({
    mutationFn: async ({ rating, comment }: ReviewSubmission) => {
      try {
        return await reviewRepo.create(bookingId, {
          rating,
          comment: comment.trim() || undefined,
          // The success copy says the review shows on the mentor's profile.
          isPublic: true,
        });
      } catch (error) {
        // 409: a review already exists (e.g. sent from another tab); show the saved one.
        if (error instanceof ApiClientError && error.status === 409) {
          const saved = await reviewRepo.getByBooking(bookingId);
          if (saved) return saved;
        }
        throw error;
      }
    },
    onSuccess: (saved: SessionFeedbackResponse) => {
      queryClient.setQueryData(feedbackKey, saved);
      // The booking moves to "Đã học"; mentor rating and review lists change too.
      void queryClient.invalidateQueries({ queryKey: bookingDetailQueryKey(bookingId) });
      void queryClient.invalidateQueries({ queryKey: ['mentor-recommendations'] });
      const mentorUserId = booking.data?.mentorUserId;
      if (mentorUserId) {
        void queryClient.invalidateQueries({ queryKey: mentorReviewsQueryKey(mentorUserId) });
      }
    },
  });

  return {
    booking: booking.data,
    review: feedback.data ?? null,
    isLoading: isBootstrapping || booking.isPending || (booking.isSuccess && feedback.isPending),
    isNotFound: isAccessError(booking.error),
    loadError: booking.error ?? feedback.error,
    retry: () => {
      void booking.refetch();
      void feedback.refetch();
    },
    submit,
  };
}
