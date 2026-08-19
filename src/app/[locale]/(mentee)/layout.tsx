import { MenteeShell } from "@/components/domain/mentee-shell/MenteeShell";
import { AuthGuard } from "@/components/auth/AuthGuard";

export default async function MenteeLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  return (
    <AuthGuard locale={locale}>
      <MenteeShell locale={locale}>{children}</MenteeShell>
    </AuthGuard>
  );
}
