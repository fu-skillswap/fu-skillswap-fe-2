/**
 * @file page.tsx
 * @description Route đánh giá một buổi học (`/[locale]/my-bookings/[bookingId]/review`).
 * Booking and review load on the client (they need the user's token), so nothing here can fail.
 */

import type { Metadata } from 'next';
import { BookingReviewView } from '@/views/mentee/booking-review/BookingReviewView';
import { parseRatingParam } from '@/views/mentee/booking-review/review.constants';

export const metadata: Metadata = {
  title: 'Đánh giá buổi học',
  robots: { index: false, follow: false },
};

interface BookingReviewPageProps {
  params: Promise<{ locale: string; bookingId: string }>;
  searchParams: Promise<{ rating?: string }>;
}

export default async function BookingReviewPage({ params, searchParams }: BookingReviewPageProps) {
  const [{ locale, bookingId }, { rating }] = await Promise.all([params, searchParams]);
  return (
    <BookingReviewView
      locale={locale}
      bookingId={bookingId}
      initialRating={parseRatingParam(rating)}
    />
  );
}
