/**
 * @file SiteFooter.tsx
 * @description Shared blue footer for every public page (landing, policy pages, help): KooKoo CTA
 * card, link columns, contact info and legal line. Not used inside the logged-in app shells.
 */

import { Clock3, Mail, MapPin } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Highlight, Mascot } from '@/components/domain/landing/LandingPrimitives';
import { OpenKooKooButton } from '@/components/layout/OpenKooKooButton';
import {
  FANPAGE_URL,
  PUBLIC_CONTACT_EMAIL,
  findMentorHref,
  publicHref,
  type PublicRouteKey,
} from '@/constants/publicSite';

interface FooterLink {
  label: string;
  route?: PublicRouteKey;
  href?: string;
}

const FOOTER_COLUMNS: { title: string; links: FooterLink[] }[] = [
  {
    title: 'Sản phẩm',
    links: [
      { label: 'Tìm mentor', route: 'findMentor' },
      { label: 'Đăng ký làm mentor', route: 'mentorRegistration' },
      { label: 'KooKoo AI', route: 'koukou' },
      { label: 'Bảng tin cộng đồng', route: 'communityBoard' },
      { label: 'Blog', route: 'blog' },
    ],
  },
  {
    title: 'Hỗ trợ',
    links: [
      { label: 'Trung tâm hỗ trợ', route: 'helpCenter' },
      { label: 'Hướng dẫn đặt lịch', route: 'bookingGuide' },
      { label: 'S-coin là gì?', route: 'sCoinFaq' },
      { label: 'Liên hệ hỗ trợ', href: `mailto:${PUBLIC_CONTACT_EMAIL}` },
    ],
  },
  {
    title: 'Chính sách',
    links: [
      { label: 'Chính sách bảo mật', route: 'privacy' },
      { label: 'Điều khoản sử dụng', route: 'terms' },
      { label: 'Chính sách đặt và hủy lịch', route: 'bookingPolicy' },
      { label: 'Quy định dành cho mentor', route: 'mentorRules' },
      { label: 'Yêu cầu xóa tài khoản', route: 'accountDeletion' },
    ],
  },
];

const LINK_CLASS =
  'w-fit text-site-on-blue no-underline transition-colors hover:text-white hover:underline';

function FooterLinkItem({ link, locale }: { link: FooterLink; locale: string }) {
  const href = link.href ?? (link.route ? publicHref(locale, link.route) : null);
  // Pages that don't exist yet stay as plain text so the footer never links to a 404.
  if (!href) return <span className="w-fit text-site-on-blue">{link.label}</span>;
  if (href.startsWith('/') && !href.includes('#')) {
    return (
      <Link href={href} className={LINK_CLASS}>
        {link.label}
      </Link>
    );
  }
  return (
    <a href={href} className={LINK_CLASS}>
      {link.label}
    </a>
  );
}

function ContactLine({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <p className="m-0 flex items-start gap-2.5 leading-[22px]">
      <span className="mt-0.5 shrink-0 text-[#a5f3fc]">{icon}</span>
      <span className="min-w-0">{children}</span>
    </p>
  );
}

interface SiteFooterProps {
  locale: string;
  /** Background of the section above; fills the wave on the footer's top edge. */
  topColor?: string;
  /** On the landing page "Hỏi KooKoo" opens the widget; elsewhere it links to the landing demo. */
  isLanding?: boolean;
}

export function SiteFooter({ locale, topColor = '#ffffff', isLanding = false }: SiteFooterProps) {
  const ctaClass =
    'inline-flex min-h-[50px] cursor-pointer items-center rounded-full px-6 font-site-ui text-base font-bold whitespace-nowrap no-underline transition-colors';
  const outlineCtaClass = `${ctaClass} border-[1.5px] border-solid border-site-blue bg-white text-site-blue hover:bg-site-tint`;

  return (
    <footer className="site-on-blue relative overflow-hidden bg-site-blue font-site-body text-white">
      <svg
        aria-hidden="true"
        viewBox="0 0 1440 60"
        preserveAspectRatio="none"
        className="pointer-events-none absolute top-0 left-0 h-11 w-full"
      >
        <path
          d="M0 0 H1440 V18 C 1080 60, 720 0, 360 34 C 200 48, 80 40, 0 30 Z"
          style={{ fill: topColor }}
        />
      </svg>
      <svg
        aria-hidden="true"
        viewBox="0 0 400 400"
        className="pointer-events-none absolute right-[-120px] bottom-[-160px] h-[460px] w-[460px]"
      >
        <circle
          cx="200"
          cy="200"
          r="150"
          fill="none"
          className="stroke-site-cyan"
          strokeWidth="56"
          opacity=".35"
        />
      </svg>
      <svg
        aria-hidden="true"
        viewBox="0 0 200 200"
        className="pointer-events-none absolute top-[120px] left-[-60px] h-[200px] w-[200px]"
      >
        <circle cx="100" cy="100" r="70" fill="#3b82f6" opacity=".6" />
      </svg>

      <div className="relative mx-auto flex w-full max-w-[1240px] flex-col gap-12 px-4 pt-[84px] pb-7 sm:px-6">
        <div className="site-on-light relative flex flex-wrap items-center gap-6 rounded-[28px] bg-white px-6 pt-24 pb-6 text-site-ink shadow-[0_18px_40px_rgba(0,28,100,0.25)] sm:py-[26px] sm:pr-8 sm:pl-[150px]">
          <Mascot
            width={112}
            className="absolute top-[-24px] left-6 w-24 sm:top-auto sm:bottom-0 sm:left-[22px] sm:w-28"
          />
          <div className="min-w-0 flex-[1_1_320px]">
            <p className="m-0 font-site-display text-[22px] leading-[1.1] font-black uppercase sm:text-[26px]">
              Sẵn sàng tìm <Highlight>người chia sẻ?</Highlight>
            </p>
            <p className="m-0 mt-1.5 text-[15px] text-site-muted">
              Đăng nhập bằng Gmail, chọn mentor, chọn giờ trống.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Link
              href={findMentorHref(locale)}
              className={`${ctaClass} bg-site-blue text-white hover:bg-site-blue-hover`}
            >
              Tìm mentor
            </Link>
            {isLanding ? (
              <OpenKooKooButton className={outlineCtaClass}>Hỏi KooKoo</OpenKooKooButton>
            ) : (
              <a href={publicHref(locale, 'koukou') ?? `/${locale}`} className={outlineCtaClass}>
                Hỏi KooKoo
              </a>
            )}
          </div>
        </div>

        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.1fr_1.2fr] lg:gap-x-12">
          <div className="flex min-w-0 flex-col gap-4 sm:col-span-2 lg:col-span-1">
            <Link
              href={`/${locale}`}
              aria-label="SkillSwap – Trang chủ"
              className="flex self-start rounded-full bg-white px-4 py-1"
            >
              <Image
                src="/images/SkillSwap_Logo_Text.png"
                alt="SkillSwap"
                width={1920}
                height={1080}
                unoptimized
                loading="lazy"
                className="h-10 w-[120px] object-contain"
              />
            </Link>
            <p className="m-0 max-w-[320px] text-[15px] leading-[23px] text-site-on-blue">
              Nền tảng kết nối Mentor – Mentee cho sinh viên Đại học FPT TP.HCM. Học để chia sẻ, kết
              nối để phát triển.
            </p>
            <div className="flex gap-2.5">
              {FANPAGE_URL && (
                <a
                  href={FANPAGE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Fanpage Facebook SkillSwap"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-white/16 text-white transition-colors hover:bg-white/25"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                    className="h-5 w-5"
                  >
                    <path d="M14 8h3V4h-3c-2.8 0-4 1.7-4 4.2V10H7v4h3v8h4v-8h3l1-4h-4V8.6c0-.4.3-.6.6-.6z" />
                  </svg>
                </a>
              )}
              <a
                href={`mailto:${PUBLIC_CONTACT_EMAIL}`}
                aria-label="Gửi email cho SkillSwap"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white/16 text-white transition-colors hover:bg-white/25"
              >
                <Mail className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
              </a>
            </div>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title} className="min-w-0">
              <h3 className="m-0 mb-4 font-site-ui text-[15px] font-bold text-white">
                {column.title}
              </h3>
              <ul className="m-0 flex list-none flex-col gap-3 p-0 text-[15px]">
                {column.links.map((link) => (
                  <li key={link.label} className="flex">
                    <FooterLinkItem link={link} locale={locale} />
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div className="flex min-w-0 flex-col gap-3 text-[15px] text-site-on-blue">
            <h3 className="m-0 mb-1 font-site-ui text-[15px] font-bold text-white">Liên hệ</h3>
            <ContactLine icon={<Mail className="h-[18px] w-[18px]" aria-hidden="true" />}>
              <a href={`mailto:${PUBLIC_CONTACT_EMAIL}`} className="break-all text-white">
                {PUBLIC_CONTACT_EMAIL}
              </a>
            </ContactLine>
            <ContactLine icon={<Clock3 className="h-[18px] w-[18px]" aria-hidden="true" />}>
              Phản hồi trong 3 ngày làm việc
            </ContactLine>
            <ContactLine icon={<MapPin className="h-[18px] w-[18px]" aria-hidden="true" />}>
              Nhóm dự án SkillSwap – Trường Đại học FPT TP.HCM
            </ContactLine>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2.5 border-0 border-t border-solid border-white/28 pt-5 text-[13px] leading-[19px] text-site-on-blue">
          <span>
            © 2026 SkillSwap. Dự án khởi nghiệp EXE của sinh viên Trường Đại học FPT TP.HCM.
          </span>
          <span>Dành cho người dùng từ 18 tuổi · Dữ liệu lưu trữ tại Việt Nam</span>
        </div>
      </div>
    </footer>
  );
}
