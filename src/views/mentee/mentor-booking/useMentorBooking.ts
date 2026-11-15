/**
 * @file useMentorBooking.ts
 * @description Custom React Hook xử lý gửi yêu cầu Đặt lịch hẹn Mentoring (Mentor Booking Hook).
 */

'use client';

import { ApiClientError } from '@/models/apiClient';
import type { CreateBookingRequest } from '@/models/auth';
import { newIdempotencyKey } from '@/repositories/bookingRepo';
import { mentorRepo } from '@/repositories/mentorRepo';
import { getUserFriendlyErrorMessage } from '@/utils/toast';
import { useRef, useState } from 'react';
import { track } from '@/lib/analytics';

/**
 * Hook quản lý việc gửi request tạo lịch hẹn tới Mentor và lưu trữ trạng thái loading/thành công/lỗi.
 */
export function useMentorBooking() {
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  /** The BE refused the chosen time (409 / BOOKING_4001): the mentee must pick another one. */
  const [isSlotUnavailable, setIsSlotUnavailable] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Idempotency-Key of the attempt in flight, tied to its payload. It is reused only when the
  // SAME request is retried after a timeout / network / server error. Reusing it for another
  // time slot would make the BE replay the previous answer.
  const attemptRef = useRef<{ signature: string; key: string } | null>(null);

  /**
   * Tạo lịch hẹn mới với Mentor theo mốc thời gian đã chọn (POST /api/bookings).
   * @param subject Service title, sent to analytics (never the mentee's own goal text).
   */
  const book = async (payload: CreateBookingRequest, subject?: string) => {
    setIsSubmitting(true);
    setError(undefined);
    setIsSlotUnavailable(false);

    const signature = JSON.stringify(payload);
    if (attemptRef.current?.signature !== signature) {
      attemptRef.current = { signature, key: newIdempotencyKey() };
    }

    try {
      await mentorRepo.createBookingRequest(payload, attemptRef.current.key);
      track('booking_created', { subject: subject ?? '' });

      attemptRef.current = null;
      setMessage('Gửi yêu cầu đặt lịch thành công.');
      return true;
    } catch (err) {
      if (err instanceof ApiClientError && err.status >= 400 && err.status < 500) {
        // The BE answered, so this attempt is over; the next click is a new attempt.
        attemptRef.current = null;
        setIsSlotUnavailable(err.status === 409 || err.code === 'BOOKING_4001');
      }
      setError(
        getUserFriendlyErrorMessage(
          err,
          'Chưa gửi được yêu cầu đặt lịch. Bạn chọn khung giờ khác hoặc thử lại sau ít phút nhé.',
        ),
      );
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  /** Reset Idempotency Key cho phiên đặt lịch mới */
  const resetIdempotencyKey = () => {
    attemptRef.current = null;
  };

  return { message, error, isSlotUnavailable, isSubmitting, book, resetIdempotencyKey };
}
