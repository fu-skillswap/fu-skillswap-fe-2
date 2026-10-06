/**
 * @file LandingFooter.tsx
 * @description Footer public của SkillSwap, chỉ sử dụng route hiện có.
 */

import Image from 'next/image';
import Link from 'next/link';
import { Music2, Play, Share2 } from 'lucide-react';
import { CONTACT_EMAIL, SOCIAL_LINKS } from '@/constants/contact';

const socialIcons = {
  facebook: Share2,
  tiktok: Music2,
  youtube: Play,
} as const;

export function LandingFooter({ locale }: { locale: string }) {
  const linkClassName =
    'w-fit text-sm leading-5 text-[#536a84] transition-colors duration-150 hover:text-primary focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#eaf5ff] sm:text-[15px]';
  const socialClassName =
    'grid h-11 w-11 place-items-center rounded-full border border-primary/35 bg-white/55 text-[#516984] transition hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#eaf5ff] sm:h-12 sm:w-12';
  const hasSocialLinks = SOCIAL_LINKS.length > 0;

  return (
    <footer className="relative isolate overflow-hidden border-t border-primary/30 bg-[radial-gradient(circle_at_0%_100%,rgba(17,156,247,0.12),transparent_24%),radial-gradient(circle_at_100%_100%,rgba(17,156,247,0.11),transparent_26%),linear-gradient(180deg,#eff7ff_0%,#e7f3ff_100%)] before:pointer-events-none before:absolute before:-bottom-52 before:-left-48 before:-z-10 before:h-[360px] before:w-[360px] before:rounded-full before:bg-primary/[0.07] before:content-[''] after:pointer-events-none after:absolute after:-right-56 after:-bottom-60 after:-z-10 after:h-[430px] after:w-[430px] after:rounded-full after:bg-primary/[0.075] after:content-['']">
      <div
        className={`relative z-10 mx-auto w-[calc(100%_-_40px)] max-w-[1480px] pt-10 sm:w-[calc(100%_-_48px)] sm:pt-12 md:grid md:grid-cols-[1.4fr_1fr_1fr] md:gap-y-8 lg:pt-12 xl:w-[calc(100%_-_96px)] ${hasSocialLinks ? 'xl:grid-cols-[1.65fr_0.85fr_0.85fr_0.85fr]' : 'xl:grid-cols-[1.65fr_0.85fr_0.85fr]'}`}
      >
        <div className="border-b border-[#12386e]/10 pb-6 md:border-b-0 md:pr-8 xl:pr-12">
          <Image
            src="/images/SkillSwap_Logo_Text.png"
            alt="SkillSwap"
            width={246}
            height={82}
            className="h-auto w-[180px] object-contain sm:w-[205px]"
          />
          <p className="mt-3 text-base leading-6 font-bold text-[#12386e] sm:text-[17px]">
            Kết nối tri thức. Trao giá trị thật.
          </p>
          <p className="mt-2 max-w-[360px] text-sm leading-[1.55] text-[#536a84]">
            Kết nối mentor và mentee qua những trải nghiệm học tập linh hoạt.
          </p>
        </div>

        <nav
          aria-label="Sản phẩm"
          className="border-b border-[#12386e]/10 py-6 md:border-b-0 md:px-7 md:py-0 xl:border-l xl:border-[#12386e]/10 xl:pl-10"
        >
          <h2 className="text-base leading-6 font-bold text-[#12386e] sm:text-[17px]">Sản phẩm</h2>
          <ul className="mt-4 grid gap-2.5 sm:gap-3">
            <li>
              <a href="#mentee" className={linkClassName}>
                Dành cho mentee
              </a>
            </li>
            <li>
              <a href="#mentor" className={linkClassName}>
                Dành cho mentor
              </a>
            </li>
            <li>
              <a href="#courses" className={linkClassName}>
                Khóa học ngắn
              </a>
            </li>
            <li>
              <a href="#pricing" className={linkClassName}>
                Chi phí
              </a>
            </li>
          </ul>
        </nav>

        <nav
          aria-label="Hỗ trợ"
          className="border-b border-[#12386e]/10 py-6 md:border-b-0 md:pr-0 md:pl-7 md:py-0 xl:border-l xl:border-[#12386e]/10 xl:px-10"
        >
          <h2 className="text-base leading-6 font-bold text-[#12386e] sm:text-[17px]">Hỗ trợ</h2>
          <ul className="mt-4 grid gap-2.5 sm:gap-3">
            <li>
              <a href="#faq" className={linkClassName}>
                Câu hỏi thường gặp
              </a>
            </li>
            <li>
              <Link href={`/${locale}/login`} className={linkClassName}>
                Đăng nhập
              </Link>
            </li>
            {CONTACT_EMAIL ? (
              <li>
                <a href={`mailto:${CONTACT_EMAIL}`} className={linkClassName}>
                  Liên hệ
                </a>
              </li>
            ) : null}
          </ul>
        </nav>

        {hasSocialLinks ? (
          <div className="py-6 md:col-span-3 md:py-0 xl:col-span-1 xl:border-l xl:border-[#12386e]/10 xl:pl-10">
            <h2 className="text-base leading-6 font-bold text-[#12386e] sm:text-[17px]">
              Theo dõi
            </h2>
            <div className="mt-4 flex flex-wrap gap-3" aria-label="Mạng xã hội SkillSwap">
              {SOCIAL_LINKS.map((socialLink) => {
                const SocialIcon = socialIcons[socialLink.platform];
                return (
                  <a
                    key={socialLink.platform}
                    href={socialLink.url}
                    aria-label={socialLink.label}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={socialClassName}
                  >
                    <SocialIcon className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
                  </a>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="col-span-full border-t border-[#12386e]/15 md:mt-8" />
        <p className="col-span-full px-2 py-5 text-center text-xs leading-5 text-[#61758e] sm:py-6 sm:text-[13px]">
          © 2026 SkillSwap. Kết nối tri thức, phát triển kỹ năng.
        </p>
      </div>
    </footer>
  );
}
