/**
 * @file page.tsx
 * @description Route xem danh sách Booking của tôi (`/[locale]/my-bookings`).
 */

import { MyBookingsView } from '@/views/mentee/my-bookings/MyBookingsView';
import {
  PaymentReturnNotice,
  type PaymentReturnResult,
} from '@/views/mentee/my-bookings/PaymentReturnNotice';

interface MyBookingsPageProps {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{ payment?: string }>;
}

export default async function MyBookingsPage({ params, searchParams }: MyBookingsPageProps) {
  const { locale } = await params;
  const { payment } = await searchParams;
  const paymentResult: PaymentReturnResult | undefined =
    payment === 'cancelled' || payment === 'success' ? payment : undefined;
  return (
    <>
      <PaymentReturnNotice result={paymentResult} />
      <MyBookingsView locale={locale} />
    </>
  );
}
