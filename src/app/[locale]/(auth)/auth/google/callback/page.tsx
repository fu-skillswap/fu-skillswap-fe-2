import { GoogleCallbackView } from "@/views/auth/GoogleCallbackView";

export default async function GoogleCallbackPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <GoogleCallbackView locale={locale} />;
}
