/**
 * @file MentorPostsView.tsx
 * @description Màn quản lý bài viết Blog của Mentor: lọc theo trạng thái, lượt đọc của bài đã đăng,
 * tiếp tục viết bản nháp, chỉnh sửa và gỡ bài.
 */

'use client';

import { Archive, Plus } from 'lucide-react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useMentorArticles } from '@/components/domain/blog/useMentorArticles';
import { useMenteeShell } from '@/components/domain/mentee-shell/MenteeShell';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/providers/AuthProvider';
import { MentorPostComposer } from './MentorPostComposer';
import { MentorPostRow, MentorPostRowSkeleton, type MentorPostStats } from './MentorPostRow';
import { useMentorPosts } from './useMentorPosts';

type PostTab = 'all' | 'draft' | 'published';

const TOPIC_STARTERS = [
  'Mình đã qua môn … thế nào',
  'Kinh nghiệm phỏng vấn OJT',
  'Sai lầm khi làm đồ án nhóm',
];

function tabFromUrl(): PostTab {
  const tab = new URLSearchParams(window.location.search).get('tab');
  return tab === 'draft' || tab === 'published' ? tab : 'all';
}

export function MentorPostsView() {
  const { setHeaderTitle } = useMenteeShell();
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams<{ locale?: string }>();
  const locale = params?.locale || 'vi';
  const posts = useMentorPosts();
  const [tab, setTab] = useState<PostTab>('all');
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // The mentor list API has no reader counters: take them from this mentor's reader cards.
  const { articles } = useMentorArticles(user?.id, []);
  const statsById = useMemo(() => {
    const stats = new Map<string, MentorPostStats>();
    articles.forEach((article) =>
      stats.set(article.id, {
        viewCount: article.viewCount ?? 0,
        likeCount: article.likeCount ?? 0,
      }),
    );
    return stats;
  }, [articles]);

  useEffect(() => {
    setHeaderTitle('Bài viết của tôi');
    return () => setHeaderTitle(undefined);
  }, [setHeaderTitle]);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('create') === '1') posts.openCreate();
  }, [posts.openCreate]);

  useEffect(() => setTab(tabFromUrl()), []);

  const changeTab = (next: PostTab) => {
    setTab(next);
    const search = new URLSearchParams(window.location.search);
    if (next === 'all') search.delete('tab');
    else search.set('tab', next);
    const query = search.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  if (posts.isEditorOpen) return <MentorPostComposer posts={posts} />;

  const tabs: { id: PostTab; label: string; count: number }[] = [
    { id: 'all', label: 'Tất cả', count: posts.posts.length },
    { id: 'draft', label: 'Bản nháp', count: posts.counts.draft },
    { id: 'published', label: 'Đã đăng', count: posts.counts.published },
  ];
  const visiblePosts = posts.posts.filter(
    (post) =>
      tab === 'all' || (tab === 'draft' ? post.status === 'DRAFT' : post.status === 'PUBLISHED'),
  );
  const publishedStats = posts.posts
    .filter((post) => post.status === 'PUBLISHED')
    .map((post) => statsById.get(post.id))
    .filter((stats): stats is MentorPostStats => Boolean(stats));
  const totalViews = publishedStats.reduce((sum, stats) => sum + stats.viewCount, 0);
  const archiveTarget = posts.archiveTarget;
  const isArchivingPublished = archiveTarget?.status === 'PUBLISHED';
  // The first-post panel carries its own heading and call to action.
  const showFirstPost = !posts.isLoading && !posts.error && posts.posts.length === 0;

  const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const nextIndex = (index + step + tabs.length) % tabs.length;
    changeTab(tabs[nextIndex].id);
    tabRefs.current[nextIndex]?.focus();
  };

  return (
    <section className="mx-auto max-w-7xl space-y-6">
      <header
        className={`flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between ${showFirstPost ? 'hidden' : ''}`}
      >
        <div className="min-w-0">
          <h2 className="m-0 text-[28px] font-extrabold tracking-tight text-text-main">
            Bài viết của tôi
          </h2>
          <p className="m-0 mt-1 max-w-[640px] text-[15px] leading-relaxed text-slate-600">
            Bài đã đăng hiện trên Blog và trang hồ sơ của bạn, giúp mentee biết bạn trước khi đặt
            lịch.
          </p>
        </div>
        <Button leftIcon={<Plus />} className="min-h-[46px] shrink-0" onClick={posts.openCreate}>
          Viết bài mới
        </Button>
      </header>

      {posts.error && (
        <div
          className="flex items-center justify-between gap-4 rounded-2xl border border-solid border-red-200 bg-danger-soft p-4 text-xs font-medium text-danger"
          role="alert"
        >
          <span>{posts.error}</span>
          <Button variant="outline" size="sm" onClick={() => void posts.refresh()}>
            Thử lại
          </Button>
        </div>
      )}

      {posts.isLoading ? (
        <div className="space-y-4" aria-busy="true">
          {[1, 2, 3].map((item) => (
            <MentorPostRowSkeleton key={item} />
          ))}
          <span className="sr-only" role="status">
            Đang tải bài viết…
          </span>
        </div>
      ) : posts.posts.length === 0 ? (
        showFirstPost && (
          <FirstPostPanel onStart={posts.openCreate} onStartWithTitle={posts.openCreateWithTitle} />
        )
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div
              role="tablist"
              aria-label="Lọc bài viết theo trạng thái"
              className="inline-flex w-fit max-w-full flex-wrap gap-1 rounded-xl bg-slate-100 p-1"
            >
              {tabs.map((item, index) => {
                const isActive = tab === item.id;
                return (
                  <button
                    key={item.id}
                    ref={(element) => {
                      tabRefs.current[index] = element;
                    }}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    tabIndex={isActive ? 0 : -1}
                    onClick={() => changeTab(item.id)}
                    onKeyDown={(event) => onTabKeyDown(event, index)}
                    className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border-0 px-3.5 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 sm:min-h-9 ${
                      isActive
                        ? 'bg-white text-text-main shadow-[0_1px_4px_rgba(15,23,42,0.12)]'
                        : 'bg-transparent text-slate-500 hover:text-text-main'
                    }`}
                  >
                    {item.label}
                    <span
                      className={`rounded-full px-2 py-px text-xs font-bold ${
                        isActive ? 'bg-primary text-white' : 'bg-white text-slate-500'
                      }`}
                    >
                      {item.count}
                    </span>
                  </button>
                );
              })}
            </div>
            {publishedStats.length > 0 && (
              <p className="m-0 text-sm text-slate-600">
                Bài đã đăng có <b className="text-text-main">{totalViews}</b> lượt đọc
              </p>
            )}
          </div>

          {visiblePosts.length ? (
            <div className="space-y-4" role="tabpanel">
              {visiblePosts.map((post) => (
                <MentorPostRow
                  key={post.id}
                  post={post}
                  locale={locale}
                  stats={statsById.get(post.id)}
                  onEdit={() => void posts.openEdit(post)}
                  onArchive={() => posts.setArchiveTarget(post)}
                />
              ))}
            </div>
          ) : (
            <div
              className="flex flex-col items-center gap-3 rounded-[20px] border border-dashed border-slate-300 bg-white px-6 py-10 text-center"
              role="tabpanel"
            >
              <p className="m-0 text-sm font-semibold text-text-secondary">
                {tab === 'draft' ? 'Chưa có bản nháp nào.' : 'Chưa có bài đã đăng.'}
              </p>
              <Button leftIcon={<Plus />} onClick={posts.openCreate}>
                Viết bài mới
              </Button>
            </div>
          )}
        </>
      )}

      <Modal
        open={Boolean(archiveTarget)}
        onClose={() => !posts.isSaving && posts.setArchiveTarget(undefined)}
        title={isArchivingPublished ? 'Gỡ bài và lưu trữ?' : 'Xóa bản nháp?'}
      >
        <div className="flex items-center gap-4 rounded-2xl border border-solid border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
          <Archive className="h-6 w-6 shrink-0 text-amber-600" aria-hidden="true" />
          <p className="m-0 leading-relaxed">
            {isArchivingPublished
              ? 'Bài viết sẽ không còn hiện trên Blog và trang hồ sơ của bạn, nhưng vẫn được giữ trong lưu trữ.'
              : 'Bản nháp sẽ không còn trong danh sách bài viết, nhưng vẫn được giữ trong lưu trữ.'}
          </p>
        </div>
        <footer className="mt-4 flex items-center justify-end gap-3 border-t border-solid border-border-light pt-4">
          <Button
            variant="outline"
            disabled={posts.isSaving}
            onClick={() => posts.setArchiveTarget(undefined)}
          >
            Hủy
          </Button>
          <Button
            variant="destructive"
            loading={posts.isSaving}
            onClick={() => void posts.archive()}
          >
            {isArchivingPublished ? 'Gỡ bài' : 'Xóa bản nháp'}
          </Button>
        </footer>
      </Modal>
    </section>
  );
}

function FirstPostPanel({
  onStart,
  onStartWithTitle,
}: {
  onStart: () => void;
  onStartWithTitle: (title: string) => void;
}) {
  return (
    <div className="flex flex-col items-center rounded-[24px] border border-solid border-[rgba(147,197,253,.6)] bg-[linear-gradient(115deg,#F4FAFF,#EEF7FF_56%,#E8F4FF)] px-6 py-12 text-center">
      <img src="/images/Koko.png" alt="" className="h-24 w-24 object-contain" />
      <h2 className="m-0 mt-4 text-xl font-extrabold text-text-main sm:text-2xl">
        Bài viết đầu tiên giúp mentee biết bạn
      </h2>
      <p className="m-0 mt-2 max-w-[520px] text-[15px] leading-relaxed text-slate-600">
        Kể một môn bạn từng qua, một lần đi phỏng vấn hay cách bạn làm đồ án. Bài viết hiện trên
        Blog và trang hồ sơ của bạn.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {TOPIC_STARTERS.map((title) => (
          <Button
            key={title}
            type="button"
            variant="outline"
            className="min-h-11 sm:min-h-10"
            onClick={() => onStartWithTitle(title)}
          >
            {title}
          </Button>
        ))}
      </div>
      <Button leftIcon={<Plus />} className="mt-5 min-h-[46px]" onClick={onStart}>
        Viết bài đầu tiên
      </Button>
    </div>
  );
}
