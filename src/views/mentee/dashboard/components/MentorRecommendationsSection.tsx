/**
 * @file MentorRecommendationsSection.tsx
 * @description Khối "Mentor phù hợp với bạn" trên bảng tin Mentee. Ẩn hẳn khi lỗi hoặc không có gợi ý.
 */

'use client';

import { Button } from '@/components/ui/Button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMentorRecommendations, type RecommendedMentor } from '../useMentorRecommendations';

const VISIBLE_COUNT = 3;
const cardClassName =
  'flex flex-col rounded-[18px] border border-solid border-border-light bg-white p-4 shadow-[0_4px_16px_rgba(16,50,90,0.03)]';

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function MentorRecommendationsSection({ locale }: { locale: string }) {
  const { data, isPending, isError, fetchStatus } = useMentorRecommendations();
  const listHref = `/${locale}/mentor-booking`;

  // `isPending` stays true while the query is disabled (logged out): render nothing then.
  const isLoading = isPending && fetchStatus === 'fetching';
  if (!isLoading && (isError || !data?.items.length)) return null;

  return (
    <section aria-labelledby="mentor-recommendations-title" aria-busy={isLoading}>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2
            id="mentor-recommendations-title"
            className="m-0 text-[22px] font-extrabold text-text-main"
          >
            Mentor phù hợp với bạn
          </h2>
          {data?.reranked && (
            <p className="mb-0 mt-1 flex items-center gap-1.5 text-xs text-text-muted">
              <img src="/images/Koko.png" alt="" className="h-4 w-4 object-contain" />
              KouKou AI sắp xếp theo mục tiêu học của bạn, cập nhật mỗi ngày
            </p>
          )}
        </div>
        <Link
          href={listHref}
          className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
        >
          Xem tất cả <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {isLoading
          ? Array.from({ length: VISIBLE_COUNT }, (_, index) => <SkeletonCard key={index} />)
          : data?.items
              .slice(0, VISIBLE_COUNT)
              .map((item) => (
                <RecommendationCard key={item.mentor.id} item={item} locale={locale} />
              ))}
      </div>
      {isLoading && (
        <span className="sr-only" role="status">
          Đang tải gợi ý mentor…
        </span>
      )}
    </section>
  );
}

function RecommendationCard({ item, locale }: { item: RecommendedMentor; locale: string }) {
  const router = useRouter();
  const { mentor, aiReason, matchReason } = item;
  const meta = mentor.headline || mentor.organization || 'Mentor SkillSwap';
  const skills = mentor.expertise.filter((skill) => skill && skill !== meta).slice(0, 2);
  const reason = aiReason ?? matchReason;

  return (
    <article className={cardClassName}>
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-light text-sm font-extrabold text-primary">
          {mentor.avatarUrl ? (
            <img src={mentor.avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            initials(mentor.name)
          )}
        </span>
        <div className="min-w-0">
          <h3 className="m-0 truncate text-[15px] font-bold text-text-main">{mentor.name}</h3>
          <p className="m-0 truncate text-[13px] text-text-secondary">{meta}</p>
        </div>
      </div>

      {reason && (
        <p className="mb-0 mt-3 line-clamp-3 rounded-2xl rounded-tl-md border border-primary-border/40 bg-primary-light px-3 py-2.5 text-xs leading-5 text-text-secondary">
          {aiReason && <b className="text-text-main">Vì sao phù hợp: </b>}
          {reason}
        </p>
      )}

      {skills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {skills.map((skill) => (
            <span
              key={skill}
              className="rounded-lg bg-surface-subtle px-2 py-0.5 text-[11px] font-bold text-text-secondary"
            >
              {skill}
            </span>
          ))}
        </div>
      )}

      {/* Spacer keeps footers aligned across cards and at least 12px below the content. */}
      <div className="min-h-3 flex-1" aria-hidden="true" />
      <div className="flex items-center justify-between gap-3 border-t border-solid border-border-light pt-3">
        {mentor.startingPrice !== undefined ? (
          <span className="text-xs text-text-secondary">
            Từ{' '}
            <b className="text-sm text-text-main">
              {mentor.startingPrice === 0
                ? 'Miễn phí'
                : `${new Intl.NumberFormat('vi-VN').format(mentor.startingPrice)} S-coins`}
            </b>
          </span>
        ) : (
          <span />
        )}
        <Button
          type="button"
          size="sm"
          aria-label={`Xem lịch trống của ${mentor.name}`}
          onClick={() => {
            // TODO(api): funnel event AI_RECOMMENDATION (backend MentorFunnelSource.AI_*).
            router.push(
              `/${locale}/mentor-booking?mentorId=${encodeURIComponent(mentor.mentorUserId || mentor.id)}`,
            );
          }}
        >
          Xem lịch trống
        </Button>
      </div>
    </article>
  );
}

function SkeletonCard() {
  return (
    <div
      className={`${cardClassName} min-h-[208px] animate-pulse motion-reduce:animate-none`}
      aria-hidden="true"
    >
      <div className="flex items-center gap-3">
        <span className="h-11 w-11 shrink-0 rounded-full bg-surface-subtle" />
        <span className="flex-1 space-y-2">
          <span className="block h-3.5 w-2/3 rounded bg-surface-subtle" />
          <span className="block h-3 w-1/2 rounded bg-surface-subtle" />
        </span>
      </div>
      <span className="mt-3 block h-14 rounded-2xl bg-surface-subtle" />
      <span className="mt-3 flex gap-1.5">
        <span className="h-5 w-16 rounded-lg bg-surface-subtle" />
        <span className="h-5 w-12 rounded-lg bg-surface-subtle" />
      </span>
      <span className="mt-auto flex justify-end border-t border-solid border-border-light pt-3">
        <span className="h-8 w-28 rounded-lg bg-surface-subtle" />
      </span>
    </div>
  );
}
