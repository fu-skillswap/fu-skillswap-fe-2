/**
 * @file page.tsx
 * @description Route xem danh sách Booking của tôi (`/[locale]/my-bookings`).
 */

import { MyBookingsView } from '@/views/mentee/my-bookings/MyBookingsView';

interface MyBookingsPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function MyBookingsPage({ params }: MyBookingsPageProps) {
  const { locale } = await params;
  return <MyBookingsView locale={locale} />;
}
