/**
 * @file MatchPanel.tsx
 * @description Khối "Mentor hợp với bạn" đầu trang Tìm Mentor: tối đa 3 mentor KouKou gợi ý,
 * mỗi thẻ có một lý do phù hợp và nút xem lịch trống.
 */

'use client';

import { MentorAvatar } from '@/components/domain/mentor-card/MentorCard';
import { Button } from '@/components/ui/Button';
import type { Mentor } from '@/models/entities';
import type { RecommendedMentor } from '@/views/mentee/dashboard/useMentorRecommendations';
import { Check } from 'lucide-react';
import Link from 'next/link';
import { openKouKou } from './AskKouKouCard';

/** The mentee's academic profile used in the captions. */
export interface MatchProfile {
  programName: string;
  semester: number;
}

const panelClass =
  'rounded-[24px] border border-solid border-[rgba(147,197,253,.6)] bg-[linear-gradient(115deg,#F4FAFF,#EEF7FF_56%,#E8F4FF)] p-6';

function KokoTile({ size }: { size: 44 | 52 }) {
  const sizeClass = size === 44 ? 'h-11 w-11' : 'h-[52px] w-[52px]';
  return (
    <span
      className={`flex ${sizeClass} shrink-0 items-center justify-center rounded-2xl bg-white shadow-[0_4px_14px_rgba(32,79,126,.08)]`}
    >
      <img src="/images/Koko.png" alt="" className="h-[78%] w-[78%] object-contain" />
    </span>
  );
}

export function MatchPanel({
  items,
  reranked,
  isLoading,
  profile,
  locale,
  onViewSchedule,
}: {
  items: RecommendedMentor[];
  reranked: boolean;
  isLoading: boolean;
  /** `undefined` while loading or when the profile could not be read. */
  profile?: MatchProfile;
  locale: string;
  onViewSchedule: (mentor: Mentor) => void;
}) {
  return (
    <section className={panelClass} aria-labelledby="mentor-match-heading">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <KokoTile size={52} />
          <div className="min-w-0">
            <h2 id="mentor-match-heading" className="m-0 text-xl font-extrabold text-text-main">
              Mentor hợp với bạn
            </h2>
            <p className="m-0 mt-0.5 text-sm text-slate-600">
              {!reranked ? (
                'Gợi ý theo ngành và học kỳ của bạn.'
              ) : profile ? (
                <>
                  KouKou ghép theo hồ sơ của bạn: <b>{profile.programName}</b>,{' '}
                  <b>học kỳ {profile.semester}</b>.{' '}
                  <Link
                    href={`/${locale}/profile`}
                    className="font-semibold text-primary no-underline hover:underline"
                  >
                    Cập nhật hồ sơ
                  </Link>
                </>
              ) : (
                'KouKou ghép theo hồ sơ và mục tiêu học của bạn.'
              )}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={openKouKou}
          className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-solid border-primary-border bg-white px-3.5 text-sm font-bold text-text-main transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
        >
          <img src="/images/Koko.png" alt="" className="h-5 w-5 object-contain" />
          Nhờ KouKou tìm theo nhu cầu
        </button>
      </div>

      <div className="mt-5 flex flex-wrap gap-3.5">
        {isLoading ? (
          <>
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className="h-[180px] flex-1 basis-[260px] animate-pulse rounded-[18px] bg-white/80 motion-reduce:animate-none"
                aria-hidden="true"
              />
            ))}
            <span className="sr-only" role="status">
              Đang tìm mentor hợp với bạn…
            </span>
          </>
        ) : (
          items.map((item, index) => (
            <MatchCard
              key={item.mentor.id}
              item={item}
              isTop={reranked && index === 0}
              onViewSchedule={onViewSchedule}
            />
          ))
        )}
      </div>
    </section>
  );
}

function MatchCard({
  item,
  isTop,
  onViewSchedule,
}: {
  item: RecommendedMentor;
  isTop: boolean;
  onViewSchedule: (mentor: Mentor) => void;
}) {
  const { mentor } = item;
  const reason = item.aiReason ?? item.matchReason;
  const headline = mentor.headline || mentor.organization;

  return (
    <article
      className={`relative flex min-w-0 flex-1 basis-[260px] flex-col gap-3 rounded-[18px] bg-white p-4 ${
        isTop
          ? 'border-[1.5px] border-solid border-[#7CC4FA]'
          : 'border border-solid border-slate-200'
      }`}
    >
      {isTop && (
        <span className="absolute -top-[11px] left-4 rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-bold text-white ring-[3px] ring-[#EEF7FF]">
          Hợp nhất với bạn
        </span>
      )}
      <div className="flex items-center gap-3">
        <MentorAvatar mentor={mentor} size={48} />
        <div className="min-w-0">
          <h3 className="m-0 truncate text-[15px] font-bold text-text-main">{mentor.name}</h3>
          {headline && <p className="m-0 truncate text-[13px] text-slate-600">{headline}</p>}
        </div>
      </div>
      {reason && (
        <p className="m-0 flex items-start gap-1.5 text-[13px] leading-snug text-slate-700">
          <Check className="mt-px h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <span className="line-clamp-2">{reason}</span>
        </p>
      )}
      <Button
        type="button"
        className="mt-auto h-11 w-full"
        onClick={() => onViewSchedule(mentor)}
        aria-label={`Xem lịch trống của ${mentor.name}`}
      >
        Xem lịch trống
      </Button>
    </article>
  );
}

/** Slim banner used instead of the panel when only a few mentors are listed. */
export function FewMentorsBanner({
  profile,
  hasMatches,
}: {
  profile?: MatchProfile;
  hasMatches: boolean;
}) {
  return (
    <section className={`${panelClass} flex items-center gap-3.5 !py-5`}>
      <KokoTile size={44} />
      <div className="min-w-0">
        <h2 className="m-0 text-lg font-extrabold text-text-main">Tìm mentor hợp với bạn</h2>
        <p className="m-0 mt-0.5 text-sm text-slate-600">
          {!hasMatches
            ? 'Xem hồ sơ và lịch trống của từng mentor, hoặc hỏi KouKou nếu chưa thấy người hợp.'
            : profile
              ? `KouKou đã đánh dấu mentor hợp với hồ sơ của bạn (${profile.programName}, học kỳ ${profile.semester}) ngay trên từng thẻ.`
              : 'KouKou đã đánh dấu mentor hợp với hồ sơ của bạn ngay trên từng thẻ.'}
        </p>
      </div>
    </section>
  );
}
