/**
 * @file page.tsx
 * @description Default public landing route (`/[locale]`).
 */

import { mentorRepo } from '@/repositories/mentorRepo';
import type { Mentor } from '@/models/entities';
import { LandingView } from '@/views/landing/LandingView';

/** Enough mentors for the landing filter chips to have something to match against. */
const LANDING_MENTOR_FETCH_SIZE = 24;

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const [{ locale }, mentors] = await Promise.all([
    params,
    // Public endpoint; never let it break the landing render.
    mentorRepo.list({ page: 0, size: LANDING_MENTOR_FETCH_SIZE }).catch((): Mentor[] => []),
  ]);
  return <LandingView locale={locale} mentors={mentors} />;
}
