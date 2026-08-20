/**
 * @file page.tsx
 * @description Route Tìm kiếm & Đặt lịch Mentor (`/[locale]/mentor-booking`).
 * Truy xuất danh sách Mentor từ `mentorRepo` và truyền dữ liệu cho `MentorBookingView`.
 */

import { MentorBookingView } from "@/views/mentee/mentor-booking/MentorBookingView";
import { mentorRepo } from "@/repositories/mentorRepo";

/**
 * Server Component cho trang Tìm Mentor & Đặt lịch.
 */
export default async function MentorBookingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const [{ locale }, mentors] = await Promise.all([params, mentorRepo.list()]);
  return <MentorBookingView mentors={mentors} locale={locale} />;
}
