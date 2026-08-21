/**
 * @file layout.tsx
 * @description Layout bảo vệ chung cho toàn bộ phân vùng Mentee (`/(mentee)/*`).
 * Đảm bảo người dùng phải được xác thực qua AuthGuard và bọc giao diện trong MenteeShell.
 */

import { MenteeShell } from "@/components/domain/mentee-shell/MenteeShell";
// import { AuthGuard } from "@/components/auth/AuthGuard";

/**
 * Layout cho phân vùng Mentee.
 */
export default async function MenteeLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  return (
    // Comment đi để Guest có thể vào xem dashboard
    // <AuthGuard locale={locale}>
    <MenteeShell locale={locale}>{children}</MenteeShell>
    // </AuthGuard>
  );
}
