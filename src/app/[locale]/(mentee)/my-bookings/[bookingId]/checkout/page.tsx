/**
 * @file page.tsx
 * @description Payment confirmation before PayOS (`/[locale]/my-bookings/[bookingId]/checkout`).
 * Booking and preview load on the client (they need the user's token), so nothing here can fail.
 */

import type { Metadata } from 'next';
import { BookingCheckoutView } from '@/views/mentee/checkout/BookingCheckoutView';

export const metadata: Metadata = {
  title: 'Xác nhận thanh toán',
  robots: { index: false, follow: false },
};

interface BookingCheckoutPageProps {
  params: Promise<{ locale: string; bookingId: string }>;
}

export default async function BookingCheckoutPage({ params }: BookingCheckoutPageProps) {
  const { locale, bookingId } = await params;
  return <BookingCheckoutView locale={locale} bookingId={bookingId} />;
}
