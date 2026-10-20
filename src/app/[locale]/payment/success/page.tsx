/**
 * @file page.tsx
 * @description Return URL after paying on the payment gateway (`/[locale]/payment/success`).
 * The booking status is confirmed server-side, so just send the mentee back to their bookings.
 * The gateway may still land here for a cancelled payment, so its `status` / `cancel` params
 * decide which notice is shown.
 */

import { redirect } from 'next/navigation';

interface PaymentSuccessPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function PaymentSuccessPage({
  params,
  searchParams,
}: PaymentSuccessPageProps) {
  const { locale } = await params;
  const query = await searchParams;
  const status = String(query.status ?? '').toUpperCase();
  const cancelled = query.cancel === 'true' || status === 'CANCELLED';
  redirect(`/${locale}/my-bookings?payment=${cancelled ? 'cancelled' : 'success'}`);
}
