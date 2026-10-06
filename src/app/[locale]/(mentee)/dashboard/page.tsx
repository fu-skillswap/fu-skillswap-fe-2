/**
 * @file page.tsx
 * @description Route Bảng tin cộng đồng Mentee (`/[locale]/dashboard`).
 */

import { mentorRepo } from '@/repositories/mentorRepo';
import { postRepo } from '@/repositories/postRepo';
import { MenteeDashboardView } from '@/views/mentee/dashboard/MenteeDashboardView';

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const [{ locale }, posts, mentors] = await Promise.all([
    params,
    postRepo.list(),
    mentorRepo.list({ page: 0, size: 3 }),
  ]);

  return <MenteeDashboardView locale={locale} posts={posts} mentors={mentors.slice(0, 3)} />;
}
