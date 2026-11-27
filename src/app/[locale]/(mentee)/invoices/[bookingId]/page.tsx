/**
 * @file page.tsx
 * @description Biên nhận chi tiết của một buổi học (`/[locale]/invoices/[bookingId]`).
 */

import type { Metadata } from 'next';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { InvoiceDetailView } from '@/views/mentee/invoices/InvoiceDetailView';

export const metadata: Metadata = {
  title: 'Biên nhận thanh toán',
  robots: { index: false, follow: false },
};

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ locale: string; bookingId: string }>;
}) {
  const { locale, bookingId } = await params;
  return (
    <AuthGuard locale={locale}>
      <InvoiceDetailView locale={locale} bookingId={bookingId} />
    </AuthGuard>
  );
}
