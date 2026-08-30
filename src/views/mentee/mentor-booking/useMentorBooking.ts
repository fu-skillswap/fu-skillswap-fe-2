/**
 * @file useMentorBooking.ts
 * @description Custom React Hook xử lý gửi yêu cầu Đặt lịch hẹn Mentoring (Mentor Booking Hook).
 */

'use client';

import type { CreateBookingRequest } from '@/models/auth';
import { mentorRepo } from '@/repositories/mentorRepo';
import { useState } from 'react';

/**
 * Hook quản lý việc gửi request tạo lịch hẹn tới Mentor và lưu trữ trạng thái loading/thành công/lỗi.
 */
export function useMentorBooking() {
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null);

  /**
   * Tạo lịch hẹn mới với Mentor theo mốc thời gian đã chọn (POST /api/bookings).
   * Giữ nguyên Idempotency-Key trong Header nếu thực hiện Retry cùng một yêu cầu đặt lịch.
   */
  const book = async (payloadOrMentorId: CreateBookingRequest | string, startsAt?: string) => {
    setIsSubmitting(true);
    setError(undefined);

    // Lấy hoặc tạo Idempotency-Key cố định cho session retry hiện tại
    let currentKey = idempotencyKey;
    if (!currentKey) {
      currentKey =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `idem_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      setIdempotencyKey(currentKey);
    }

    try {
      if (typeof payloadOrMentorId === 'object') {
        await mentorRepo.createBookingRequest(payloadOrMentorId, currentKey);
      } else {
        await mentorRepo.createBooking(payloadOrMentorId, startsAt || new Date().toISOString().replace(/Z$/, ''));
      }

      // Đặt lịch thành công -> Reset Idempotency-Key cho lần đặt lịch sau
      setIdempotencyKey(null);
      setMessage('Gửi yêu cầu đặt lịch thành công.');
      return true;
    } catch (err: any) {
      // Giữ nguyên Idempotency-Key để hỗ trợ Retry cùng request
      const errorMsg =
        err?.message ||
        'Khung giờ này vừa có người khác chốt lịch. Đã tự động tải lại danh sách khung giờ rảnh để bạn chọn khung giờ khác!';
      setError(errorMsg);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  /** Reset Idempotency Key cho phiên đặt lịch mới */
  const resetIdempotencyKey = () => setIdempotencyKey(null);

  return { message, error, isSubmitting, book, idempotencyKey, resetIdempotencyKey };
}
