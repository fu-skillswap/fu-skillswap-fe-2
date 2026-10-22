/**
 * @file LandingHeader.tsx
 * @description Public header (landing + policy pages): logo, section links, Gmail login pill and
 * a mobile menu below 900px.
 */

'use client';

import { Menu, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { GoogleIcon } from '@/components/domain/landing/LandingPrimitives';
import { publicHref } from '@/constants/publicSite';

const navigation = [
  { label: 'Tìm mentor', anchor: '#mentor' },
  { label: 'Cách hoạt động', anchor: '#cach-hoat-dong' },
  { label: 'KooKoo AI', anchor: '#koukou' },
  { label: 'Làm mentor', anchor: '#lam-mentor' },
  { label: 'Hỏi đáp', anchor: '#faq' },
] as const;

interface LandingHeaderProps {
  locale: string;
  /**
   * Set when the header is rendered outside the landing page: section anchors (`#faq`…) then
   * link back to the landing page (`/${locale}#faq`) instead of scrolling the current page.
   */
  isOutsideLanding?: boolean;
}

export function LandingHeader({ locale, isOutsideLanding = false }: LandingHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const closeMenu = () => setIsOpen(false);
  // Plain anchors on the landing page: smooth scrolling comes from CSS and respects reduced motion.
  const sectionHref = (anchor: string) => (isOutsideLanding ? `/${locale}${anchor}` : anchor);
  const loginHref = publicHref(locale, 'login') ?? `/${locale}/login`;

  return (
    <header className="sticky top-0 z-50 border-0 border-b border-solid border-site-line/70 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-[72px] w-full max-w-[1240px] items-center gap-3 px-4 sm:px-6 min-[900px]:gap-7">
        <Link
          href={`/${locale}`}
          aria-label="SkillSwap – Trang chủ"
          className="site-focus flex shrink-0 items-center rounded-lg"
        >
          <Image
            src="/images/SkillSwap_Logo_Text.png"
            alt="SkillSwap"
            width={1920}
            height={1080}
            priority
            unoptimized
            className="h-14 w-[150px] object-contain object-left sm:w-[170px]"
          />
        </Link>

        <nav
          aria-label="Điều hướng chính"
          className="ml-1 hidden items-center gap-6 min-[900px]:flex xl:gap-7"
        >
          {navigation.map((item) => (
            <a
              key={item.anchor}
              href={sectionHref(item.anchor)}
              className="site-focus rounded-sm py-2 font-site-ui text-[15px] font-semibold whitespace-nowrap text-site-body no-underline transition-colors hover:text-site-blue"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <Link
          href={loginHref}
          className="site-focus ml-auto hidden min-h-11 items-center gap-2.5 rounded-full border-[1.5px] border-solid border-site-chip-border bg-white px-5 font-site-ui text-[15px] font-semibold whitespace-nowrap text-site-ink no-underline shadow-site-soft transition-colors hover:border-site-blue sm:inline-flex"
        >
          <GoogleIcon />
          Đăng nhập bằng Gmail
        </Link>

        <button
          type="button"
          aria-label={isOpen ? 'Đóng menu' : 'Mở menu'}
          aria-expanded={isOpen}
          aria-controls="landing-mobile-menu"
          onClick={() => setIsOpen((current) => !current)}
          className="site-focus ml-auto grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-xl border border-solid border-site-line-strong bg-white text-site-ink hover:bg-site-tint sm:ml-0 min-[900px]:hidden"
        >
          {isOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
      </div>

      <div
        id="landing-mobile-menu"
        hidden={!isOpen}
        className="border-0 border-t border-solid border-site-line bg-white px-4 py-3 min-[900px]:hidden"
      >
        <nav aria-label="Điều hướng di động" className="mx-auto grid max-w-[1240px] gap-1">
          {navigation.map((item) => (
            <a
              key={item.anchor}
              href={sectionHref(item.anchor)}
              onClick={closeMenu}
              className="site-focus flex min-h-11 items-center rounded-lg px-3 font-site-ui text-[15px] font-semibold text-site-body no-underline hover:bg-site-tint hover:text-site-blue"
            >
              {item.label}
            </a>
          ))}
          <Link
            href={loginHref}
            onClick={closeMenu}
            className="site-focus mt-2 flex min-h-12 items-center justify-center gap-2.5 rounded-full border-[1.5px] border-solid border-site-chip-border bg-white px-5 font-site-ui text-[15px] font-semibold text-site-ink no-underline sm:hidden"
          >
            <GoogleIcon />
            Đăng nhập bằng Gmail
          </Link>
        </nav>
      </div>
    </header>
  );
}
