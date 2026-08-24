/**
 * @file page.tsx
 * @description Route xem chi tiết một hồ sơ xác minh mentor.
 */

import { MentorVerificationDetailView } from '@/views/admin/MentorVerificationDetailView';

export default async function MentorVerificationDetailPage({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const { requestId } = await params;
  return <MentorVerificationDetailView requestId={requestId} />;
}
