import { AuthGuard } from '@/components/auth/AuthGuard';
import { MentorShell } from '@/components/domain/mentor-shell/MentorShell';

export default async function MentorPortalLayout({
  children,
  params,
}: Readonly<{ children: React.ReactNode; params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  return (
    <AuthGuard locale={locale}>
      <MentorShell locale={locale}>{children}</MentorShell>
    </AuthGuard>
  );
}
