/**
 * @file page.tsx
 * @description Legacy cancel URL (`/[locale]/payment/cancel`). Forwards to `/payment/return` with
 * `cancel=true`, which explains that nothing was charged and offers to pay again.
 */

import { redirect } from 'next/navigation';

interface PaymentCancelPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function PaymentCancelPage({ params, searchParams }: PaymentCancelPageProps) {
  const { locale } = await params;
  const query = new URLSearchParams();
  Object.entries(await searchParams).forEach(([key, value]) => {
    if (typeof value === 'string') query.set(key, value);
  });
  query.set('cancel', 'true');
  redirect(`/${locale}/payment/return?${query.toString()}`);
}
