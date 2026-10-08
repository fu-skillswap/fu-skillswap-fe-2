/**
 * @file BlogListView.tsx
 * @description Trang Blog cộng đồng: bài viết đã xuất bản của Mentor, lọc theo chuyên mục và từ khóa.
 */

'use client';

import { BlogPostCard, BlogPostCardSkeleton } from '@/components/domain/blog/BlogPostCard';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/providers/AuthProvider';
import { PenLine, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useBlogFeed } from './useBlogFeed';

const chipBase =
  'h-9 shrink-0 cursor-pointer rounded-[11px] border border-solid px-3.5 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20';
const chipIdle =
  'border-border-light bg-white text-text-secondary hover:border-primary-border hover:text-primary';
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

  return (
    <section className="mx-auto max-w-6xl space-y-5">
      <header className="flex flex-col gap-4 rounded-3xl border border-solid border-border-light bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="m-0 text-xl font-extrabold text-text-main sm:text-2xl">Blog cộng đồng</h1>
          <p className="m-0 mt-1 text-sm text-text-secondary">
            Kinh nghiệm học tập và làm nghề được các Mentor SkillSwap chia sẻ.
          </p>
        </div>
        {isMentor && (
          <Button
            type="button"
            leftIcon={<PenLine />}
            className="shrink-0"
            onClick={() => router.push(`/${locale}/mentor/posts?create=1`)}
          >
            Viết bài
          </Button>
        )}
      </header>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <label className="relative block lg:w-80">
          <span className="sr-only">Tìm bài viết</span>
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm theo tiêu đề, nội dung…"
            className="h-10 w-full rounded-xl border border-solid border-border-light bg-white pl-10 pr-3 text-sm text-text-main outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
          />
        </label>
        {feed.categories.length > 0 && (
          <div
            className="flex gap-2 overflow-x-auto pb-1 lg:pb-0"
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

      {feed.isError ? (
        <EmptyState
          title="Chưa tải được bài viết"
          description="Kết nối có thể đang chập chờn. Bạn thử tải lại nhé."
          action={
            <Button type="button" variant="outline" size="sm" onClick={() => void feed.refetch()}>
              Thử lại
            </Button>
          }
        />
      ) : feed.isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
          {Array.from({ length: 6 }, (_, index) => (
            <BlogPostCardSkeleton key={index} />
          ))}
          <span className="sr-only" role="status">
            Đang tải bài viết…
          </span>
        </div>
      ) : feed.items.length === 0 ? (
        <EmptyState
          title={isFiltered ? 'Không có bài viết phù hợp' : 'Chưa có bài viết nào'}
          description={
            isFiltered
              ? 'Thử từ khóa khác hoặc chọn chuyên mục khác.'
              : 'Khi Mentor xuất bản bài viết, bài sẽ hiện ở đây.'
          }
          action={
            isFiltered ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setKeyword('');
                  setCategoryId(undefined);
                }}
              >
                Xóa bộ lọc
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {feed.items.map((post) => (
              <BlogPostCard key={post.id} post={post} locale={locale} />
            ))}
          </div>
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
      )}
    </section>
  );
}

function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
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
