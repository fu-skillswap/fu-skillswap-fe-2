/**
 * @file page.tsx
 * @description Route landing page public mặc định (`/[locale]`).
 */

import { LandingView } from '@/views/landing/LandingView';

/**
 * Server Component chuyển locale vào landing view.
 */
export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <LandingView locale={locale} />;
}
