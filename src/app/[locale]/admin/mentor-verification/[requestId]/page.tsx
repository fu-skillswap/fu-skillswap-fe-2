/**
 * @file page.tsx
 * @description Route xem chi tiết một hồ sơ xác minh mentor.
 */

import { MentorVerificationDetailView } from '@/views/admin/MentorVerificationDetailView';

export default async function MentorVerificationDetailPage({
  params,
}: {
  params: Promise<{ locale: string; requestId: string }>;
}) {
  const { locale, requestId } = await params;
  return <MentorVerificationDetailView locale={locale} requestId={requestId} />;
}
