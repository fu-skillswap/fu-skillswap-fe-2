import type { Mentor, MentorService } from '@/models/entities';

/** Presentation-only service records matching the Figma mentor profile prototype. */
export const demoMentorServices: MentorService[] = [
  {
    id: 'service-sarah-cv-review',
    mentorId: 'mentor-sarah-chen',
    name: 'CV Review',
    description: 'Deep dive into your resume with actionable edits and rewrite suggestions.',
    durationMinutes: 30,
    priceScoins: 150000,
    completedCount: 214,
  },
  {
    id: 'service-sarah-mock-interview',
    mentorId: 'mentor-sarah-chen',
    name: 'Mock Interview',
    description: 'Full PM interview simulation with instant feedback and scoring rubric.',
    durationMinutes: 60,
    priceScoins: 300000,
    completedCount: 189,
  },
  {
    id: 'service-sarah-career-strategy',
    mentorId: 'mentor-sarah-chen',
    name: 'Career Strategy',
    description: 'Map your path to a PM role with a tailored 3-month action plan.',
    durationMinutes: 45,
    priceScoins: 250000,
    completedCount: 97,
  },
  {
    id: 'service-sarah-portfolio-review',
    mentorId: 'mentor-sarah-chen',
    name: 'Portfolio Review',
    description: 'Review your product case studies and advise on storytelling and impact.',
    durationMinutes: 45,
    priceScoins: 200000,
    completedCount: 76,
  },
];

export function getMentorServices(mentor: Mentor): MentorService[] {
  const seededServices = demoMentorServices.filter((service) => service.mentorId === mentor.id);
  if (seededServices.length) return seededServices;
  return mentor.expertise.map((skill) => ({
    id: `service-${mentor.id}-${skill.toLocaleLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    mentorId: mentor.id,
    name: `${skill} Consultation`,
    description: mentor.bio,
    durationMinutes: 30,
    priceScoins: mentor.startingPrice,
  }));
}
