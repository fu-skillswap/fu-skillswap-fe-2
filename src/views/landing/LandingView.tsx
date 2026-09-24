/**
 * @file LandingView.tsx
 * @description Màn hình landing page public của SkillSwap.
 */

import { ArrowRight, CalendarDays, Tag, UsersRound } from 'lucide-react';
import Link from 'next/link';
import { HeroCarousel } from '@/components/domain/landing/HeroCarousel';
import { LandingFaq } from '@/components/domain/landing/LandingFaq';
import { LandingFooter } from '@/components/domain/landing/LandingFooter';
import { LandingHeader } from '@/components/domain/landing/LandingHeader';
import {
  FeaturedCourses,
  FinalCta,
  HowItWorks,
  MenteeBenefits,
  MentorSection,
  MentorSteps,
  SocialProof,
  TransparentPricing,
  TrustStrip,
  VideoIntro,
} from '@/components/domain/landing/LandingSections';

export function LandingView({ locale }: { locale: string }) {
  return (
    <div className="min-h-screen w-full max-w-full overflow-x-clip bg-white text-text-main">
      <LandingHeader locale={locale} />
      <main>
        <section className="landing-hero-canvas">
          <div className="landing-hero-glow" aria-hidden="true" />
          <div className="relative z-10 mx-auto grid min-w-0 w-[calc(100%_-_40px)] max-w-[1440px] items-center gap-10 pt-11 md:w-[calc(100%_-_64px)] md:pt-13 xl:w-[calc(100%_-_96px)] xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] xl:gap-14 xl:pt-15">
            <div className="min-w-0 max-w-[620px]">
              <p className="landing-load-reveal landing-load-delay-1 mb-6 flex items-center gap-4 text-[13px] font-bold tracking-[0.14em] text-primary uppercase sm:text-sm">
                <span className="h-0.5 w-10 rounded-full bg-primary" aria-hidden="true" />
                Học từ người đi trước
              </p>
              <h1 className="landing-load-reveal landing-load-delay-2 max-w-[620px] text-[clamp(2.5rem,4.1vw,4.25rem)] leading-[1.02] font-extrabold tracking-[-0.035em] text-[#123568]">
                Học đúng người.
                <br />
                <span className="text-primary">Tiến nhanh hơn.</span>
              </h1>
              <p className="landing-load-reveal landing-load-delay-3 mt-7 max-w-[590px] text-base leading-[1.65] text-[#516985] sm:text-[17px]">
                Khám phá mentor phù hợp hoặc các khóa học ngắn
                <br className="hidden sm:block" /> để phát triển kỹ năng theo cách của bạn.
              </p>
              <div className="landing-load-reveal landing-load-delay-4 mt-8 flex flex-col gap-3.5 sm:flex-row sm:gap-4.5">
                <Link
                  href={`/${locale}/mentor-booking`}
                  className="inline-flex h-[60px] min-w-[280px] items-center justify-center gap-3 rounded-xl bg-primary px-7 text-base font-bold text-white shadow-blue transition hover:-translate-y-px hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  Tìm mentor phù hợp
                  <ArrowRight className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
                </Link>
                <a
                  href="#courses"
                  className="inline-flex h-[60px] min-w-[250px] items-center justify-center rounded-xl border border-primary bg-white px-7 text-base font-bold text-primary transition hover:-translate-y-px hover:bg-primary-light hover:shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  Khám phá khóa học
                </a>
              </div>
              <div className="landing-load-reveal landing-load-delay-5 mt-9 flex max-w-[600px] flex-wrap items-center gap-y-4 text-sm font-medium text-[#435b78]">
                {[
                  [Tag, 'Giá rõ ràng'],
                  [CalendarDays, 'Lịch linh hoạt'],
                  [UsersRound, 'Mentor thực tế'],
                ].map(([Icon, label], index) => (
                  <div
                    key={label as string}
                    className={`flex items-center gap-3 ${index > 0 ? 'ml-6 border-l border-[#dde8f3] pl-6' : ''}`}
                  >
                    <Icon className="h-6 w-6 text-primary" strokeWidth={1.9} aria-hidden="true" />
                    <span>{label as string}</span>
                  </div>
                ))}
              </div>
            </div>
            <HeroCarousel />
          </div>
          <div className="relative z-10 mt-10 pb-8 md:mt-11 md:pb-10">
            <TrustStrip />
          </div>
        </section>
        <MenteeBenefits />
        <FeaturedCourses />
        <HowItWorks />
        <VideoIntro />
        <MentorSection locale={locale} />
        <MentorSteps />
        <TransparentPricing />
        <SocialProof />
        <LandingFaq />
        <FinalCta locale={locale} />
      </main>
      <LandingFooter locale={locale} />
    </div>
  );
}
