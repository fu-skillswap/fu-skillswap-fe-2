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
    <article className="group flex min-h-[455px] w-full flex-col rounded-[18px] border border-solid border-[#dfeaf4] bg-white p-5 shadow-[0_6px_20px_rgba(31,78,124,0.045)] transition-all duration-200 hover:-translate-y-[3px] hover:border-primary/25 hover:shadow-[0_14px_30px_rgba(31,78,124,0.08)] sm:p-6">
      <div className="grid grid-cols-[80px_minmax(0,1fr)] items-center gap-4 sm:grid-cols-[96px_minmax(0,1fr)]">
        {mentor.avatarUrl ? (
          <img
            src={mentor.avatarUrl}
            alt={`Ảnh đại diện của ${mentor.name}`}
            className="h-20 w-20 shrink-0 rounded-full border-4 border-solid border-[#e9f4ff] bg-primary-light object-cover sm:h-24 sm:w-24"
          />
        ) : (
          <span
            className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 border-solid border-[#e9f4ff] bg-primary-light text-2xl font-bold text-primary sm:h-24 sm:w-24"
            aria-label={`Ảnh đại diện mặc định của ${mentor.name}`}
          >
            {initials(mentor.name)}
          </span>
        )}

        <div className="min-w-0">
          <h2 className="m-0 flex min-w-0 items-center gap-1.5 text-lg leading-tight font-bold tracking-tight text-[#0b2554] sm:text-xl">
            <span className="line-clamp-2">{mentor.name}</span>
            {mentor.isVerified && (
              <BadgeCheck
                className="h-[18px] w-[18px] shrink-0 fill-primary text-white"
                aria-label="Mentor đã xác thực"
              />
            )}
          </h2>
          <p className="mt-1.5 break-words text-[15px] leading-5 font-semibold text-primary sm:text-base">
            {role}
          </p>
        </div>
      </div>

      <div className="mt-5 flex min-h-6 items-center gap-2 text-sm text-text-secondary">
        <Star className="h-5 w-5 fill-amber-400 text-amber-400" aria-hidden="true" />
        <strong className="font-bold text-[#0b2554]">
          {mentor.rating !== null ? mentor.rating.toFixed(1) : 'Chưa có đánh giá'}
        </strong>
        {mentor.reviewCount !== undefined && (
          <span className="text-text-muted">({mentor.reviewCount} đánh giá)</span>
        )}
      </div>

      <div className="mt-4 min-h-[72px]">
        {description && (
          <p className="m-0 line-clamp-3 text-[14.5px] leading-6 text-[#566c85]">{description}</p>
        )}
      </div>

      <div className="mt-4 flex min-h-[70px] flex-wrap content-start gap-2">
        {visibleSkills.map((skill, index) => (
          <span
            key={`${skill}-${index}`}
            className="inline-flex min-h-8 max-w-full items-center rounded-[11px] border border-solid border-[#e0e9f2] bg-[#f7fafd] px-3 text-[13px] leading-4 font-medium text-[#50647b]"
          >
            {skill}
          </span>
        ))}
        {remainingSkillCount > 0 && (
          <span className="inline-flex h-8 items-center rounded-[11px] border border-solid border-[#e0e9f2] bg-[#f7fafd] px-3 text-[13px] font-semibold text-[#50647b]">
            +{remainingSkillCount}
          </span>
        )}
      </div>

      <div className="mt-auto border-t border-solid border-[#e7eef5] pt-5">
        <Button
          type="button"
          size="lg"
          className="h-12 w-full rounded-xl text-[15px]"
          onClick={() => onSelect(mentor)}
          aria-label={`Xem hồ sơ của ${mentor.name}`}
        >
          Xem thêm
        </Button>
      </div>
    </article>
  );
}
