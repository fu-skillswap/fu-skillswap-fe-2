/**
 * @file page.tsx
 * @description Route Hoàn thiện Hồ sơ Sinh viên (`/[locale]/onboarding/student-profile`).
 * Render giao diện `StudentOnboardingView` để tạo hồ sơ ban đầu.
 */

import { StudentOnboardingView } from '@/views/auth/StudentOnboardingView';

/**
 * Server Component cho trang Onboarding Sinh viên.
 */
export default async function StudentProfileOnboardingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <StudentOnboardingView locale={locale} />;
}
