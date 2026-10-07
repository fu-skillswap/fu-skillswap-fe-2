/**
 * @file MenteeDashboardView.tsx
 * @description Giao diện Bảng tin tập trung vào hành trình học tập của Mentee.
 */

'use client';

import { PostCard } from '@/components/domain/post-card/PostCard';
import { MenteeQuestionModal } from '@/views/mentee/dashboard/MenteeQuestionModal';
import type { ForumPostResponse } from '@/models/auth';
import type { Mentor, Post } from '@/models/entities';
import { useAuth } from '@/providers/AuthProvider';
import { mentorRepo } from '@/repositories/mentorRepo';
import { postRepo } from '@/repositories/postRepo';
import {
  ArrowRight,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Compass,
  MessageSquareText,
  Search,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState, type ReactNode } from 'react';

type FeedFilter = 'all' | 'question' | 'experience' | 'learning' | 'career';

const filters: { id: FeedFilter; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'question', label: 'Câu hỏi' },
  { id: 'experience', label: 'Chia sẻ kinh nghiệm' },
  { id: 'learning', label: 'Học tập' },
  { id: 'career', label: 'Định hướng nghề nghiệp' },
];

function classifyPost(post: Post): Exclude<FeedFilter, 'all'> {
  const text = `${post.title} ${post.content} ${post.tags.join(' ')}`.toLocaleLowerCase('vi');
  if (/\?|hỏi|gợi ý|giúp|lộ trình/.test(text)) return 'question';
  if (/cv|phỏng vấn|nghề|career|việc làm|portfolio/.test(text)) return 'career';
  if (/học|khóa|kỹ năng|python|react|system design/.test(text)) return 'learning';
  return 'experience';
}

const filterLabels: Record<Exclude<FeedFilter, 'all'>, string> = {
  question: 'Câu hỏi',
  experience: 'Chia sẻ kinh nghiệm',
  learning: 'Học tập',
  career: 'Định hướng nghề nghiệp',
};

export function MenteeDashboardView({
  locale,
  posts,
  mentors,
  postsLoadFailed = false,
}: {
  locale: string;
  posts: Post[];
  mentors: Mentor[];
  /** True when the server could not load the feed; shows a load-error empty state. */
  postsLoadFailed?: boolean;
}) {
  const { user, isAuthenticated, isBootstrapping, showAuthRequiredModal } = useAuth();
  const [activeFilter, setActiveFilter] = useState<FeedFilter>('all');
  const [isQuestionOpen, setIsQuestionOpen] = useState(false);
  const [feedPosts, setFeedPosts] = useState(posts);
  const [suggestedMentors, setSuggestedMentors] = useState(mentors);
  const [feedStatus, setFeedStatus] = useState<'idle' | 'loading' | 'error'>(
    postsLoadFailed ? 'loading' : 'idle',
  );
  const showLoadError = feedStatus === 'error' && feedPosts.length === 0;
  const isFeedLoading = feedStatus === 'loading' && feedPosts.length === 0;

  // The server render has no user token and may not reach the API at all, so reload the feed in
  // the browser once the session is restored. This also refreshes per-user state (likes).
  useEffect(() => {
    if (isBootstrapping) return;
    let cancelled = false;
    setFeedStatus((current) => (current === 'error' ? 'loading' : current));
    postRepo
      .list()
      .then((loaded) => {
        if (cancelled) return;
        setFeedPosts(loaded);
        setFeedStatus('idle');
      })
      .catch(() => {
        if (!cancelled) setFeedStatus('error');
      });
    if (mentors.length === 0) {
      mentorRepo
        .list({ page: 0, size: 3 })
        .then((loaded) => {
          if (!cancelled) setSuggestedMentors(loaded.slice(0, 3));
        })
        .catch(() => undefined);
    }
    return () => {
      cancelled = true;
    };
  }, [isBootstrapping, user?.id, mentors.length]);

  const displayName = user?.fullName?.trim().split(/\s+/).at(-1);
  const visiblePosts = useMemo(
    () => feedPosts.filter((post) => activeFilter === 'all' || classifyPost(post) === activeFilter),
    [activeFilter, feedPosts],
  );

  const handleAskQuestion = () => {
    if (!isAuthenticated) {
      showAuthRequiredModal('Bạn cần đăng nhập để đăng câu hỏi và nhận hỗ trợ từ mentor.');
      return;
    }
    setIsQuestionOpen(true);
  };

  const addCreatedQuestion = (created: ForumPostResponse) => {
    const post = postRepo.mapResponse(created);
    setFeedPosts((current) => [post, ...current.filter((item) => item.id !== post.id)]);
    setActiveFilter('all');
  };

  return (
    <div className="mx-auto w-full max-w-[1240px] space-y-6 px-0 pb-10 sm:px-1 lg:px-2">
      <section className="relative min-h-[260px] overflow-hidden rounded-[24px] border border-solid border-primary-border/60 bg-[linear-gradient(115deg,#f4faff_0%,#eef7ff_56%,#e8f4ff_100%)] px-6 py-8 sm:px-8 lg:grid lg:grid-cols-2 lg:items-center">
        <div className="relative z-10 max-w-[590px] lg:pr-5">
          <p className="m-0 text-base font-bold text-primary sm:text-lg">
            Chào {displayName || 'bạn'}! 👋
          </p>
          <h1 className="mb-3 mt-2 text-[32px] font-extrabold leading-[1.15] tracking-tight text-text-main sm:text-[38px] lg:text-[40px]">
            Hôm nay bạn muốn học gì?
          </h1>
          <p className="mb-6 mt-0 max-w-lg text-base leading-7 text-text-secondary sm:text-[17px]">
            Đặt câu hỏi, tìm mentor phù hợp và phát triển kỹ năng cùng SkillSwap.
          </p>
          <button
            type="button"
            onClick={handleAskQuestion}
            className="inline-flex min-h-12 items-center gap-2 rounded-xl border-none bg-primary px-5 py-3 text-sm font-bold text-white shadow-xs transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25 sm:text-[15px]"
          >
            <MessageSquareText className="h-4.5 w-4.5" aria-hidden="true" />
            <span>Đăng câu hỏi</span>
            <ArrowRight className="h-4.5 w-4.5" aria-hidden="true" />
          </button>
        </div>
        <div className="pointer-events-none relative -mb-8 mt-6 flex min-h-48 items-end justify-center sm:min-h-56 lg:absolute lg:inset-y-0 lg:right-0 lg:mb-0 lg:mt-0 lg:w-[52%] lg:justify-end">
          <span
            className="absolute inset-y-0 left-0 z-10 hidden w-20 bg-gradient-to-r from-[#eff8ff] to-transparent lg:block"
            aria-hidden="true"
          />
          <img
            src="/images/cta.png"
            alt="Mascot SkillSwap và Đại học FPT"
            className="h-full max-h-[260px] w-full object-contain object-bottom lg:max-h-full lg:object-cover lg:object-center"
          />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3" aria-label="Thao tác nhanh">
        <QuickAction
          icon={<Search />}
          title="Tìm mentor phù hợp"
          subtitle="Theo kỹ năng, ngành nghề"
          tone="green"
          href={`/${locale}/mentor-booking`}
        />
        <QuickAction
          icon={<CalendarDays />}
          title="Đặt lịch buổi đầu"
          subtitle="Trao đổi 1:1 với mentor"
          tone="blue"
          href={`/${locale}/mentor-booking`}
        />
        <QuickAction
          icon={<Compass />}
          title="Khám phá kỹ năng"
          subtitle="Xem chủ đề đang quan tâm"
          tone="amber"
          href="#community-feed"
        />
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_330px]">
        <section id="community-feed" className="min-w-0 scroll-mt-24" aria-labelledby="feed-title">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 id="feed-title" className="m-0 text-[22px] font-extrabold text-text-main">
              Bài viết từ cộng đồng
            </h2>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-lg border-none bg-transparent px-2 py-1.5 text-xs font-bold text-text-secondary hover:bg-surface-subtle hover:text-text-main"
            >
              Mới nhất <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
          <div
            className="mb-4 flex gap-2 overflow-x-auto pb-1"
            role="tablist"
            aria-label="Lọc bài viết"
          >
            {filters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                role="tab"
                aria-selected={activeFilter === filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`h-9 shrink-0 rounded-[11px] border px-3 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 ${activeFilter === filter.id ? 'border-primary bg-primary text-white' : 'border-border-light bg-white text-text-secondary hover:border-primary-border hover:text-primary'}`}
              >
                {filter.label}
              </button>
            ))}
          </div>
          {isFeedLoading ? (
            <div
              className="rounded-[18px] border border-solid border-border-light bg-white p-8 text-center text-sm text-text-secondary"
              role="status"
            >
              Đang tải bảng tin...
            </div>
          ) : visiblePosts.length > 0 ? (
            <div className="flex flex-col gap-4">
              {visiblePosts.map((post) => {
                const category = classifyPost(post);
                return (
                  <PostCard
                    key={post.id}
                    post={post}
                    locale={locale}
                    variant="community"
                    typeLabel={filterLabels[category]}
                    detailLabel={
                      category === 'question'
                        ? 'Xem thảo luận'
                        : category === 'career'
                          ? 'Xem chia sẻ'
                          : 'Đọc tiếp'
                    }
                    onUpdated={(updated) =>
                      setFeedPosts((current) =>
                        current.map((item) => (item.id === updated.id ? updated : item)),
                      )
                    }
                    onDeleted={(postId) =>
                      setFeedPosts((current) => current.filter((item) => item.id !== postId))
                    }
                  />
                );
              })}
            </div>
          ) : (
            <div className="rounded-[18px] border border-solid border-border-light bg-white p-8 text-center">
              <h3 className="m-0 text-base font-extrabold text-text-main">
                {showLoadError ? 'Không tải được bảng tin lúc này.' : 'Chưa có bài viết phù hợp.'}
              </h3>
              <p className="mb-5 mt-2 text-sm text-text-secondary">
                {showLoadError
                  ? 'Vui lòng tải lại trang hoặc thử lại sau ít phút.'
                  : 'Hãy thử chọn chủ đề khác hoặc đặt câu hỏi đầu tiên của bạn.'}
              </p>
              <button
                type="button"
                onClick={handleAskQuestion}
                className="border-none bg-transparent p-0 text-sm font-bold text-primary hover:underline"
              >
                Đăng câu hỏi →
              </button>
            </div>
          )}
        </section>

        <aside
          className="space-y-4 pb-24 lg:sticky lg:top-24 lg:self-start"
          aria-label="Hỗ trợ học tập"
        >
          <section className="rounded-[18px] border border-solid border-border-light bg-white p-5 shadow-[0_3px_12px_rgba(16,50,90,0.035)]">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light text-primary">
              <Compass className="h-5 w-5" aria-hidden="true" />
            </span>
            <h2 className="mb-0 mt-4 text-base font-extrabold text-text-main">
              Bắt đầu với SkillSwap
            </h2>
            <p className="mb-1 mt-3 text-sm font-bold text-text-main">Tìm mentor phù hợp</p>
            <p className="mb-4 mt-1 text-xs leading-5 text-text-secondary">
              Khám phá mentor theo kỹ năng và mục tiêu bạn đang quan tâm.
            </p>
            <Link
              href={`/${locale}/mentor-booking`}
              className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
            >
              Khám phá mentor <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </section>

          {suggestedMentors.filter((mentor) => mentor.id && mentor.name).length > 0 && (
            <section className="rounded-[18px] border border-solid border-border-light bg-white p-5 shadow-[0_3px_12px_rgba(16,50,90,0.035)]">
              <div className="flex items-center justify-between gap-3">
                <h2 className="m-0 text-base font-extrabold text-text-main">Mentor nổi bật</h2>
                <Link
                  href={`/${locale}/mentor-booking`}
                  className="shrink-0 text-xs font-bold text-primary hover:underline"
                >
                  Xem thêm →
                </Link>
              </div>
              <div className="mt-4 divide-y divide-border-light">
                {suggestedMentors
                  .filter((mentor) => mentor.id && mentor.name)
                  .slice(0, 3)
                  .map((mentor) => (
                    <MentorSuggestion key={mentor.id} mentor={mentor} locale={locale} />
                  ))}
              </div>
            </section>
          )}
        </aside>
      </div>

      <MenteeQuestionModal
        open={isQuestionOpen}
        onClose={() => setIsQuestionOpen(false)}
        onCreated={addCreatedQuestion}
      />
    </div>
  );
}

function QuickAction({
  icon,
  title,
  subtitle,
  tone,
  href,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  tone: 'blue' | 'green' | 'amber';
  href?: string;
  onClick?: () => void;
}) {
  const iconTone = {
    blue: 'bg-blue-50 text-primary',
    green: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
  }[tone];
  const className =
    'group relative flex h-24 items-center gap-3 rounded-2xl border border-solid border-border-light bg-white px-4 py-4 text-left shadow-[0_4px_16px_rgba(16,50,90,0.03)] transition-all hover:-translate-y-0.5 hover:border-primary-border hover:shadow-[0_6px_18px_rgba(16,50,90,0.07)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 sm:px-[18px]';
  const content = (
    <>
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl [&>svg]:h-5 [&>svg]:w-5 ${iconTone}`}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <strong className="block pr-4 text-[15px] font-bold leading-5 text-text-main">
          {title}
        </strong>
        <small className="mt-1 block pr-4 text-[13px] leading-4 text-text-secondary">
          {subtitle}
        </small>
      </span>
      <ChevronRight
        className="absolute right-3 h-4 w-4 text-primary transition-transform group-hover:translate-x-0.5"
        aria-hidden="true"
      />
    </>
  );
  return href ? (
    <Link href={href} className={className}>
      {content}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={`${className} cursor-pointer`}>
      {content}
    </button>
  );
}

function MentorSuggestion({ mentor, locale }: { mentor: Mentor; locale: string }) {
  const initials = mentor.name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <article className="py-4 first:pt-0 last:pb-0">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-light text-xs font-extrabold text-primary">
          {mentor.avatarUrl ? (
            <img src={mentor.avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            initials
          )}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="m-0 truncate text-sm font-extrabold text-text-main">{mentor.name}</h3>
          <p className="mb-2 mt-0.5 truncate text-xs text-text-secondary">
            {[mentor.headline, mentor.organization].filter(Boolean).join(' · ') ||
              'Mentor SkillSwap'}
          </p>
          <div className="flex flex-wrap gap-1">
            {mentor.expertise.slice(0, 2).map((skill) => (
              <span
                key={skill}
                className="rounded-md bg-primary-light px-2 py-1 text-[10px] font-bold text-primary"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>
      <Link
        href={`/${locale}/mentor-booking`}
        className="mt-3 inline-flex items-center justify-center rounded-lg border border-solid border-primary-border px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary-light"
      >
        Xem hồ sơ
      </Link>
    </article>
  );
}
