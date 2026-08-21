'use client';

import { mentorRepo } from '@/repositories/mentorRepo';
import { useState } from 'react';

export function useMentorBooking() {
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

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
