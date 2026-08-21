import { LoginView } from '@/views/auth/LoginView';

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <LoginView locale={locale} />;
}
