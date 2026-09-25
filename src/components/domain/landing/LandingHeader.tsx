/**
 * @file LandingHeader.tsx
 * @description Thanh điều hướng public responsive của landing page SkillSwap.
 */

'use client';

import { Menu, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

const navigation = [
  { label: 'Về chúng tôi', href: '#mentor' },
  { label: 'Bảng giá', href: '#pricing' },
  { label: 'Câu hỏi thường gặp', href: '#faq' },
] as const;

export function LandingHeader({ locale }: { locale: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const closeMenu = () => setIsOpen(false);

  return (
    <header className="landing-load-reveal landing-load-from-top sticky top-0 z-50 bg-white/96 backdrop-blur-md">
      <div className="mx-auto flex h-[76px] w-[calc(100%_-_32px)] max-w-[1480px] items-center justify-between gap-2 sm:h-[84px] sm:w-[calc(100%_-_40px)] sm:gap-5 md:w-[calc(100%_-_64px)] xl:w-[calc(100%_-_96px)]">
        <Link href={`/${locale}`} aria-label="Trang chủ SkillSwap" className="shrink-0">
          <Image
            src="/images/SkillSwap_Logo_Text.png"
            alt="SkillSwap"
            width={280}
            height={76}
            priority
            className="h-16 w-[180px] object-contain object-left sm:h-[72px] sm:w-[250px]"
          />
        </Link>

        <nav aria-label="Điều hướng chính" className="hidden items-center gap-6 xl:flex 2xl:gap-11">
          {navigation.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="relative py-2 text-[15px] font-medium text-[#435b78] transition-colors after:absolute after:right-0 after:bottom-0 after:left-0 after:h-0.5 after:origin-center after:scale-x-0 after:rounded-full after:bg-primary after:transition-transform after:duration-200 hover:text-primary hover:after:scale-x-100 focus-visible:rounded focus-visible:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:after:scale-x-100"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center xl:flex">
          <Link
            href={`/${locale}/login`}
            className="inline-flex h-[52px] items-center rounded-[13px] bg-primary px-7 text-sm font-bold text-white shadow-xs transition hover:-translate-y-px hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
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
            <a
              key={item.href}
              href={item.href}
              onClick={closeMenu}
              className="rounded-lg px-3 py-2.5 text-sm font-semibold text-text-secondary hover:bg-primary-light hover:text-primary"
            >
              {item.label}
            </a>
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
