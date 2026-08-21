/**
 * @file useMentorBooking.ts
 * @description Custom React Hook xử lý gửi yêu cầu Đặt lịch hẹn Mentoring (Mentor Booking Hook).
 */

'use client';

import { mentorRepo } from '@/repositories/mentorRepo';
import { useState } from 'react';

/**
 * Hook quản lý việc gửi request tạo lịch hẹn tới Mentor và lưu trữ trạng thái loading/thành công/lỗi.
 */
export function useMentorBooking() {
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Tạo lịch hẹn mới với Mentor theo mốc thời gian đã chọn
   * @param mentorId - ID của Mentor
   * @param startsAt - Thời điểm bắt đầu (ISO string)
   * @returns Promise<boolean> true nếu thành công
   */
  const book = async (mentorId: string, startsAt: string) => {
    setIsSubmitting(true);
    setError(undefined);
    try {
      await mentorRepo.createBooking(mentorId, startsAt);
      setMessage('Đặt lịch thành công. Mentor sẽ nhận được thông báo.');
      return true;
    } catch {
      setError('Không thể đặt lịch vào lúc này. Vui lòng thử lại.');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { message, error, isSubmitting, book };
}
