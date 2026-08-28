import { MentorDashboardView } from '@/views/mentor/MentorDashboardView';

export default async function MentorDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <MentorDashboardView locale={locale} />;
}
