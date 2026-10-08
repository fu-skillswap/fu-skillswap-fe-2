/**
 * @file blog.ts
 * @description Kiểu dữ liệu Blog phía người đọc (danh sách, chi tiết, tương tác).
 */

import type { BlogCategoryResponse, BlogTagResponse } from './auth';

export interface BlogAuthorResponse {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
  authorType?: 'MENTOR' | 'PLATFORM';
}

/** Mentor data shown next to a post to lead readers to booking. */
export interface BlogAuthorConversionResponse {
  mentorUserId?: string | null;
  headline?: string | null;
  verifiedMentor?: boolean;
  averageRating?: number | null;
  completedSessions?: number | null;
  primaryCtaLabel?: string | null;
  profilePath?: string | null;
}

export interface BlogPostReaderCardResponse {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  coverImageUrl?: string | null;
  author?: BlogAuthorResponse | null;
  authorConversion?: BlogAuthorConversionResponse | null;
  categories?: BlogCategoryResponse[];
  tags?: BlogTagResponse[];
  readingTimeMinutes?: number | null;
  viewCount?: number;
  likeCount?: number;
  bookmarkCount?: number;
  likedByCurrentUser?: boolean;
  bookmarkedByCurrentUser?: boolean;
  featured?: boolean;
  publishedAt?: string | null;
  lastPublishedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface BlogPostReaderDetailResponse extends BlogPostReaderCardResponse {
  contentMarkdown?: string | null;
  ogImageUrl?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  canonicalUrl?: string | null;
}

/** Cursor page: pass `nextCursor` back as-is, never decode or build it. */
export interface BlogCursorPage<T> {
  items: T[];
  nextCursor?: string | null;
  hasNext: boolean;
  limit?: number;
}

export interface BlogEngagementMutationResponse {
  postId: string;
  likedByCurrentUser: boolean;
  bookmarkedByCurrentUser: boolean;
  likeCount: number;
  bookmarkCount: number;
}

export interface BlogPostListParams {
  cursor?: string;
  limit?: number;
  categoryId?: string;
  tagId?: string;
  keyword?: string;
}
