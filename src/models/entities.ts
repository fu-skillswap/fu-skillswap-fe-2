/**
 * @file entities.ts
 * @description Định nghĩa các Thực thể miền nghiệp vụ (Domain Entities) trong ứng dụng SkillSwap.
 * Bao gồm Người dùng (User), Bài viết (Post), Chuyên gia (Mentor), Dịch vụ Mentor (MentorService),
 * Lịch hẹn (Booking) và Bình luận (Comment).
 */

/** Vai trò người dùng giao diện (UI Role) */
export type Role = 'mentee' | 'mentor' | 'admin' | 'sysadmin';

/** Thực thể Người dùng cơ bản */
export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string;
}

/** Thực thể Bài viết thảo luận / Hỏi đáp kỹ năng */
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

/** Thực thể Chuyên gia / Mentor hỗ trợ kỹ năng */
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

/** Thực thể Gói Dịch vụ Mentoring do Mentor cung cấp */
export interface MentorService {
  id: string;
  mentorId: string;
  name: string;
  description: string;
  durationMinutes: number;
  priceScoins?: number;
  completedCount?: number;
}

/** Thực thể Lịch hẹn Mentoring giữa Mentee và Mentor */
export interface Booking {
  id: string;
  mentorId: string;
  menteeId: string;
  startsAt: string;
  status: 'pending' | 'confirmed' | 'cancelled';
}

/** Thực thể Bình luận trên bài viết */
export interface Comment {
  id: string;
  authorName: string;
  content: string;
  createdAt: string;
}
