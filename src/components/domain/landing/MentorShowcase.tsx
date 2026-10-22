/**
 * @file MentorShowcase.tsx
 * @description Landing "#mentor" section: real mentors (public GET /api/mentors) rendered with the
 * shared MentorCard, filter chips and a "Chưa thấy người hợp?" card.
 */

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { MentorCard } from '@/components/domain/mentor-card/MentorCard';
import {
  Highlight,
  Mascot,
  SITE_CONTAINER,
  SITE_HEADLINE,
} from '@/components/domain/landing/LandingPrimitives';
import {
  LANDING_MENTOR_LIMIT,
  MENTOR_FILTERS,
  type MentorFilterId,
} from '@/components/domain/landing/landing.constants';
import { findMentorHref, publicHref } from '@/constants/publicSite';
import type { Mentor } from '@/models/entities';

const PANEL_ID = 'landing-mentor-panel';

function mentorSearchText(mentor: Mentor) {
  return [mentor.headline, mentor.bio, mentor.organization, mentor.category, ...mentor.expertise]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function NoMatchCard({ locale }: { locale: string }) {
  const boardHref = publicHref(locale, 'communityBoard');
  return (
    <article className="flex flex-col gap-3.5 rounded-[22px] border-2 border-dashed border-site-sky bg-[#fbfdff] p-[26px]">
      <Mascot variant="icon" width={84} className="-m-2.5" />
      <h3 className="m-0 font-site-ui text-[19px] font-bold text-site-ink">Chưa thấy người hợp?</h3>
      <p className="m-0 font-site-body text-[15px] leading-[23px] text-site-muted">
        Kể cho KooKoo bạn cần gì: môn đang học, đồ án hay chuẩn bị OJT. KooKoo sẽ tìm trong danh
        sách mentor giúp bạn.
      </p>
      <a
        href="#koukou"
        className="mt-auto flex min-h-12 items-center justify-center rounded-xl border-[1.5px] border-solid border-site-blue font-site-ui text-[15px] font-bold whitespace-nowrap text-site-blue no-underline transition-colors hover:bg-site-tint"
      >
        Hỏi KooKoo
      </a>
      {boardHref && (
        <Link
          href={boardHref}
          className="inline-flex min-h-11 items-center self-center font-site-ui text-sm font-semibold text-site-blue hover:text-site-navy"
        >
          Đăng câu hỏi lên Bảng tin
        </Link>
      )}
    </article>
  );
}

export function MentorShowcase({ mentors, locale }: { mentors: Mentor[]; locale: string }) {
  const router = useRouter();
  const [filterId, setFilterId] = useState<MentorFilterId>('all');
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const activeFilter = MENTOR_FILTERS.find(({ id }) => id === filterId) ?? MENTOR_FILTERS[0];

  const visibleMentors = useMemo(() => {
    const terms: readonly string[] = activeFilter.terms;
    const matches = terms.length
      ? mentors.filter((mentor) => {
          const text = mentorSearchText(mentor);
          return terms.some((term) => text.includes(term));
        })
      : mentors;
    return matches.slice(0, LANDING_MENTOR_LIMIT);
  }, [activeFilter, mentors]);

  // Profile and schedule both live behind the find-mentor page's `?mentorId=` deep link.
  const openMentor = (mentor: Mentor) =>
    router.push(
      `${findMentorHref(locale)}?mentorId=${encodeURIComponent(mentor.mentorUserId || mentor.id)}`,
    );

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = MENTOR_FILTERS.length - 1;
    const next =
      event.key === 'ArrowRight'
        ? (index + 1) % MENTOR_FILTERS.length
        : event.key === 'ArrowLeft'
          ? (index - 1 + MENTOR_FILTERS.length) % MENTOR_FILTERS.length
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? last
              : undefined;
    if (next === undefined) return;
    event.preventDefault();
    setFilterId(MENTOR_FILTERS[next].id);
    tabRefs.current[next]?.focus();
  };

  return (
    <section id="mentor" className="bg-white">
      <div className={`${SITE_CONTAINER} flex flex-col gap-7 pt-20 pb-20 sm:pt-[88px]`}>
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div className="flex min-w-0 items-end gap-4">
            <Mascot width={84} className="hidden w-16 sm:block sm:w-[84px]" />
            <h2 className={`${SITE_HEADLINE} max-w-[640px]`}>
              Người thật, môn thật,
              <br />
              <Highlight>kinh nghiệm thật.</Highlight>
            </h2>
          </div>
          <Link
            href={findMentorHref(locale, activeFilter.query)}
            className="inline-flex min-h-11 items-center font-site-ui text-base font-semibold whitespace-nowrap text-site-blue hover:text-site-navy"
          >
            Xem tất cả mentor
          </Link>
        </div>

        <div role="tablist" aria-label="Lọc theo môn hoặc kỹ năng" className="flex flex-wrap gap-2">
          {MENTOR_FILTERS.map((filter, index) => {
            const isSelected = filter.id === filterId;
            return (
              <button
                key={filter.id}
                ref={(node) => {
                  tabRefs.current[index] = node;
                }}
                id={`landing-mentor-tab-${filter.id}`}
                type="button"
                role="tab"
                aria-selected={isSelected}
                aria-controls={PANEL_ID}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => setFilterId(filter.id)}
                onKeyDown={(event) => handleTabKeyDown(event, index)}
                className={`min-h-11 cursor-pointer rounded-full border-[1.5px] border-solid px-[18px] font-site-ui text-[15px] font-semibold whitespace-nowrap transition-colors ${
                  isSelected
                    ? 'border-site-blue bg-site-blue text-white'
                    : 'border-site-line-strong bg-white text-site-body hover:border-site-blue hover:text-site-blue'
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        <div
          id={PANEL_ID}
          role="tabpanel"
          aria-labelledby={`landing-mentor-tab-${filterId}`}
          className="flex flex-col gap-5"
        >
          {visibleMentors.length === 0 && (
            <p className="m-0 font-site-body text-[15px] text-site-muted">
              {filterId === 'all'
                ? 'Danh sách mentor đang được cập nhật.'
                : `Chưa có mentor nào khớp “${activeFilter.label}” trong danh sách nổi bật.`}
            </p>
          )}
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(300px,100%),1fr))] gap-5">
            {visibleMentors.map((mentor) => (
              <MentorCard
                key={mentor.id}
                mentor={mentor}
                onSelect={openMentor}
                onViewSchedule={openMentor}
              />
            ))}
            <NoMatchCard locale={locale} />
          </div>
        </div>
      </div>
    </section>
  );
}
