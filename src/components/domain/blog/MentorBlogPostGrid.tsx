/**
 * @file MentorBlogPostGrid.tsx
 * @description Lưới bài Blog đã xuất bản của một Mentor (dùng ở hồ sơ Mentor và Hồ sơ của tôi),
 * kèm trạng thái đang tải, lỗi và chưa có bài.
 */

import type { BlogPostReaderCardResponse } from '@/models/blog';
import type { ReactNode } from 'react';
import { BlogPostCard, BlogPostCardSkeleton } from './BlogPostCard';

interface MentorBlogPostGridProps {
  posts: BlogPostReaderCardResponse[];
  locale: string;
  isLoading?: boolean;
  isError?: boolean;
  emptyText: string;
  /** Extra content under the empty message (e.g. a "write a post" button). */
  emptyAction?: ReactNode;
}

export function MentorBlogPostGrid({
  posts,
  locale,
  isLoading,
  isError,
  emptyText,
  emptyAction,
}: MentorBlogPostGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2" aria-busy="true">
        <BlogPostCardSkeleton />
        <BlogPostCardSkeleton />
        <span className="sr-only" role="status">
          Đang tải bài viết…
        </span>
      </div>
    );
  }

  if (isError) {
    return (
      <p className="m-0 rounded-2xl border border-solid border-border-light bg-white p-6 text-sm text-text-secondary">
        Chưa tải được bài viết, vui lòng thử lại sau.
      </p>
    );
  }

  if (!posts.length) {
    return (
      <div className="rounded-2xl border border-solid border-border-light bg-white p-6 text-sm text-text-secondary">
        <p className="m-0">{emptyText}</p>
        {emptyAction && <div className="mt-4">{emptyAction}</div>}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {posts.map((post) => (
        <BlogPostCard key={post.id} post={post} locale={locale} />
      ))}
    </div>
  );
}
