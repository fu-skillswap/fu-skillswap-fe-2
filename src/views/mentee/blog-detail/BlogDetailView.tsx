/**
 * @file BlogDetailView.tsx
 * @description Trang đọc bài Blog: nội dung Markdown, thích / lưu bài, thẻ tác giả dẫn tới đặt lịch
 * và bài viết liên quan. Tải ở trình duyệt để bài dành cho người đã đăng nhập dùng được token.
 */

'use client';

import { BlogMarkdown } from '@/components/domain/blog/BlogMarkdown';
import { BlogPostCard } from '@/components/domain/blog/BlogPostCard';
import {
  authorInitials,
  blogSessionId,
  formatBlogDate,
  formatCount,
} from '@/components/domain/blog/blogFormat';
import { useMenteeShell } from '@/components/domain/mentee-shell/MenteeShell';
import { Button } from '@/components/ui/Button';
import { ApiClientError } from '@/models/apiClient';
import type { BlogPostReaderDetailResponse } from '@/models/blog';
import { useAuth } from '@/providers/AuthProvider';
import { blogRepo } from '@/repositories/blogRepo';
import { showError } from '@/utils/toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, BadgeCheck, Bookmark, Eye, Heart, Star } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const actionBase =
  'inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-solid px-3.5 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60';
const actionIdle =
  'border-border-light bg-white text-text-secondary hover:border-primary-border hover:text-primary';
const actionActive = 'border-primary-border bg-primary-light text-primary';

export function BlogDetailView({ slug, locale }: { slug: string; locale: string }) {
  const { setHeaderTitle } = useMenteeShell();
  const { user, isBootstrapping } = useAuth();
  const listHref = `/${locale}/blog`;

  const post = useQuery({
    queryKey: ['blog-post', slug, user?.id ?? null],
    queryFn: () => blogRepo.detail(slug),
    enabled: !isBootstrapping,
    retry: (count, error) =>
      !(error instanceof ApiClientError && error.status >= 400 && error.status < 500) && count < 2,
  });

  const related = useQuery({
    queryKey: ['blog-related', slug],
    queryFn: () => blogRepo.related(slug, 3),
    enabled: post.isSuccess,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    setHeaderTitle('Blog');
    return () => setHeaderTitle(undefined);
  }, [setHeaderTitle]);

  // One view event per post per tab; the backend also deduplicates by session.
  const viewedRef = useRef<string | undefined>(undefined);
  const postId = post.data?.id;
  useEffect(() => {
    if (!postId || viewedRef.current === postId) return;
    viewedRef.current = postId;
    blogRepo.recordView(postId, blogSessionId()).catch(() => {});
  }, [postId]);

  if (post.isPending) return <DetailSkeleton />;

  if (post.isError || !post.data) {
    const status = post.error instanceof ApiClientError ? post.error.status : undefined;
    const isNotFound = status === 404 || status === 403 || status === 401;
    return (
      <section className="mx-auto flex max-w-3xl flex-col items-center rounded-3xl border border-solid border-border-light bg-white px-6 py-14 text-center">
        <img src="/images/Koko.png" alt="" className="h-16 w-16 object-contain opacity-80" />
        <h1 className="m-0 mt-3 text-lg font-extrabold text-text-main">
          {isNotFound ? 'Không tìm thấy bài viết' : 'Chưa tải được bài viết'}
        </h1>
        <p className="m-0 mt-1 max-w-sm text-sm text-text-secondary">
          {isNotFound
            ? 'Bài viết có thể đã bị gỡ, chưa xuất bản hoặc chỉ dành cho thành viên đã đăng nhập / đã đặt lịch với Mentor.'
            : 'Kết nối có thể đang chập chờn. Bạn thử tải lại nhé.'}
        </p>
        <div className="mt-4 flex gap-2">
          {!isNotFound && (
            <Button type="button" variant="outline" size="sm" onClick={() => void post.refetch()}>
              Thử lại
            </Button>
          )}
          <Link href={listHref} className="no-underline">
            <span className="inline-flex h-9 items-center rounded-xl bg-primary px-3.5 text-sm font-bold text-white">
              Về trang Blog
            </span>
          </Link>
        </div>
      </section>
    );
  }

  const data = post.data;
  const relatedPosts = (related.data ?? []).filter((item) => item.id !== data.id);

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        href={listHref}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-text-secondary no-underline hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Tất cả bài viết
      </Link>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <article className="min-w-0 overflow-hidden rounded-3xl border border-solid border-border-light bg-white">
          {data.coverImageUrl && (
            <img
              src={data.coverImageUrl}
              alt=""
              className="aspect-[16/7] w-full bg-primary-light object-cover"
            />
          )}
          <div className="p-5 sm:p-8">
            {data.categories && data.categories.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {data.categories.map((category) => (
                  <span
                    key={category.id}
                    className="rounded-lg bg-primary-light px-2 py-0.5 text-[11px] font-bold text-primary"
                  >
                    {category.name}
                  </span>
                ))}
              </div>
            )}
            <h1 className="m-0 text-2xl font-extrabold leading-tight text-text-main sm:text-[30px]">
              {data.title}
            </h1>
            <p className="m-0 mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted">
              <span className="font-bold text-text-secondary">
                {data.author?.displayName ?? 'SkillSwap'}
              </span>
              <span>{formatBlogDate(data.publishedAt ?? data.createdAt)}</span>
              {data.readingTimeMinutes ? <span>{data.readingTimeMinutes} phút đọc</span> : null}
              <span className="inline-flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                {formatCount(data.viewCount)} lượt xem
              </span>
            </p>

            {data.excerpt && (
              <p className="mb-0 mt-5 text-base font-semibold leading-7 text-text-main">
                {data.excerpt}
              </p>
            )}

            {data.contentMarkdown?.trim() ? (
              <BlogMarkdown content={data.contentMarkdown} />
            ) : (
              <p className="text-sm text-text-muted">Bài viết chưa có nội dung.</p>
            )}

            {data.tags && data.tags.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {data.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="rounded-lg bg-surface-subtle px-2 py-0.5 text-xs font-bold text-text-secondary"
                  >
                    #{tag.name}
                  </span>
                ))}
              </div>
            )}

            <EngagementBar post={data} slug={slug} />
          </div>
        </article>

        <aside className="space-y-5">
          <AuthorCard post={data} locale={locale} />
        </aside>
      </div>

      {relatedPosts.length > 0 && (
        <section className="mt-8" aria-labelledby="blog-related-title">
          <h2 id="blog-related-title" className="m-0 mb-3 text-lg font-extrabold text-text-main">
            Bài viết liên quan
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {relatedPosts.map((item) => (
              <BlogPostCard key={item.id} post={item} locale={locale} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function EngagementBar({ post, slug }: { post: BlogPostReaderDetailResponse; slug: string }) {
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

  return (
    <div className="mt-8 flex flex-wrap gap-2 border-0 border-t border-solid border-border-light pt-5">
      <button
        type="button"
        aria-pressed={Boolean(post.likedByCurrentUser)}
        disabled={pending !== undefined}
        onClick={() => void toggle('like')}
        className={`${actionBase} ${post.likedByCurrentUser ? actionActive : actionIdle}`}
      >
        <Heart
          className="h-4 w-4"
          fill={post.likedByCurrentUser ? 'currentColor' : 'none'}
          aria-hidden="true"
        />
        {post.likedByCurrentUser ? 'Đã thích' : 'Thích'} · {formatCount(post.likeCount)}
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
        {post.bookmarkedByCurrentUser ? 'Đã lưu' : 'Lưu bài'}
      </button>
    </div>
  );
}

function AuthorCard({ post, locale }: { post: BlogPostReaderDetailResponse; locale: string }) {
  const router = useRouter();
  const author = post.author;
  const conversion = post.authorConversion;
  const mentorUserId = conversion?.mentorUserId;

  return (
    <section
      className="rounded-3xl border border-solid border-border-light bg-white p-5 lg:sticky lg:top-24"
      aria-label="Tác giả"
    >
      <p className="m-0 text-[11px] font-bold uppercase tracking-wide text-text-muted">Tác giả</p>
      <div className="mt-3 flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-light text-sm font-extrabold text-primary">
          {author?.avatarUrl ? (
            <img src={author.avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            authorInitials(author?.displayName)
          )}
        </span>
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
            <p className="m-0 line-clamp-2 text-xs text-text-secondary">{conversion.headline}</p>
          )}
        </div>
      </div>

      {(conversion?.averageRating || conversion?.completedSessions) && (
        <p className="m-0 mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-text-secondary">
          {conversion.averageRating ? (
            <span className="inline-flex items-center gap-1">
              <Star className="h-3.5 w-3.5 text-warning" fill="currentColor" aria-hidden="true" />
              {conversion.averageRating.toFixed(1)}
            </span>
          ) : null}
          {conversion.completedSessions ? (
            <span>{conversion.completedSessions} buổi đã hoàn thành</span>
          ) : null}
        </p>
      )}

      {author?.authorType !== 'PLATFORM' && mentorUserId && (
        <Button
          type="button"
          className="mt-4 w-full"
          onClick={() => {
            blogRepo.recordAuthorCtaClick(post.id, blogSessionId(), 'BOOK_MENTOR').catch(() => {});
            router.push(`/${locale}/mentor-booking?mentorId=${encodeURIComponent(mentorUserId)}`);
          }}
        >
          {conversion?.primaryCtaLabel?.trim() || 'Đặt lịch với Mentor'}
        </Button>
      )}
    </section>
  );
}

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse motion-reduce:animate-none" aria-busy="true">
      <span className="mb-4 block h-4 w-32 rounded bg-surface-subtle" />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="rounded-3xl border border-solid border-border-light bg-white p-8">
          <span className="block h-7 w-3/4 rounded bg-surface-subtle" />
          <span className="mt-3 block h-3 w-1/3 rounded bg-surface-subtle" />
          {Array.from({ length: 6 }, (_, index) => (
            <span key={index} className="mt-4 block h-3 w-full rounded bg-surface-subtle" />
          ))}
        </div>
        <div className="h-40 rounded-3xl border border-solid border-border-light bg-white" />
      </div>
      <span className="sr-only" role="status">
        Đang tải bài viết…
      </span>
    </div>
  );
}
