/**
 * @file BlogFeaturedCard.tsx
 * @description Thẻ bài nổi bật đầu trang Blog: ảnh bìa lớn bên trái (xếp chồng trên màn nhỏ),
 * tiêu đề, tóm tắt, tác giả và nút đọc bài.
 */

'use client';

import type { BlogPostReaderCardResponse } from '@/models/blog';
import Link from 'next/link';
import {
  BlogAuthorAvatar,
  BlogAuthorName,
  BlogCategoryPill,
  BlogCoverFallback,
  blogPostHref,
  blogPostMeta,
} from './BlogPostCard';

export function BlogFeaturedCard({
  post,
  locale,
}: {
  post: BlogPostReaderCardResponse;
  locale: string;
}) {
  const href = blogPostHref(locale, post);

  return (
    <article className="flex min-w-0 flex-col overflow-hidden rounded-[24px] border border-solid border-slate-200 bg-white transition-shadow hover:shadow-[0_12px_32px_rgba(16,50,90,0.08)] lg:flex-row">
      <Link
        href={href}
        tabIndex={-1}
        aria-hidden="true"
        className="block aspect-[16/9] overflow-hidden lg:aspect-auto lg:min-h-[280px] lg:flex-[1.3]"
      >
        {post.coverImageUrl ? (
          <img
            src={post.coverImageUrl}
            alt=""
            className="h-full w-full object-cover object-[40%_center]"
          />
        ) : (
          <BlogCoverFallback post={post} />
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-3 p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          {post.featured && (
            <span className="inline-flex items-center rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-white">
              Nổi bật
            </span>
          )}
          <BlogCategoryPill post={post} />
        </div>
        <h2 className="m-0 line-clamp-3 text-[23px] font-extrabold leading-tight tracking-[-0.01em]">
          <Link
            href={href}
            className="text-text-main no-underline hover:text-primary focus-visible:rounded focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
          >
            {post.title}
          </Link>
        </h2>
        {post.excerpt && (
          <p className="m-0 line-clamp-3 text-[15.5px] leading-relaxed text-slate-600">
            {post.excerpt}
          </p>
        )}

        <div className="flex-1" aria-hidden="true" />
        <div className="flex flex-wrap items-center gap-3">
          <BlogAuthorAvatar post={post} size={40} />
          <div className="min-w-0 flex-1">
            <BlogAuthorName post={post} className="text-sm" />
            <p className="m-0 truncate text-[13px] text-text-muted">{blogPostMeta(post)}</p>
          </div>
          <Link
            href={href}
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-primary px-4 text-sm font-bold text-white no-underline transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25"
          >
            Đọc bài
          </Link>
        </div>
      </div>
    </article>
  );
}

export function BlogFeaturedCardSkeleton() {
  return (
    <div
      className="flex flex-col overflow-hidden rounded-[24px] border border-solid border-slate-200 bg-white animate-pulse motion-reduce:animate-none lg:flex-row"
      aria-hidden="true"
    >
      <div className="aspect-[16/9] bg-surface-subtle lg:aspect-auto lg:min-h-[280px] lg:flex-[1.3]" />
      <div className="flex flex-1 flex-col gap-3 p-6">
        <span className="block h-5 w-28 rounded-full bg-surface-subtle" />
        <span className="block h-6 w-11/12 rounded bg-surface-subtle" />
        <span className="block h-6 w-2/3 rounded bg-surface-subtle" />
        <span className="block h-4 w-full rounded bg-surface-subtle" />
        <span className="block h-4 w-5/6 rounded bg-surface-subtle" />
      </div>
    </div>
  );
}
