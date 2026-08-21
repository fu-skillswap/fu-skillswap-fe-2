export type Role = 'mentee' | 'mentor' | 'admin' | 'sysadmin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  author: Pick<User, 'id' | 'name'>;
  tags: string[];
  createdAt: string;
  likes: number;
  mediaUrl?: string;
  commentCount?: number;
  previewComments?: Comment[];
  showMascot?: boolean;
  showTitle?: boolean;
}

export interface Mentor {
  id: string;
  name: string;
  expertise: string[];
  bio: string;
  rating: number;
  headline?: string;
  organization?: string;
  reviewCount?: number;
  startingPrice?: number;
  category?: 'PM' | 'Tech' | 'Design' | 'Data' | 'Marketing' | 'Leadership';
}

export interface MentorService {
  id: string;
  mentorId: string;
  name: string;
  description: string;
  durationMinutes: number;
  priceScoins?: number;
  completedCount?: number;
}

export interface Booking {
  id: string;
  mentorId: string;
  menteeId: string;
  startsAt: string;
  status: 'pending' | 'confirmed' | 'cancelled';
}

export interface Comment {
  id: string;
  authorName: string;
  content: string;
  createdAt: string;
}
