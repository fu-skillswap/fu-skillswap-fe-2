import { StudentOnboardingView } from "@/views/auth/StudentOnboardingView";

export default async function StudentProfileOnboardingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <StudentOnboardingView locale={locale} />;
}
