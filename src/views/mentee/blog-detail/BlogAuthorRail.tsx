/**
 * @file BlogAuthorRail.tsx
 * @description Cột phải trang đọc Blog: thẻ tác giả (đặt lịch, xem hồ sơ) và hàng nút Thích / Lưu / Link.
 * Kèm khối kêu gọi đặt lịch ở cuối bài viết.
 */

'use client';

import { authorInitials, blogSessionId, formatCount } from '@/components/domain/blog/blogFormat';
import { Button } from '@/components/ui/Button';
import type { BlogPostReaderDetailResponse } from '@/models/blog';
import { useAuth } from '@/providers/AuthProvider';
import { blogRepo } from '@/repositories/blogRepo';
import { showError, showSuccess, showWarning } from '@/utils/toast';
import { useQueryClient } from '@tanstack/react-query';
import { BadgeCheck, Bookmark, CalendarDays, Heart, Link2, Star } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const VIETNAMESE_DIACRITICS =
  /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;

/** Vietnamese names put the given name last ("Nguyễn Nguyệt Nhi" → "Nhi"). */
export function authorFirstName(displayName?: string | null) {
  const parts = displayName?.trim().split(/\s+/) ?? [];
  return parts[parts.length - 1] || 'Mentor';
}

function bookingHref(locale: string, mentorUserId: string) {
  return `/${locale}/mentor-booking?mentorId=${encodeURIComponent(mentorUserId)}`;
}

/**
 * The mentor profile lives on the booking route. A backend `profilePath` is used when it is a
 * site-relative path; it gets the locale prefix when it does not carry one yet.
 */
function profileHref(locale: string, mentorUserId: string, profilePath?: string | null) {
  const path = profilePath?.trim();
  if (path && path.startsWith('/') && !path.startsWith('//')) {
    return /^\/(vi|en)(\/|$)/.test(path) ? path : `/${locale}${path}`;
  }
  return bookingHref(locale, mentorUserId);
}

function useBookMentor(post: BlogPostReaderDetailResponse, locale: string) {
  const router = useRouter();
  const mentorUserId = post.authorConversion?.mentorUserId;
  return () => {
    if (!mentorUserId) return;
    blogRepo.recordAuthorCtaClick(post.id, blogSessionId(), 'BOOK_MENTOR').catch(() => {});
    router.push(bookingHref(locale, mentorUserId));
  };
}

function AuthorAvatar({ post, size }: { post: BlogPostReaderDetailResponse; size: number }) {
  const author = post.author;
  return (
    <span
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-light text-sm font-extrabold text-primary"
      style={{ width: size, height: size }}
    >
      {author?.avatarUrl ? (
        <img src={author.avatarUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        authorInitials(author?.displayName)
      )}
    </span>
  );
}

function AuthorCard({ post, locale }: { post: BlogPostReaderDetailResponse; locale: string }) {
  const author = post.author;
  const conversion = post.authorConversion;
  const mentorUserId = author?.authorType !== 'PLATFORM' ? conversion?.mentorUserId : undefined;
  const firstName = authorFirstName(author?.displayName);
  const rating = conversion?.averageRating ?? 0;
  const sessions = conversion?.completedSessions ?? 0;
  const hasTrackRecord = rating > 0 || sessions > 0;
  const bookMentor = useBookMentor(post, locale);
  // TODO(api): backend should send a Vietnamese primaryCtaLabel.
  const backendLabel = conversion?.primaryCtaLabel?.trim();
  const ctaLabel =
    backendLabel && VIETNAMESE_DIACRITICS.test(backendLabel)
      ? backendLabel
      : `Đặt lịch với ${firstName}`;

  return (
    <section
      className="rounded-[20px] border border-solid border-border-light bg-white p-5"
      aria-label="Tác giả"
    >
      <div className="flex items-center gap-3">
        <AuthorAvatar post={post} size={48} />
        <div className="min-w-0">
          <p className="m-0 flex items-center gap-1 text-[15px] font-bold text-text-main">
            <span className="truncate">{author?.displayName ?? 'SkillSwap'}</span>
            {conversion?.verifiedMentor && (
              <BadgeCheck
                className="h-4 w-4 shrink-0 text-primary"
                aria-label="Mentor đã xác minh"
              />
            )}
          </p>
          {conversion?.headline && (
            <p className="m-0 line-clamp-2 text-xs leading-5 text-text-muted">
              {conversion.headline}
            </p>
          )}
        </div>
      </div>

      {mentorUserId && (
        <>
          {hasTrackRecord ? (
            <p className="m-0 mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-text-secondary">
              {rating > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Star
                    className="h-3.5 w-3.5 text-warning"
                    fill="currentColor"
                    aria-hidden="true"
                  />
                  {rating.toFixed(1)}
                </span>
              )}
              {sessions > 0 && <span>{sessions} buổi đã hoàn thành</span>}
            </p>
          ) : (
            <p className="m-0 mt-3 flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
              Mentor mới trên SkillSwap
            </p>
          )}

          <Button type="button" className="mt-4 w-full" onClick={bookMentor}>
            {ctaLabel}
          </Button>
          <Link
            href={profileHref(locale, mentorUserId, conversion?.profilePath)}
            className="mt-1 flex min-h-11 items-center justify-center rounded-xl text-sm font-bold text-sky-800 no-underline hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Xem hồ sơ
          </Link>
        </>
      )}
    </section>
  );
}

const actionBase =
  'inline-flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-solid px-2 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60';
const actionIdle =
  'border-border-light bg-white text-text-secondary hover:border-primary-border hover:text-primary';
const actionActive = 'border-primary-border bg-primary-light text-primary';

function EngagementRow({ post, slug }: { post: BlogPostReaderDetailResponse; slug: string }) {
  const { isAuthenticated, user, showAuthRequiredModal } = useAuth();
  const queryClient = useQueryClient();
  const [pending, setPending] = useState<'like' | 'bookmark'>();

  const toggle = async (kind: 'like' | 'bookmark') => {
    if (!isAuthenticated) {
      showAuthRequiredModal(
        kind === 'like'
          ? 'Bạn cần đăng nhập để thích bài viết.'
          : 'Bạn cần đăng nhập để lưu bài viết.',
      );
      return;
    }
    setPending(kind);
    try {
      const active = kind === 'like' ? post.likedByCurrentUser : post.bookmarkedByCurrentUser;
      const result =
        kind === 'like'
          ? await (active ? blogRepo.unlike(post.id) : blogRepo.like(post.id))
          : await (active ? blogRepo.unbookmark(post.id) : blogRepo.bookmark(post.id));
      queryClient.setQueryData<BlogPostReaderDetailResponse>(
        ['blog-post', slug, user?.id ?? null],
        (current) => (current ? { ...current, ...result, id: current.id } : current),
      );
    } catch (reason) {
      showError(reason, {
        title: kind === 'like' ? 'Chưa thích được bài viết' : 'Chưa lưu được bài viết',
      });
    } finally {
      setPending(undefined);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showSuccess('Đã sao chép liên kết');
    } catch {
      showWarning('Chưa sao chép được liên kết. Bạn thử sao chép từ thanh địa chỉ nhé.');
    }
  };

  return (
    <div className="flex gap-2">
      <button
        type="button"
        aria-pressed={Boolean(post.likedByCurrentUser)}
        aria-label={`${post.likedByCurrentUser ? 'Bỏ thích' : 'Thích'} (${formatCount(post.likeCount)})`}
        disabled={pending !== undefined}
        onClick={() => void toggle('like')}
        className={`${actionBase} ${post.likedByCurrentUser ? actionActive : actionIdle}`}
      >
        <Heart
          className="h-4 w-4"
          fill={post.likedByCurrentUser ? 'currentColor' : 'none'}
          aria-hidden="true"
        />
        {formatCount(post.likeCount)}
      </button>
      <button
        type="button"
        aria-pressed={Boolean(post.bookmarkedByCurrentUser)}
        disabled={pending !== undefined}
        onClick={() => void toggle('bookmark')}
        className={`${actionBase} ${post.bookmarkedByCurrentUser ? actionActive : actionIdle}`}
      >
        <Bookmark
          className="h-4 w-4"
          fill={post.bookmarkedByCurrentUser ? 'currentColor' : 'none'}
          aria-hidden="true"
        />
        {post.bookmarkedByCurrentUser ? 'Đã lưu' : 'Lưu'}
      </button>
      <button
        type="button"
        aria-label="Sao chép liên kết bài viết"
        onClick={() => void copyLink()}
        className={`${actionBase} ${actionIdle}`}
      >
        <Link2 className="h-4 w-4" aria-hidden="true" />
        Link
      </button>
    </div>
  );
}

export function BlogAuthorRail({
  post,
  slug,
  locale,
}: {
  post: BlogPostReaderDetailResponse;
  slug: string;
  locale: string;
}) {
  return (
    <div className="space-y-3 lg:sticky lg:top-24">
      <AuthorCard post={post} locale={locale} />
      <EngagementRow post={post} slug={slug} />
    </div>
  );
}

/** End-of-article invitation to book the author; only for mentor authors. */
export function BlogAuthorCta({
  post,
  locale,
}: {
  post: BlogPostReaderDetailResponse;
  locale: string;
}) {
  const conversion = post.authorConversion;
  const bookMentor = useBookMentor(post, locale);
  if (post.author?.authorType === 'PLATFORM' || !conversion?.mentorUserId) return null;
  const firstName = authorFirstName(post.author?.displayName);

  return (
    <section
      aria-labelledby="blog-author-cta-title"
      className="mt-10 flex flex-col gap-4 rounded-[24px] border border-solid border-primary-border/60 bg-[linear-gradient(115deg,#f4faff_0%,#eef7ff_56%,#e8f4ff_100%)] p-5 sm:flex-row sm:items-start sm:p-6"
    >
      <AuthorAvatar post={post} size={64} />
      <div className="min-w-0 flex-1">
        <h2 id="blog-author-cta-title" className="m-0 text-lg font-extrabold text-text-main">
          Muốn {firstName} kèm bạn 1:1?
        </h2>
        {conversion.headline && (
          <p className="m-0 mt-1 line-clamp-1 text-sm text-text-secondary">{conversion.headline}</p>
        )}
        <Button
          type="button"
          className="mt-4"
          leftIcon={<CalendarDays className="h-4 w-4" aria-hidden="true" />}
          onClick={bookMentor}
        >
          Xem lịch trống của {firstName}
        </Button>
      </div>
    </section>
  );
}
