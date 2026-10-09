/**
 * @file MentorCard.tsx
 * @description Thẻ khám phá Mentor dạng dọc: ảnh, tên, mô tả ngắn, lý do hợp với Mentee (nếu có),
 * kỹ năng, đánh giá và giá, kèm hai thao tác xem hồ sơ / xem lịch trống.
 */

import { BadgeCheck, Star } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { Mentor } from '@/models/entities';

const MAX_SKILLS = 3;

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(-2)
    .join('')
    .toUpperCase();
}

const sameText = (left?: string, right?: string) =>
  Boolean(left && right && left.trim().toLowerCase() === right.trim().toLowerCase());

export function formatMentorRating(rating: number) {
  return rating.toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

export function MentorAvatar({ mentor, size }: { mentor: Mentor; size: 48 | 56 }) {
  const sizeClass = size === 48 ? 'h-12 w-12 text-sm' : 'h-14 w-14 text-base';
  return (
    <span className="relative shrink-0">
      <span
        className={`flex ${sizeClass} items-center justify-center overflow-hidden rounded-full bg-primary-light font-extrabold text-primary`}
      >
        {mentor.avatarUrl ? (
          <img
            src={mentor.avatarUrl}
            alt={`Ảnh đại diện của ${mentor.name}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <span aria-hidden="true">{initials(mentor.name)}</span>
        )}
      </span>
      {mentor.isVerified && (
        <BadgeCheck
          className="absolute -right-0.5 -bottom-0.5 h-[18px] w-[18px] rounded-full bg-white fill-primary text-white"
          aria-label="Mentor đã xác thực"
        />
      )}
    </span>
  );
}

interface MentorCardProps {
  mentor: Mentor;
  /** Opens the mentor's profile (MentorDetail). */
  onSelect: (mentor: Mentor) => void;
  /** Why this mentor fits the current mentee (from recommendations). */
  matchReason?: string;
  /** Opens the mentor's schedule; defaults to `onSelect`. */
  onViewSchedule?: (mentor: Mentor) => void;
}

/** Thẻ thông tin tóm tắt dùng trong danh sách khám phá Mentor. */
export function MentorCard({ mentor, onSelect, matchReason, onViewSchedule }: MentorCardProps) {
  const headline = mentor.headline?.trim() || mentor.organization?.trim();
  const skills = [...new Set(mentor.expertise.map((skill) => skill.trim()).filter(Boolean))]
    .filter((skill) => !sameText(skill, headline))
    .slice(0, MAX_SKILLS);
  const description = mentor.bio && !sameText(mentor.bio, headline) ? mentor.bio : undefined;
  const hasReviews = (mentor.reviewCount ?? 0) > 0 && mentor.rating !== null;

  return (
    <article className="flex h-full w-full flex-col gap-3.5 rounded-[20px] border border-solid border-slate-200 bg-white p-5 transition-shadow hover:shadow-[0_10px_28px_rgba(16,50,90,0.08)]">
      <div className="flex items-start gap-3">
        <MentorAvatar mentor={mentor} size={56} />
        <div className="min-w-0 pt-0.5">
          <h3 className="m-0 truncate text-[16.5px] font-bold text-text-main">{mentor.name}</h3>
          {headline && (
            <p className="m-0 mt-0.5 line-clamp-2 text-[13.5px] leading-snug text-slate-600">
              {headline}
            </p>
          )}
        </div>
      </div>

      {matchReason && (
        <p className="m-0 flex items-start gap-2 rounded-xl bg-primary-light px-3 py-2 text-[13px] leading-snug text-slate-700">
          <img src="/images/Koko.png" alt="" className="mt-px h-[18px] w-[18px] object-contain" />
          <span>
            <b className="text-text-main">Hợp với bạn:</b> {matchReason}
          </span>
        </p>
      )}

      {description && (
        <p className="m-0 line-clamp-2 text-sm leading-relaxed text-slate-600">{description}</p>
      )}

      {skills.length > 0 && (
        <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0" aria-label="Kỹ năng">
          {skills.map((skill) => (
            <li
              key={skill}
              className="max-w-full truncate rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-700"
            >
              {skill}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto flex flex-col gap-3.5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl bg-slate-50 px-3 py-2.5 text-[13px] text-slate-600">
          {hasReviews ? (
            <span className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
              <b className="text-text-main">{formatMentorRating(mentor.rating as number)}</b>
              <span>({mentor.reviewCount} đánh giá)</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-green-500" aria-hidden="true" />
              Mentor mới
            </span>
          )}
          {mentor.startingPrice === 0 ? (
            <span>
              Buổi đầu <b className="text-text-main">miễn phí</b>
            </span>
          ) : mentor.startingPrice !== undefined ? (
            <span>
              Từ{' '}
              <b className="text-text-main">
                {new Intl.NumberFormat('vi-VN').format(mentor.startingPrice)} S-coins
              </b>{' '}
              / buổi
            </span>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-11"
            onClick={() => onSelect(mentor)}
            aria-label={`Xem hồ sơ của ${mentor.name}`}
          >
            Xem hồ sơ
          </Button>
          <Button
            type="button"
            className="h-11"
            onClick={() => (onViewSchedule ?? onSelect)(mentor)}
            aria-label={`Xem lịch trống của ${mentor.name}`}
          >
            Xem lịch trống
          </Button>
        </div>
      </div>
    </article>
  );
}

export function MentorCardSkeleton() {
  return (
    <div
      className="flex flex-col gap-3.5 rounded-[20px] border border-solid border-slate-200 bg-white p-5 animate-pulse motion-reduce:animate-none"
      aria-hidden="true"
    >
      <div className="flex items-center gap-3">
        <span className="h-14 w-14 rounded-full bg-surface-subtle" />
        <span className="flex-1 space-y-2">
          <span className="block h-4 w-32 rounded bg-surface-subtle" />
          <span className="block h-3 w-44 rounded bg-surface-subtle" />
        </span>
      </div>
      <span className="block h-3.5 w-full rounded bg-surface-subtle" />
      <span className="block h-3.5 w-2/3 rounded bg-surface-subtle" />
      <span className="flex gap-1.5">
        <span className="h-5 w-14 rounded-full bg-surface-subtle" />
        <span className="h-5 w-16 rounded-full bg-surface-subtle" />
      </span>
      <span className="block h-10 rounded-xl bg-surface-subtle" />
      <span className="grid grid-cols-2 gap-2">
        <span className="h-11 rounded-xl bg-surface-subtle" />
        <span className="h-11 rounded-xl bg-surface-subtle" />
      </span>
    </div>
  );
}
