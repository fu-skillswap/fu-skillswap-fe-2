/**
 * @file page.tsx
 * @description Lịch đặt của mentor (`/[locale]/mentor/bookings`): buổi học viên đặt với mentor và
 * buổi mentor tự đặt với mentor khác (`?view=learning`).
 */

import { Suspense } from 'react';
import { MentorBookingsHub } from '@/views/mentor/bookings/MentorBookingsHub';

export default function MentorBookingsPage() {
  return (
    <Suspense fallback={null}>
      <MentorBookingsHub />
    </Suspense>
  );
}
