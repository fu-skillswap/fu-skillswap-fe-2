import { MentorBookingView } from "@/views/mentee/mentor-booking/MentorBookingView";
import { mentorRepo } from "@/repositories/mentorRepo";

export default async function MentorBookingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const [{ locale }, mentors] = await Promise.all([params, mentorRepo.list()]);
  return <MentorBookingView mentors={mentors} locale={locale} />;
}
