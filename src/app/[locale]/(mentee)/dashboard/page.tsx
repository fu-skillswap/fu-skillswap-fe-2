/**
 * @file page.tsx
 * @description Route Bảng tin cộng đồng Mentee (`/[locale]/dashboard`).
 */

import type { Mentor, Post } from '@/models/entities';
import { mentorRepo } from '@/repositories/mentorRepo';
import { postRepo } from '@/repositories/postRepo';
import { MenteeDashboardView } from '@/views/mentee/dashboard/MenteeDashboardView';

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  // A failed forum/mentor request (401, 5xx, network) must not take down the whole page:
  // fall back to empty lists and let the view render its empty state.
  let postsLoadFailed = false;
  const [{ locale }, posts, mentors] = await Promise.all([
    params,
    postRepo.list().catch((): Post[] => {
      postsLoadFailed = true;
      return [];
    }),
    mentorRepo.list({ page: 0, size: 3 }).catch((): Mentor[] => []),
  ]);

  return (
    <MenteeDashboardView
      locale={locale}
      posts={posts}
      mentors={mentors.slice(0, 3)}
      postsLoadFailed={postsLoadFailed}
    />
  );
}
