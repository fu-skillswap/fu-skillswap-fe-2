import type { Mentor } from '@/models/entities';

/**
 * Presentation-only records that fill the catalog represented in the Figma demo.
 * They are merged with repository mentors at the UI boundary and are not API data.
 */
export const demoMentors: Mentor[] = [
  {
    id: 'mentor-sarah-chen',
    name: 'Sarah Chen',
    headline: 'Senior Product Manager',
    organization: 'Google',
    expertise: ['Product Management', 'Career Coaching'],
    bio: 'Helping aspiring PMs turn their experience into clear, outcome-driven career stories.',
    rating: 4.9,
    reviewCount: 87,
    startingPrice: 150000,
    category: 'PM',
  },
  {
    id: 'mentor-david-nguyen',
    name: 'David Nguyen',
    headline: 'Staff Full Stack Engineer',
    organization: 'Stripe',
    expertise: ['React', 'System Design'],
    bio: 'Practical coaching for engineers preparing for senior technical interviews.',
    rating: 4.8,
    reviewCount: 62,
    startingPrice: 250000,
    category: 'Tech',
  },
  {
    id: 'mentor-linh-tran',
    name: 'Linh Tran',
    headline: 'UX Design Lead',
    organization: 'Figma',
    expertise: ['UX Design', 'Product Design'],
    bio: 'Helping designers build thoughtful portfolios and communicate their product decisions.',
    rating: 5,
    reviewCount: 43,
    startingPrice: 200000,
    category: 'Design',
  },
  {
    id: 'mentor-alex-kim',
    name: 'Alex Kim',
    headline: 'Principal Data Scientist',
    organization: 'Netflix',
    expertise: ['Machine Learning', 'Python'],
    bio: 'Data career guidance, portfolio reviews, and interview practice for analytics roles.',
    rating: 4.7,
    reviewCount: 55,
    startingPrice: 280000,
    category: 'Data',
  },
  {
    id: 'mentor-mai-phuong',
    name: 'Mai Phuong',
    headline: 'Marketing Director',
    organization: 'Grab',
    expertise: ['Growth Marketing', 'Brand Strategy'],
    bio: 'Strategic feedback for marketers looking to lead growth programs and teams.',
    rating: 4.8,
    reviewCount: 38,
    startingPrice: 220000,
    category: 'Marketing',
  },
  {
    id: 'mentor-tuan-hoang',
    name: 'Tuan Hoang',
    headline: 'Engineering Manager',
    organization: 'Meta',
    expertise: ['Leadership', 'Team Management'],
    bio: 'Support for new managers navigating career growth, feedback, and healthy engineering teams.',
    rating: 4.6,
    reviewCount: 29,
    startingPrice: 350000,
    category: 'Leadership',
  },
];

export const dashboardStories = [
  { id: 'story-kookoo', name: 'KooKoo AI', avatarUrl: '/images/Koko.png', isOfficial: true },
  { id: 'mentor-sarah-chen', name: 'Sarah Chen', avatarUrl: null },
  { id: 'mentor-alex-kim', name: 'Alex Kim', avatarUrl: null },
  { id: 'member-minh-duc', name: 'Minh Duc', avatarUrl: null },
  { id: 'member-thu-ha', name: 'Thu Ha', avatarUrl: null },
  { id: 'story-promo-event', name: 'SkillSwap Pro', avatarUrl: null, isAd: true },
];

export function mergeMentors(repositoryMentors: Mentor[], seededMentors = demoMentors) {
  return [
    ...repositoryMentors,
    ...seededMentors.filter((seed) => !repositoryMentors.some((mentor) => mentor.id === seed.id)),
  ];
}
