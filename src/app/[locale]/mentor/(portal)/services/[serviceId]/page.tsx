/**
 * @file page.tsx
 * @description Route chi tiết một dịch vụ của Mentor.
 */

import { MentorServiceDetailView } from '@/views/mentor/service-detail/MentorServiceDetailView';

export default async function MentorServiceDetailPage({
  params,
}: {
  params: Promise<{ locale: string; serviceId: string }>;
}) {
  const { locale, serviceId } = await params;

  return <MentorServiceDetailView locale={locale} serviceId={serviceId} />;
}
