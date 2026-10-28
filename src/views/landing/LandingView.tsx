/**
 * @file LandingView.tsx
 * @description Public landing page of SkillSwap (v2).
 */

import { KouKouChatWidget } from '@/components/domain/ai-chat/KouKouChatWidget';
import { BecomeMentorSection } from '@/components/domain/landing/BecomeMentorSection';
import { ComparisonSection } from '@/components/domain/landing/ComparisonSection';
import { HowItWorksSection } from '@/components/domain/landing/HowItWorksSection';
import { KooKooDemoSection } from '@/components/domain/landing/KooKooDemoSection';
import { LandingHeader } from '@/components/domain/landing/LandingHeader';
import { LandingHero } from '@/components/domain/landing/LandingHero';
import { MenteeCtaBanner } from '@/components/domain/landing/MenteeCtaBanner';
import { MentorShowcase } from '@/components/domain/landing/MentorShowcase';
import { MobileStickyCta } from '@/components/domain/landing/MobileStickyCta';
import { QuickFaq } from '@/components/domain/landing/QuickFaq';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { CONFIRMED_LANDING_FAQS } from '@/data/landingFaq';
import type { Mentor } from '@/models/entities';

interface LandingViewProps {
  locale: string;
  /** Public mentors for the showcase grid; empty when the API is unavailable. */
  mentors: Mentor[];
}

export function LandingView({ locale, mentors }: LandingViewProps) {
  const faqStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: CONFIRMED_LANDING_FAQS.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: answer,
      },
    })),
  };

  return (
    <div className="site-page site-has-mobile-bar min-h-screen w-full max-w-full overflow-x-clip bg-white font-site-body text-site-body">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqStructuredData).replace(/</g, '\u003c'),
        }}
      />
      <LandingHeader locale={locale} />
      <main>
        <LandingHero locale={locale} />
        <HowItWorksSection locale={locale} />
        <MentorShowcase mentors={mentors} locale={locale} />
        <KooKooDemoSection />
        <ComparisonSection />
        <BecomeMentorSection locale={locale} />
        <MenteeCtaBanner locale={locale} />
        <QuickFaq />
      </main>
      <SiteFooter locale={locale} topColor="var(--site-tint)" isLanding />
      <MobileStickyCta locale={locale} />
      <KouKouChatWidget />
    </div>
  );
}
