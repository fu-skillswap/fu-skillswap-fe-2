/**
 * @file BecomeMentorSection.tsx
 * @description Landing "Dành cho mentor" (#lam-mentor): benefits, an interactive 6-step stepper with a
 * mini mock of each app screen, the sample S-coin wallet and the registration CTAs.
 */

'use client';

import Link from 'next/link';
import { CalendarDays, Star, Wallet, type LucideIcon } from 'lucide-react';
import { useRef, useState, type KeyboardEvent } from 'react';
import {
  Highlight,
  Mascot,
  nextTabIndex,
  SITE_CONTAINER,
  SITE_HEADLINE,
  SpeechBubble,
} from '@/components/domain/landing/LandingPrimitives';
import { MENTOR_STEP_MOCKS } from '@/components/domain/landing/MentorStepMocks';
import { SampleWallet } from '@/components/domain/landing/SampleWallet';
import {
  BECOME_MENTOR_STEPS,
  MENTOR_BENEFITS,
  type BecomeMentorStepId,
  type MentorBenefitId,
} from '@/components/domain/landing/becomeMentor.constants';
import { publicHref } from '@/constants/publicSite';

const BENEFIT_ICONS: Partial<Record<MentorBenefitId, LucideIcon>> = {
  income: Wallet,
  schedule: CalendarDays,
  profile: Star,
};

function MentorSwoosh() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 400 300"
      className="pointer-events-none absolute top-10 right-[-200px] h-[390px] w-[520px] sm:right-[-80px]"
    >
      <path
        d="M40 260 C 120 40, 280 300, 380 40"
        fill="none"
        className="stroke-site-chip"
        strokeWidth="64"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Benefits() {
  return (
    <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(min(250px,100%),1fr))] gap-4 p-0">
      {MENTOR_BENEFITS.map((benefit) => {
        const Icon = BENEFIT_ICONS[benefit.id];
        // The 0% commission card is the blue, highlighted one.
        const isHighlight = benefit.id === 'commission';
        return (
          <li
            key={benefit.id}
            className={`flex flex-col gap-2.5 rounded-3xl p-6 ${
              isHighlight ? 'site-on-blue bg-site-blue text-white' : 'bg-site-tint'
            }`}
          >
            <span
              aria-hidden="true"
              className={`flex h-12 w-12 items-center justify-center rounded-[14px] ${
                isHighlight
                  ? 'bg-white font-site-display text-lg font-black text-site-blue'
                  : 'bg-site-blue text-white'
              }`}
            >
              {Icon ? <Icon className="h-6 w-6" strokeWidth={2} /> : '0%'}
            </span>
            <h4
              className={`m-0 font-site-ui text-lg font-bold ${isHighlight ? 'text-white' : 'text-site-ink'}`}
            >
              {benefit.title}
            </h4>
            <p
              className={`m-0 font-site-body text-[15px] leading-[23px] ${
                isHighlight ? 'text-site-on-blue' : 'text-site-muted'
              }`}
            >
              {benefit.description}
            </p>
          </li>
        );
      })}
    </ul>
  );
}

function MentorStepper() {
  const [stepId, setStepId] = useState<BecomeMentorStepId>(BECOME_MENTOR_STEPS[0].id);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const StepMock = MENTOR_STEP_MOCKS[stepId];

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const next = nextTabIndex(event.key, index, BECOME_MENTOR_STEPS.length, 'vertical');
    if (next === undefined) return;
    event.preventDefault();
    setStepId(BECOME_MENTOR_STEPS[next].id);
    tabRefs.current[next]?.focus();
  };

  return (
    <div className="flex flex-col gap-6">
      <h3 className="m-0 font-site-ui text-[22px] font-bold text-site-ink sm:text-[26px]">
        Trở thành mentor trong 6 bước
      </h3>
      <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <div
          role="tablist"
          aria-label="Các bước trở thành mentor"
          aria-orientation="vertical"
          className="flex min-w-0 flex-col gap-2"
        >
          {BECOME_MENTOR_STEPS.map((step, index) => {
            const isSelected = step.id === stepId;
            return (
              <button
                key={step.id}
                ref={(node) => {
                  tabRefs.current[index] = node;
                }}
                id={`landing-mentor-step-${step.id}`}
                type="button"
                role="tab"
                aria-selected={isSelected}
                aria-controls="landing-mentor-step-panel"
                tabIndex={isSelected ? 0 : -1}
                onClick={() => setStepId(step.id)}
                onKeyDown={(event) => handleKeyDown(event, index)}
                className={`flex w-full cursor-pointer items-start gap-3.5 rounded-[18px] border-[1.5px] border-solid px-4 py-3.5 text-left font-site-body transition-colors ${
                  isSelected
                    ? 'border-site-blue bg-white shadow-[0_10px_24px_rgba(37,99,235,0.14)]'
                    : 'border-transparent bg-transparent hover:bg-site-tint'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full font-site-display text-[15px] font-extrabold ${
                    isSelected ? 'bg-site-blue text-white' : 'bg-site-chip text-site-navy'
                  }`}
                >
                  {index + 1}
                </span>
                <span className="flex min-w-0 flex-col gap-[3px]">
                  <b className="font-site-ui text-base text-site-ink">
                    <span className="sr-only">Bước {index + 1}: </span>
                    {step.title}
                  </b>
                  <span className="text-sm leading-[21px] text-site-muted">{step.description}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div
          id="landing-mentor-step-panel"
          role="tabpanel"
          aria-labelledby={`landing-mentor-step-${stepId}`}
          className="flex min-w-0 flex-col justify-center rounded-[28px] bg-site-tint p-4 sm:p-7 lg:min-h-[470px]"
        >
          <StepMock />
        </div>
      </div>
    </div>
  );
}

export function BecomeMentorSection({ locale }: { locale: string }) {
  const registrationHref = publicHref(locale, 'mentorRegistration');
  const rulesHref = publicHref(locale, 'mentorRules');

  return (
    <section id="lam-mentor" className="relative overflow-hidden bg-white">
      <MentorSwoosh />
      <div
        className={`${SITE_CONTAINER} relative flex flex-col gap-14 pt-20 pb-20 sm:pt-[104px] sm:pb-24`}
      >
        <div className="flex flex-wrap items-end justify-between gap-8">
          <div className="flex min-w-0 flex-[1_1_560px] flex-col items-start gap-[18px]">
            <span className="rounded-full bg-site-navy px-3 py-1.5 font-site-ui text-sm font-bold text-white">
              0% hoa hồng năm học này
            </span>
            <h2 className={`${SITE_HEADLINE} max-w-[720px]`}>
              Bạn qua môn đó rồi?
              <br />
              <Highlight>Chia sẻ lại cho bạn khác.</Highlight>
            </h2>
            <p className="m-0 max-w-[560px] font-site-body text-[17px] leading-[26px] text-site-muted">
              Môn bạn từng học tốt, kỳ OJT bạn từng qua, đều là kinh nghiệm thực tế người khác đang
              cần. Tự đặt giá, tự mở giờ rảnh, nhận S-coin sau mỗi buổi.
            </p>
          </div>
          <div className="hidden items-end gap-2 min-[900px]:flex">
            <SpeechBubble tail="right" className="mb-20 max-w-[210px]">
              Đăng ký khoảng 5 phút thôi, KooKoo chỉ từng bước nè!
            </SpeechBubble>
            <Mascot width={140} className="-scale-x-100" />
          </div>
        </div>

        <Benefits />
        <MentorStepper />
        <SampleWallet />

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          {registrationHref && (
            <Link
              href={registrationHref}
              className="inline-flex min-h-14 items-center rounded-full bg-site-navy px-8 font-site-ui text-[17px] font-bold whitespace-nowrap text-white no-underline shadow-[0_12px_32px_rgba(30,58,138,0.25)] transition-colors hover:bg-site-ink"
            >
              Đăng ký làm mentor
            </Link>
          )}
          {/* Plain text until the mentor rules page exists (PUBLIC_ROUTES.mentorRules). */}
          {rulesHref ? (
            <Link
              href={rulesHref}
              className="inline-flex min-h-11 items-center px-1 font-site-ui text-base font-semibold text-site-blue hover:text-site-navy"
            >
              Đọc quy định dành cho mentor
            </Link>
          ) : (
            <span className="px-1 font-site-ui text-base font-semibold text-site-muted">
              Đọc quy định dành cho mentor
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
