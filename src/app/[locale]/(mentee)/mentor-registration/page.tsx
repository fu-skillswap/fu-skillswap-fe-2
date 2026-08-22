/**
 * @file page.tsx
 * @description Route Đăng ký / Chỉnh sửa Hồ sơ Mentor (`/[locale]/mentor-registration`).
 */

import { MentorRegistrationView } from "@/views/mentee/mentor-registration/MentorRegistrationView";

export default async function MentorRegistrationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <MentorRegistrationView locale={locale} />;
}
