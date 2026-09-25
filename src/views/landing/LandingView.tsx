/**
 * @file LandingView.tsx
 * @description Màn hình landing page public của SkillSwap.
 */

import { HeroIntro } from '@/components/domain/landing/HeroIntro';
import { HeroVideo } from '@/components/domain/landing/HeroVideo';
import { AosInitializer } from '@/components/domain/landing/AosInitializer';
import { LandingFaq } from '@/components/domain/landing/LandingFaq';
import { LandingFooter } from '@/components/domain/landing/LandingFooter';
import { LandingHeader } from '@/components/domain/landing/LandingHeader';
import {
  FinalCta,
  HowItWorks,
  MenteeBenefits,
  MentorSection,
  MentorSteps,
  TransparentPricing,
  TrustStrip,
} from '@/components/domain/landing/LandingSections';

export function LandingView({ locale }: { locale: string }) {
  return (
    <div className="min-h-screen w-full max-w-full overflow-x-clip bg-white text-text-main">
      <AosInitializer />
      <LandingHeader locale={locale} />
      <main>
        <section className="landing-hero-canvas">
          <div className="landing-hero-glow" aria-hidden="true" />
          <div className="relative z-10 mx-auto grid min-w-0 w-[calc(100%_-_40px)] max-w-[1480px] items-center gap-8 pt-9 sm:pt-12 md:w-[calc(100%_-_64px)] md:pt-16 xl:min-h-[620px] xl:w-[calc(100%_-_96px)] xl:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] xl:gap-11 xl:pt-[74px]">
            <HeroIntro locale={locale} />
            <HeroVideo />
          </div>
          <div className="relative z-10 mt-12 pb-10 xl:mt-10 xl:pb-12">
            <TrustStrip />
          </div>
        </section>
        <MenteeBenefits locale={locale} />
        <HowItWorks />
        <MentorSection locale={locale} />
        <MentorSteps />
        <TransparentPricing />
        <LandingFaq />
        <FinalCta locale={locale} />
      </main>
      <LandingFooter locale={locale} />
    </div>
  );
}
