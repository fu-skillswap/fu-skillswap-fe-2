/**
 * @file BlogPostCard.tsx
 * @description Thẻ bài Blog trong danh sách: ảnh bìa, chuyên mục, tiêu đề, tóm tắt, tác giả, chỉ số.
 */

import type { BlogPostReaderCardResponse } from '@/models/blog';
import { BadgeCheck, Eye, Heart } from 'lucide-react';
import Link from 'next/link';
import { authorInitials, formatBlogDate, formatCount } from './blogFormat';

export function BlogPostCard({
  post,
  locale,
}: {
  post: BlogPostReaderCardResponse;
  locale: string;
}) {
  const category = post.categories?.[0]?.name;
  const author = post.author;
  const date = formatBlogDate(post.publishedAt ?? post.createdAt);

  return (
    <article className="group flex flex-col overflow-hidden rounded-[18px] border border-solid border-border-light bg-white shadow-[0_4px_16px_rgba(16,50,90,0.03)] transition-shadow hover:shadow-[0_8px_24px_rgba(16,50,90,0.08)]">
      <Link
        href={`/${locale}/blog/${encodeURIComponent(post.slug)}`}
        className="flex flex-1 flex-col text-inherit no-underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
      >
        <div className="aspect-[16/9] overflow-hidden bg-primary-light">
          {post.coverImageUrl ? (
            <img
              src={post.coverImageUrl}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02] motion-reduce:transition-none"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <img src="/images/Koko.png" alt="" className="h-16 w-16 object-contain opacity-60" />
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col p-4">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
            {category && (
              <span className="rounded-lg bg-primary-light px-2 py-0.5 text-primary">
                {category}
              </span>
            )}
            {post.featured && (
              <span className="rounded-lg bg-surface-subtle px-2 py-0.5 text-text-secondary">
                Nổi bật
              </span>
            )}
          </div>
          <h3 className="mb-0 mt-2 line-clamp-2 text-base font-extrabold leading-6 text-text-main group-hover:text-primary">
            {post.title}
          </h3>
          {post.excerpt && (
            <p className="mb-0 mt-1.5 line-clamp-3 text-[13px] leading-5 text-text-secondary">
              {post.excerpt}
            </p>
          )}

          <div className="min-h-3 flex-1" aria-hidden="true" />
          <div className="flex items-center gap-2.5 border-0 border-t border-solid border-border-light pt-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-light text-[11px] font-extrabold text-primary">
              {author?.avatarUrl ? (
                <img src={author.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                authorInitials(author?.displayName)
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="m-0 flex items-center gap-1 truncate text-xs font-bold text-text-main">
                <span className="truncate">{author?.displayName ?? 'SkillSwap'}</span>
                {post.authorConversion?.verifiedMentor && (
                  <BadgeCheck
                    className="h-3.5 w-3.5 shrink-0 text-primary"
                    aria-label="Mentor đã xác minh"
                  />
                )}
              </p>
              <p className="m-0 text-[11px] text-text-muted">
                {date}
                {post.readingTimeMinutes ? ` · ${post.readingTimeMinutes} phút đọc` : ''}
              </p>
            </div>
            <span className="flex shrink-0 items-center gap-2.5 text-[11px] text-text-muted">
              <span className="flex items-center gap-1" title="Lượt xem">
                <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="sr-only">Lượt xem: </span>
                {formatCount(post.viewCount)}
              </span>
              <span className="flex items-center gap-1" title="Lượt thích">
                <Heart className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="sr-only">Lượt thích: </span>
                {formatCount(post.likeCount)}
              </span>
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}

export function BlogPostCardSkeleton() {
  return (
    <div
      className="overflow-hidden rounded-[18px] border border-solid border-border-light bg-white animate-pulse motion-reduce:animate-none"
      aria-hidden="true"
    >
      <div className="aspect-[16/9] bg-surface-subtle" />
      <div className="space-y-2.5 p-4">
        <span className="block h-4 w-16 rounded-lg bg-surface-subtle" />
        <span className="block h-4 w-11/12 rounded bg-surface-subtle" />
        <span className="block h-3 w-full rounded bg-surface-subtle" />
        <span className="block h-3 w-2/3 rounded bg-surface-subtle" />
        <span className="mt-4 flex items-center gap-2.5 border-t border-solid border-border-light pt-3">
          <span className="h-8 w-8 rounded-full bg-surface-subtle" />
          <span className="h-3 w-24 rounded bg-surface-subtle" />
        </span>
      </div>
    </div>
  );
}
