/**
 * @file BlogPostCard.tsx
 * @description Thẻ bài Blog trong danh sách: ảnh bìa (hoặc nền theo chuyên mục), chuyên mục,
 * tiêu đề, tóm tắt, tác giả và nút lưu bài.
 */

'use client';

import type { BlogCursorPage, BlogPostReaderCardResponse } from '@/models/blog';
import { useAuth } from '@/providers/AuthProvider';
import { blogRepo } from '@/repositories/blogRepo';
import { showError } from '@/utils/toast';
import { useQueryClient, type InfiniteData } from '@tanstack/react-query';
import {
  BadgeCheck,
  Bookmark,
  BookOpen,
  Compass,
  FileText,
  PanelsTopLeft,
  PenTool,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { authorInitials, formatBlogDate } from './blogFormat';

interface CategoryVisual {
  icon: LucideIcon;
  /** Cover gradient (tint → white). */
  cover: string;
  iconClass: string;
  pillClass: string;
}

const TINTS = {
  blue: {
    cover: 'bg-[linear-gradient(135deg,#DBEAFE,#F5F9FF)]',
    iconClass: 'text-blue-400',
    pillClass: 'bg-[#DBEAFE] text-blue-700',
  },
  green: {
    cover: 'bg-[linear-gradient(135deg,#D1FAE5,#F3FCF8)]',
    iconClass: 'text-emerald-400',
    pillClass: 'bg-[#D1FAE5] text-emerald-700',
  },
  orange: {
    cover: 'bg-[linear-gradient(135deg,#FFEDD5,#FFF9F2)]',
    iconClass: 'text-orange-400',
    pillClass: 'bg-[#FFEDD5] text-orange-700',
  },
  violet: {
    cover: 'bg-[linear-gradient(135deg,#EDE9FE,#FAF8FF)]',
    iconClass: 'text-violet-400',
    pillClass: 'bg-[#EDE9FE] text-violet-700',
  },
};

/** Icon and tint for a post's first category, matched by code, slug or name. */
export function blogCategoryVisual(post: BlogPostReaderCardResponse): CategoryVisual {
  const category = post.categories?.[0];
  const key = [category?.code, category?.slug, category?.name].join(' ').toLowerCase();
  if (/học tập|hoc-tap|hoc_tap|study|learning/.test(key)) {
    return { icon: BookOpen, ...TINTS.green };
  }
  if (/định hướng|nghề nghiệp|dinh-huong|career/.test(key)) {
    return { icon: Compass, ...TINTS.blue };
  }
  if (/dự án|du-an|du_an|project/.test(key)) {
    return { icon: PanelsTopLeft, ...TINTS.orange };
  }
  if (/ui\s*\/\s*ux|ui-ux|ui_ux|uiux|design/.test(key)) {
    return { icon: PenTool, ...TINTS.violet };
  }
  return { icon: FileText, ...TINTS.blue };
}

export function blogPostHref(locale: string, post: BlogPostReaderCardResponse) {
  return `/${locale}/blog/${encodeURIComponent(post.slug)}`;
}

/** Category-tinted cover used when a post has no cover image. */
export function BlogCoverFallback({
  post,
  className = '',
}: {
  post: BlogPostReaderCardResponse;
  className?: string;
}) {
  const visual = blogCategoryVisual(post);
  const Icon = visual.icon;
  return (
    <div className={`flex h-full w-full items-center justify-center ${visual.cover} ${className}`}>
      <Icon className={`h-16 w-16 ${visual.iconClass}`} strokeWidth={1.5} aria-hidden="true" />
    </div>
  );
}

export function BlogCategoryPill({ post }: { post: BlogPostReaderCardResponse }) {
  const name = post.categories?.[0]?.name;
  if (!name) return null;
  return (
    <span
      className={`inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${blogCategoryVisual(post).pillClass}`}
    >
      {name}
    </span>
  );
}

export function BlogAuthorAvatar({
  post,
  size,
}: {
  post: BlogPostReaderCardResponse;
  size: 36 | 40 | 44;
}) {
  const author = post.author;
  const sizeClass = size === 36 ? 'h-9 w-9' : size === 40 ? 'h-10 w-10' : 'h-11 w-11';
  return (
    <span
      className={`flex ${sizeClass} shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-light text-xs font-extrabold text-primary`}
    >
      {author?.avatarUrl ? (
        <img src={author.avatarUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        authorInitials(author?.displayName)
      )}
    </span>
  );
}

export function BlogAuthorName({
  post,
  className = '',
}: {
  post: BlogPostReaderCardResponse;
  className?: string;
}) {
  return (
    <span className={`flex min-w-0 items-center gap-1 font-bold text-text-main ${className}`}>
      <span className="truncate">{post.author?.displayName ?? 'SkillSwap'}</span>
      {post.authorConversion?.verifiedMentor && (
        <BadgeCheck className="h-4 w-4 shrink-0 text-primary" aria-label="Mentor đã xác minh" />
      )}
    </span>
  );
}

export function blogPostMeta(post: BlogPostReaderCardResponse) {
  const date = formatBlogDate(post.publishedAt ?? post.createdAt);
  const minutes = post.readingTimeMinutes ? `${post.readingTimeMinutes} phút đọc` : '';
  return [date, minutes].filter(Boolean).join(' · ');
}

type FeedData = InfiniteData<BlogCursorPage<BlogPostReaderCardResponse>>;

function BookmarkButton({ post }: { post: BlogPostReaderCardResponse }) {
  const { isAuthenticated, showAuthRequiredModal } = useAuth();
  const queryClient = useQueryClient();
  const [bookmarked, setBookmarked] = useState(Boolean(post.bookmarkedByCurrentUser));
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => setBookmarked(Boolean(post.bookmarkedByCurrentUser)), [post]);

  const toggle = async () => {
    if (!isAuthenticated) {
      showAuthRequiredModal('Bạn cần đăng nhập để lưu bài viết.');
      return;
    }
    setIsSaving(true);
    try {
      const result = bookmarked
        ? await blogRepo.unbookmark(post.id)
        : await blogRepo.bookmark(post.id);
      setBookmarked(result.bookmarkedByCurrentUser);
      queryClient.setQueriesData<FeedData>({ queryKey: ['blog-posts'] }, (data) =>
        data?.pages
          ? {
              ...data,
              pages: data.pages.map((page) => ({
                ...page,
                items: page.items.map((item) =>
                  item.id === result.postId
                    ? {
                        ...item,
                        bookmarkedByCurrentUser: result.bookmarkedByCurrentUser,
                        bookmarkCount: result.bookmarkCount,
                        likedByCurrentUser: result.likedByCurrentUser,
                        likeCount: result.likeCount,
                      }
                    : item,
                ),
              })),
            }
          : data,
      );
    } catch (reason) {
      showError(reason, { title: 'Không thể lưu bài viết', description: 'Vui lòng thử lại.' });
    } finally {
      setIsSaving(false);
    }
  };

  const label = bookmarked ? 'Bỏ lưu' : 'Lưu bài';
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={bookmarked}
      disabled={isSaving}
      onClick={() => void toggle()}
      className={`flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border-0 bg-transparent transition-colors hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-wait ${
        bookmarked ? 'text-primary' : 'text-text-muted hover:text-primary'
      }`}
    >
      <Bookmark
        className={`h-[18px] w-[18px] ${bookmarked ? 'fill-current' : ''}`}
        aria-hidden="true"
      />
    </button>
  );
}

export function BlogPostCard({
  post,
  locale,
}: {
  post: BlogPostReaderCardResponse;
  locale: string;
}) {
  const href = blogPostHref(locale, post);

  return (
    <article className="flex flex-col overflow-hidden rounded-[20px] border border-solid border-slate-200 bg-white transition-shadow hover:shadow-[0_10px_28px_rgba(16,50,90,0.08)]">
      {/* The title link is the accessible one; the cover duplicates it for pointer users. */}
      <Link
        href={href}
        tabIndex={-1}
        aria-hidden="true"
        className="block aspect-[16/9] overflow-hidden"
      >
        {post.coverImageUrl ? (
          <img
            src={post.coverImageUrl}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <BlogCoverFallback post={post} />
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2.5 p-[18px]">
        <BlogCategoryPill post={post} />
        <h3 className="m-0 line-clamp-3 text-lg font-extrabold leading-snug">
          <Link
            href={href}
            className="text-text-main no-underline hover:text-primary focus-visible:rounded focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
          >
            {post.title}
          </Link>
        </h3>
        {post.excerpt && (
          <p className="m-0 line-clamp-2 text-[14.5px] leading-relaxed text-slate-600">
            {post.excerpt}
          </p>
        )}

        <div className="flex-1" aria-hidden="true" />
        <div className="flex items-center gap-2.5 pt-1">
          <BlogAuthorAvatar post={post} size={36} />
          <div className="min-w-0 flex-1">
            <BlogAuthorName post={post} className="text-sm" />
            <p className="m-0 truncate text-[13px] text-text-muted">{blogPostMeta(post)}</p>
          </div>
          <BookmarkButton post={post} />
        </div>
      </div>
    </article>
  );
}

export function BlogPostCardSkeleton() {
  return (
    <div
      className="overflow-hidden rounded-[20px] border border-solid border-slate-200 bg-white animate-pulse motion-reduce:animate-none"
      aria-hidden="true"
    >
      <div className="aspect-[16/9] bg-surface-subtle" />
      <div className="flex flex-col gap-2.5 p-[18px]">
        <span className="block h-5 w-20 rounded-full bg-surface-subtle" />
        <span className="block h-5 w-11/12 rounded bg-surface-subtle" />
        <span className="block h-5 w-3/4 rounded bg-surface-subtle" />
        <span className="block h-3.5 w-full rounded bg-surface-subtle" />
        <span className="mt-2 flex items-center gap-2.5">
          <span className="h-9 w-9 rounded-full bg-surface-subtle" />
          <span className="flex-1 space-y-1.5">
            <span className="block h-3 w-24 rounded bg-surface-subtle" />
            <span className="block h-3 w-32 rounded bg-surface-subtle" />
          </span>
          <span className="h-10 w-10 rounded-xl bg-surface-subtle" />
        </span>
      </div>
    </div>
  );
}
