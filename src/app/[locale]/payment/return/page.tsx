/**
 * @file page.tsx
 * @description Return URL of the payment gateway (`/[locale]/payment/return`). Status is read on
 * the client (it needs the user's token), inside the mentee shell so the user can keep browsing.
 */

import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { MenteeShell } from '@/components/domain/mentee-shell/MenteeShell';
import { PaymentReturnView } from '@/views/payment/PaymentReturnView';

export const metadata: Metadata = {
  title: 'Kết quả thanh toán',
  robots: { index: false, follow: false },
};

export default async function PaymentReturnPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <MenteeShell locale={locale}>
      <AuthGuard locale={locale}>
        <Suspense fallback={null}>
          <PaymentReturnView locale={locale} />
        </Suspense>
      </AuthGuard>
    </MenteeShell>
  );
}
