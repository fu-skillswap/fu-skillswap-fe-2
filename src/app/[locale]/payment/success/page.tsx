/**
 * @file page.tsx
 * @description Legacy return URL (`/[locale]/payment/success`). Forwards the gateway's query to
 * `/payment/return`, which checks the real status with the backend and shows the receipt.
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
  const query = new URLSearchParams();
  Object.entries(await searchParams).forEach(([key, value]) => {
    if (typeof value === 'string') query.set(key, value);
  });
  const search = query.toString();
  redirect(`/${locale}/payment/return${search ? `?${search}` : ''}`);
}
