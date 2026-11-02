/**
 * @file BlogListView.tsx
 * @description Trang Blog cộng đồng: hero tìm kiếm + chuyên mục, bài nổi bật, được đọc nhiều,
 * lưới bài mới nhất và dải đặt lịch với người viết.
 */

'use client';

import {
  BlogFeaturedCard,
  BlogFeaturedCardSkeleton,
} from '@/components/domain/blog/BlogFeaturedCard';
import {
  BlogPopularList,
  MIN_POPULAR_ITEMS,
  pickPopularPosts,
} from '@/components/domain/blog/BlogPopularList';
import { BlogPostCard, BlogPostCardSkeleton } from '@/components/domain/blog/BlogPostCard';
import { BlogWritersStrip, pickBlogWriters } from '@/components/domain/blog/BlogWritersStrip';
import { Button } from '@/components/ui/Button';
import type { BlogPostReaderCardResponse } from '@/models/blog';
import { useAuth } from '@/providers/AuthProvider';
import { PenLine, Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { useBlogFeed } from './useBlogFeed';

/** Grid cards shown before the writers strip is inserted. */
const CARDS_BEFORE_WRITERS = 3;
/** With fewer posts than this (and no filter) the page shows the sparse layout. */
const SPARSE_LIMIT = 4;

const chipBase =
  'min-h-[38px] cursor-pointer rounded-full border border-solid px-3.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20';
const chipIdle =
  'border-[rgba(147,197,253,.6)] bg-white text-text-secondary hover:border-primary-border hover:text-primary';
const chipActive = 'border-primary bg-primary text-white';

export function BlogListView({ locale }: { locale: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const [categoryId, setCategoryId] = useState<string>();
  const [search, setSearch] = useState('');
  const [keyword, setKeyword] = useState('');
  const feed = useBlogFeed({ categoryId, keyword });
  const isMentor = user?.roles?.includes('MENTOR');

  useEffect(() => {
    const timer = window.setTimeout(() => setKeyword(search.trim()), 400);
    return () => window.clearTimeout(timer);
  }, [search]);

  const isFiltered = Boolean(categoryId || keyword);
  const clearFilters = () => {
    setSearch('');
    setKeyword('');
    setCategoryId(undefined);
  };

  let content: ReactNode;
  if (feed.isError) {
    content = (
      <EmptyState
        title="Chưa tải được bài viết"
        description="Kết nối có thể đang chập chờn. Bạn thử tải lại nhé."
        action={
          <Button type="button" variant="outline" size="sm" onClick={() => void feed.refetch()}>
            Thử lại
          </Button>
        }
      />
    );
  } else if (feed.isLoading) {
    content = (
      <div className="space-y-6" aria-busy="true">
        {!isFiltered && <BlogFeaturedCardSkeleton />}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <BlogPostCardSkeleton key={index} />
          ))}
        </div>
        <span className="sr-only" role="status">
          Đang tải bài viết…
        </span>
      </div>
    );
  } else if (feed.items.length === 0) {
    content = (
      <EmptyState
        title={isFiltered ? 'Không có bài viết phù hợp' : 'Chưa có bài viết nào'}
        description={
          isFiltered
            ? 'Thử từ khóa khác hoặc chọn chuyên mục khác.'
            : 'Khi Mentor xuất bản bài viết, bài sẽ hiện ở đây.'
        }
        action={
          isFiltered ? (
            <Button type="button" variant="outline" size="sm" onClick={clearFilters}>
              Xóa bộ lọc
            </Button>
          ) : undefined
        }
      />
    );
  } else {
    const items = feed.items;
    const writers = pickBlogWriters(items);
    const featured = isFiltered ? undefined : (items.find((post) => post.featured) ?? items[0]);
    const gridPosts = featured ? items.filter((post) => post.id !== featured.id) : items;
    const isSparse = !isFiltered && items.length < SPARSE_LIMIT;
    const popular = featured && !isSparse ? pickPopularPosts(items, featured.id) : [];
    const showPopular = popular.length >= MIN_POPULAR_ITEMS;
    const categoryName = feed.categories.find((category) => category.id === categoryId)?.name;
    const gridHeading = !isFiltered
      ? 'Bài mới nhất'
      : keyword
        ? `Kết quả cho “${keyword}”`
        : (categoryName ?? 'Kết quả lọc');

    content = (
      <>
        {featured &&
          (showPopular ? (
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
              <BlogFeaturedCard post={featured} locale={locale} />
              <BlogPopularList posts={popular} locale={locale} />
            </div>
          ) : (
            <BlogFeaturedCard post={featured} locale={locale} />
          ))}

        {gridPosts.length > 0 && (
          <section className="space-y-5" aria-labelledby="blog-grid-heading">
            {/* TODO(api): the list response has no total; show "{n} bài viết" once it does. */}
            <h2 id="blog-grid-heading" className="m-0 text-[22px] font-extrabold text-text-main">
              {gridHeading}
            </h2>
            <PostGrid posts={gridPosts.slice(0, CARDS_BEFORE_WRITERS)} locale={locale} />
            {!isSparse && <BlogWritersStrip writers={writers} locale={locale} />}
            {gridPosts.length > CARDS_BEFORE_WRITERS && (
              <PostGrid posts={gridPosts.slice(CARDS_BEFORE_WRITERS)} locale={locale} />
            )}
          </section>
        )}

        {isSparse && (
          <>
            <SparsePanel locale={locale} />
            <BlogWritersStrip
              writers={writers}
              locale={locale}
              title="Mentor đang viết trên SkillSwap"
            />
          </>
        )}

        {feed.hasNextPage && (
          <div className="flex justify-center">
            <Button
              type="button"
              variant="outline"
              loading={feed.isFetchingNextPage}
              onClick={() => void feed.fetchNextPage()}
            >
              Xem thêm bài viết
            </Button>
          </div>
        )}
      </>
    );
  }

  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <header className="relative overflow-hidden rounded-[24px] border border-solid border-[rgba(147,197,253,.6)] bg-[linear-gradient(115deg,#F4FAFF,#EEF7FF_56%,#E8F4FF)] px-6 py-7 sm:px-9 sm:py-8">
        <img
          src="/images/Koko.png"
          alt=""
          className="pointer-events-none absolute bottom-0 right-4 hidden w-[150px] object-contain sm:block"
        />
        <div className="relative sm:pr-[170px]">
          <h1 className="m-0 text-[28px] font-extrabold leading-tight tracking-[-0.03em] text-[#12386E] sm:text-[34px]">
            Kinh nghiệm thật từ người đi trước
          </h1>
          <p className="m-0 mt-2 max-w-[620px] text-[15px] leading-relaxed text-text-secondary">
            Mentor SkillSwap chia sẻ cách qua môn, làm đồ án và chuẩn bị OJT. Đọc xong, đặt lịch hỏi
            thêm ngay với người viết.
          </p>

          <label className="relative mt-5 block max-w-[660px]">
            <span className="sr-only">Tìm bài viết</span>
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm theo môn, kỹ năng: PRN211, CV, Figma…"
              className="min-h-[52px] w-full rounded-2xl border border-solid border-transparent bg-white pl-12 pr-4 text-[15px] text-text-main shadow-[0_8px_24px_rgba(32,79,126,.08)] outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
            />
          </label>

          {feed.categories.length > 0 && (
            <div
              className="mt-4 flex flex-wrap gap-2"
              role="group"
              aria-label="Lọc theo chuyên mục"
            >
              <button
                type="button"
                aria-pressed={!categoryId}
                onClick={() => setCategoryId(undefined)}
                className={`${chipBase} ${!categoryId ? chipActive : chipIdle}`}
              >
                Tất cả
              </button>
              {feed.categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  aria-pressed={categoryId === category.id}
                  onClick={() => setCategoryId(category.id)}
                  className={`${chipBase} ${categoryId === category.id ? chipActive : chipIdle}`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {isMentor && (
          <Button
            type="button"
            size="sm"
            leftIcon={<PenLine />}
            className="relative mt-5 sm:absolute sm:right-6 sm:top-6 sm:mt-0"
            onClick={() => router.push(`/${locale}/mentor/posts?create=1`)}
          >
            Viết bài
          </Button>
        )}
      </header>

      {content}
    </section>
  );
}

function PostGrid({ posts, locale }: { posts: BlogPostReaderCardResponse[]; locale: string }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => (
        <BlogPostCard key={post.id} post={post} locale={locale} />
      ))}
    </div>
  );
}

function SparsePanel({ locale }: { locale: string }) {
  return (
    <div className="flex flex-col items-start gap-4 rounded-[20px] border-2 border-dashed border-[rgba(147,197,253,.8)] bg-white p-5 sm:flex-row sm:items-center sm:p-6">
      <img src="/images/Koko.png" alt="" className="h-14 w-14 shrink-0 object-contain" />
      <div className="min-w-0 flex-1">
        <h2 className="m-0 text-base font-extrabold text-text-main">Chưa thấy chủ đề bạn cần?</h2>
        <p className="m-0 mt-1 text-sm leading-relaxed text-text-secondary">
          Hỏi KouKou hoặc đăng câu hỏi lên Bảng tin, mentor sẽ trả lời và có thể viết thành bài.
        </p>
      </div>
      <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:shrink-0">
        {/* The dashboard has no URL hook for its question modal, so this opens the feed. */}
        <Link
          href={`/${locale}/dashboard`}
          className="inline-flex h-10 flex-1 items-center justify-center rounded-xl bg-primary px-4 text-sm font-bold text-white no-underline transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25 sm:flex-none"
        >
          Đăng câu hỏi
        </Link>
        <Button
          type="button"
          variant="outline"
          className="flex-1 sm:flex-none"
          onClick={() => window.dispatchEvent(new CustomEvent('skillswap:open-koukou'))}
        >
          Hỏi KouKou
        </Button>
      </div>
    </div>
  );
}

function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-border-light bg-white px-6 py-14 text-center">
      <img src="/images/Koko.png" alt="" className="h-16 w-16 object-contain opacity-80" />
      <h2 className="m-0 mt-3 text-base font-extrabold text-text-main">{title}</h2>
      <p className="m-0 mt-1 max-w-sm text-sm text-text-secondary">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
