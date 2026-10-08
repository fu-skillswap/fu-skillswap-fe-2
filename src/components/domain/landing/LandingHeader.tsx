/**
 * @file LandingHeader.tsx
 * @description Thanh điều hướng public responsive của landing page SkillSwap.
 */

'use client';

import { Menu, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState, type MouseEvent } from 'react';

const navigation = [
  { label: 'Trang chủ', href: '/' },
  { label: 'Dành cho mentee', href: '#mentee' },
  { label: 'Đăng ký làm mentor', href: '#mentor' },
  { label: 'Cách hoạt động', href: '#how-it-works' },
  { label: 'Câu hỏi thường gặp', href: '#faq' },
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
  const navigationHref = (href: string) => {
    if (href.startsWith('#')) return isOutsideLanding ? `/${locale}${href}` : href;
    return `/${locale}${href === '/' ? '' : href}`;
  };
  const handleNavigation = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    closeMenu();
    if (!href.startsWith('#') || isOutsideLanding) return;

    const target = document.querySelector(href);
    if (!target) return;

    event.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.history.replaceState(null, '', href);
  };

  return (
    <header className="landing-load-reveal landing-load-from-top sticky top-0 z-50 bg-white/96 backdrop-blur-md">
      <div className="mx-auto flex h-[82px] w-[calc(100%_-_32px)] max-w-[1480px] items-center justify-between gap-2 sm:h-[94px] sm:w-[calc(100%_-_40px)] sm:gap-5 md:w-[calc(100%_-_64px)] xl:w-[calc(100%_-_96px)]">
        <Link href={`/${locale}`} aria-label="Trang chủ SkillSwap" className="shrink-0">
          <Image
            src="/images/SkillSwap_Logo_Text.png"
            alt="SkillSwap"
            width={280}
            height={76}
            priority
            className="h-[68px] w-[190px] object-contain object-left sm:h-20 sm:w-[250px] xl:w-[230px] 2xl:w-[260px]"
          />
        </Link>

        <nav aria-label="Điều hướng chính" className="hidden items-center gap-4 xl:flex 2xl:gap-6">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={navigationHref(item.href)}
              onClick={(event) => handleNavigation(event, item.href)}
              className="relative py-2.5 text-sm font-semibold whitespace-nowrap text-[#435b78] transition-colors after:absolute after:right-0 after:bottom-0 after:left-0 after:h-0.5 after:origin-center after:scale-x-0 after:rounded-full after:bg-primary after:transition-transform after:duration-200 hover:text-primary hover:after:scale-x-100 focus-visible:rounded focus-visible:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:after:scale-x-100 2xl:text-[15px]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center xl:flex">
          <Link
            href={`/${locale}/login`}
            className="inline-flex h-14 items-center rounded-[14px] bg-primary px-8 text-[15px] font-bold text-white shadow-xs transition hover:-translate-y-px hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Đăng nhập / Đăng ký
          </Link>
        </div>

        <button
          type="button"
          aria-label={isOpen ? 'Đóng menu' : 'Mở menu'}
          aria-expanded={isOpen}
          aria-controls="landing-mobile-menu"
          onClick={() => setIsOpen((current) => !current)}
          className="grid h-11 w-11 place-items-center rounded-xl border border-border-color text-text-main outline-none hover:bg-surface-subtle focus-visible:ring-2 focus-visible:ring-primary xl:hidden"
        >
          {isOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
      </div>

      <div
        id="landing-mobile-menu"
        hidden={!isOpen}
        className="border-t border-border-light bg-white px-5 py-4 xl:hidden"
      >
        <nav aria-label="Điều hướng di động" className="mx-auto grid max-w-[1220px] gap-1">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={navigationHref(item.href)}
              onClick={(event) => handleNavigation(event, item.href)}
              className="rounded-lg px-3 py-2.5 text-sm font-semibold text-text-secondary hover:bg-primary-light hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
          <div className="mt-3 border-t border-border-light pt-4">
            <Link
              href={`/${locale}/login`}
              onClick={closeMenu}
              className="grid min-h-11 w-full place-items-center rounded-xl bg-primary px-3 text-center text-xs font-bold text-white"
            >
              Đăng nhập/ Đăng ký
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
