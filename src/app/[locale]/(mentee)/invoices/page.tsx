/**
 * @file page.tsx
 * @description Hóa đơn của tôi (`/[locale]/invoices`): biên nhận các buổi học đã thanh toán.
 */

import type { Metadata } from 'next';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { InvoicesView } from '@/views/mentee/invoices/InvoicesView';

export const metadata: Metadata = {
  title: 'Hóa đơn của tôi',
  robots: { index: false, follow: false },
};

export default async function InvoicesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <AuthGuard locale={locale}>
      <InvoicesView locale={locale} />
    </AuthGuard>
  );
}
