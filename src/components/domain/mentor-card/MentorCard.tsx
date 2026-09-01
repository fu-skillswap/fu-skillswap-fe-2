/**
 * @file MentorCard.tsx
 * @description Thẻ khám phá Mentor dạng dọc, hiển thị thông tin cốt lõi để Mentee dễ so sánh.
 */

import { BadgeCheck, Star } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { Mentor } from '@/models/entities';

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('');
}

interface MentorCardProps {
  mentor: Mentor;
  onSelect: (mentor: Mentor) => void;
}

/** Thẻ thông tin tóm tắt dùng trong danh sách khám phá Mentor. */
export function MentorCard({ mentor, onSelect }: MentorCardProps) {
  const headlineParts = mentor.headline
    ?.split('|')
    .map((part) => part.trim())
    .filter(Boolean);
  const role = headlineParts?.[0] || mentor.expertise[0] || 'Mentor';
  const headlineSkills = (headlineParts?.slice(1).join(',') || '')
    .split(',')
    .map((skill) => skill.trim())
    .filter(Boolean);
  const hasCombinedHeadline = (headlineParts?.length || 0) > 1;
  const skills = [...new Set([...headlineSkills, ...mentor.expertise])].filter(
    (skill) => !hasCombinedHeadline || skill !== mentor.headline,
  );
  const visibleSkillCount = skills.length > 3 ? 2 : 3;
  const visibleSkills = skills.slice(0, visibleSkillCount);
  const remainingSkillCount = Math.max(skills.length - visibleSkills.length, 0);
  const description = mentor.bio && mentor.bio !== mentor.headline ? mentor.bio : undefined;

  return (
    <article className="group mx-auto flex h-full min-h-[430px] w-full max-w-[280px] flex-col rounded-2xl border border-solid border-border-color/70 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-border hover:shadow-md">
      <div className="flex flex-1 flex-col items-center text-center">
        {mentor.avatarUrl ? (
          <img
            src={mentor.avatarUrl}
            alt={`Ảnh đại diện của ${mentor.name}`}
            className="h-24 w-24 shrink-0 rounded-full border border-solid border-primary-border/60 bg-primary-light object-cover ring-4 ring-primary-light"
          />
        ) : (
          <span
            className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border border-solid border-primary-border/60 bg-primary-light text-2xl font-bold text-primary ring-4 ring-primary-light"
            aria-label={`Ảnh đại diện mặc định của ${mentor.name}`}
          >
            {initials(mentor.name)}
          </span>
        )}

        <div className="mt-4 w-full min-w-0">
          <h2 className="m-0 flex min-w-0 items-center justify-center gap-1.5 text-lg font-bold tracking-tight text-text-main">
            <span className="truncate">{mentor.name}</span>
            {mentor.isVerified && (
              <BadgeCheck
                className="h-[18px] w-[18px] shrink-0 fill-primary text-white"
                aria-label="Mentor đã xác thực"
              />
            )}
          </h2>
          <p className="mt-1 min-h-10 break-words text-sm font-semibold leading-5 text-primary">
            {role}
          </p>
        </div>

        <div className="mt-3 flex min-h-6 items-center justify-center gap-1.5 text-sm text-text-secondary">
          <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
          <strong className="font-semibold text-text-main">
            {mentor.rating !== null ? mentor.rating.toFixed(1) : 'Chưa có đánh giá'}
          </strong>
          {mentor.reviewCount !== undefined && (
            <span className="text-text-muted">({mentor.reviewCount})</span>
          )}
        </div>

        <div className="mt-3 flex min-h-[64px] flex-wrap content-start justify-center gap-1.5">
          {visibleSkills.length > 0 && (
            <>
              {visibleSkills.map((skill, index) => (
                <span
                  key={`${skill}-${index}`}
                  className="max-w-full break-words rounded-full border border-solid border-border-color bg-surface-subtle px-3 py-1.5 text-xs font-medium leading-4 text-text-secondary"
                >
                  {skill}
                </span>
              ))}
              {remainingSkillCount > 0 && (
                <span className="rounded-full border border-solid border-border-color bg-surface-subtle px-3 py-1.5 text-xs font-semibold text-text-secondary">
                  +{remainingSkillCount}
                </span>
              )}
            </>
          )}
        </div>

        <div className="mt-5 min-h-[44px]">
          {description && (
            <p className="m-0 line-clamp-2 text-sm leading-relaxed text-text-muted">
              {description}
            </p>
          )}
        </div>
      </div>

      <Button
        type="button"
        size="lg"
        className="mt-5 h-11 w-full rounded-xl"
        onClick={() => onSelect(mentor)}
        aria-label={`Xem hồ sơ của ${mentor.name}`}
      >
        Xem thêm
      </Button>
    </article>
  );
}
