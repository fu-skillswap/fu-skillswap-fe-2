/**
 * @file page.tsx
 * @description Return URL when the mentee cancels on the payment gateway (`/[locale]/payment/cancel`).
 * Nothing to render: the booking is still awaiting payment, so send the mentee back to their
 * bookings, where the card keeps its "Thanh toán" button.
 */

import { redirect } from 'next/navigation';

interface PaymentCancelPageProps {
  params: Promise<{ locale: string }>;
}

export default async function PaymentCancelPage({ params }: PaymentCancelPageProps) {
  const { locale } = await params;
  redirect(`/${locale}/my-bookings?payment=cancelled`);
}
