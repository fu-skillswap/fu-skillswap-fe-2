/**
 * @file BlogDetailView.tsx
 * @description Trang đọc bài Blog: khối tiêu đề, ảnh bìa, lưới đọc (mục lục · bài viết · cột tác giả)
 * và bài viết liên quan. Tải ở trình duyệt để bài dành cho người đã đăng nhập dùng được token.
 */

'use client';

import {
  BlogMarkdown,
  extractToc,
  removeLeadingTitleEcho,
} from '@/components/domain/blog/BlogMarkdown';
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
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, BadgeCheck } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { BlogAuthorCta, BlogAuthorRail } from './BlogAuthorRail';
import { BlogToc, BlogTocMobile } from './BlogToc';

// Three reading columns need ~1100px of content width next to the 256px app sidebar.
const READING_GRID =
  'grid grid-cols-1 gap-y-8 lg:grid-cols-[minmax(0,1fr)_250px] lg:gap-x-2 min-[1380px]:grid-cols-[200px_minmax(0,760px)_250px] min-[1380px]:justify-center';

export function BlogDetailView({ slug, locale }: { slug: string; locale: string }) {
  const { setHeaderTitle } = useMenteeShell();
  const { user, isBootstrapping } = useAuth();
  const listHref = `/${locale}/blog`;
  const articleRef = useRef<HTMLElement>(null);

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
  const content = data.contentMarkdown ?? '';
  const tocItems = extractToc(removeLeadingTitleEcho(content, data.title, data.excerpt));

  return (
    <div className="mx-auto w-full max-w-[1280px]">
      <Link
        href={listHref}
        className="mb-6 inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-text-secondary no-underline hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Tất cả bài viết
      </Link>

      <TitleBlock post={data} />

      {data.coverImageUrl && (
        <img
          src={data.coverImageUrl}
          alt={data.title}
          className="mx-auto mt-8 block aspect-[16/7] w-full max-w-[820px] rounded-[20px] bg-primary-light object-cover"
        />
      )}

      <div className={`mt-10 ${READING_GRID}`}>
        <div className="hidden min-[1380px]:col-start-1 min-[1380px]:row-start-1 min-[1380px]:block">
          <BlogToc items={tocItems} articleRef={articleRef} />
        </div>

        <div className="min-w-0 lg:col-start-1 lg:row-start-1 lg:px-10 min-[1380px]:col-start-2">
          <BlogTocMobile items={tocItems} />
          <article ref={articleRef} className="mx-auto max-w-[680px]">
            {content.trim() ? (
              <BlogMarkdown
                content={content}
                title={data.title}
                excerpt={data.excerpt}
                variant="reader"
              />
            ) : (
              <p className="text-sm text-text-muted">Bài viết chưa có nội dung.</p>
            )}

            {data.tags && data.tags.length > 0 && (
              <ul className="m-0 mt-8 flex list-none flex-wrap gap-2 p-0" aria-label="Thẻ">
                {data.tags.map((tag) => (
                  <li
                    key={tag.id}
                    className="rounded-full bg-surface-subtle px-3 py-1 text-xs font-bold text-text-secondary"
                  >
                    #{tag.name}
                  </li>
                ))}
              </ul>
            )}

            <BlogAuthorCta post={data} locale={locale} />
          </article>
        </div>

        <div className="lg:col-start-2 lg:row-start-1 min-[1380px]:col-start-3">
          <BlogAuthorRail post={data} slug={slug} locale={locale} />
        </div>
      </div>

      {relatedPosts.length > 0 && (
        <section className="mt-14" aria-labelledby="blog-related-title">
          <h2 id="blog-related-title" className="m-0 mb-4 text-xl font-extrabold text-text-main">
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

function TitleBlock({ post }: { post: BlogPostReaderDetailResponse }) {
  const author = post.author;
  const conversion = post.authorConversion;
  return (
    <header className="mx-auto max-w-[820px]">
      {post.categories && post.categories.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {post.categories.map((category) => (
            <span
              key={category.id}
              className="rounded-full bg-primary-light px-3 py-1 text-[13px] font-bold text-sky-700"
            >
              {category.name}
            </span>
          ))}
        </div>
      )}
      <h1 className="m-0 text-[32px] font-extrabold leading-[1.18] tracking-[-0.03em] text-text-main sm:text-[42px]">
        {post.title}
      </h1>
      {post.excerpt && (
        <p className="m-0 mt-4 text-lg leading-[1.65] text-slate-700 sm:text-[19px]">
          {post.excerpt}
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-0 border-t border-solid border-border-light pt-[18px]">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-light text-sm font-extrabold text-primary">
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
              <p className="m-0 line-clamp-1 text-sm text-text-muted">{conversion.headline}</p>
            )}
          </div>
        </div>
        <p className="m-0 flex flex-wrap gap-x-4 gap-y-1 text-sm text-text-muted">
          <span>{formatBlogDate(post.publishedAt ?? post.createdAt)}</span>
          {post.readingTimeMinutes ? <span>{post.readingTimeMinutes} phút đọc</span> : null}
          <span>{formatCount(post.viewCount)} lượt xem</span>
        </p>
      </div>
    </header>
  );
}

function DetailSkeleton() {
  const bar = 'block rounded bg-surface-subtle';
  return (
    <div
      className="mx-auto w-full max-w-[1280px] animate-pulse motion-reduce:animate-none"
      aria-busy="true"
    >
      <span className={`${bar} mb-6 h-4 w-32`} />
      <div className="mx-auto max-w-[820px]">
        <span className={`${bar} h-6 w-40 rounded-full`} />
        <span className={`${bar} mt-4 h-10 w-full`} />
        <span className={`${bar} mt-3 h-10 w-2/3`} />
        <span className={`${bar} mt-5 h-4 w-full`} />
        <span className={`${bar} mt-2 h-4 w-4/5`} />
        <div className="mt-6 flex items-center gap-3 border-0 border-t border-solid border-border-light pt-[18px]">
          <span className="h-11 w-11 rounded-full bg-surface-subtle" />
          <span className={`${bar} h-4 w-40`} />
        </div>
        <span className="mt-8 block aspect-[16/7] w-full rounded-[20px] bg-surface-subtle" />
      </div>
      <div className={`mt-10 ${READING_GRID}`}>
        <div className="hidden space-y-2 min-[1380px]:col-start-1 min-[1380px]:row-start-1 min-[1380px]:block">
          {Array.from({ length: 4 }, (_, index) => (
            <span key={index} className={`${bar} h-4 w-full`} />
          ))}
        </div>
        <div className="space-y-4 lg:col-start-1 lg:row-start-1 lg:px-10 min-[1380px]:col-start-2">
          {Array.from({ length: 8 }, (_, index) => (
            <span key={index} className={`${bar} mx-auto h-4 w-full max-w-[680px]`} />
          ))}
        </div>
        <div className="h-56 rounded-[20px] border border-solid border-border-light bg-white lg:col-start-2 lg:row-start-1 min-[1380px]:col-start-3" />
      </div>
      <span className="sr-only" role="status">
        Đang tải bài viết…
      </span>
    </div>
  );
}
