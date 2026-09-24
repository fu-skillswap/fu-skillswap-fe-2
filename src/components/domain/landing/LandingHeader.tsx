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
  { label: 'Dành cho mentee', href: '#mentee' },
  { label: 'Dành cho mentor', href: '#mentor' },
  { label: 'Khóa học ngắn', href: '#courses' },
  { label: 'Bảng giá', href: '#pricing' },
  { label: 'Câu hỏi thường gặp', href: '#faq' },
] as const;

export function LandingHeader({ locale }: { locale: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const closeMenu = () => setIsOpen(false);

  return (
    <header className="landing-load-reveal landing-load-from-top sticky top-0 z-50 border-b border-border-light/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-[82px] w-[calc(100%_-_40px)] max-w-[1440px] items-center justify-between gap-5 md:w-[calc(100%_-_64px)] xl:w-[calc(100%_-_96px)]">
        <Link href={`/${locale}`} aria-label="Trang chủ SkillSwap" className="shrink-0">
          <Image
            src="/images/SkillSwap_Logo_Text.png"
            alt="SkillSwap"
            width={190}
            height={48}
            priority
            className="h-12 w-[190px] object-cover object-center"
          />
        </Link>

        <nav aria-label="Điều hướng chính" className="hidden items-center gap-6 xl:flex 2xl:gap-11">
          {navigation.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-[15px] font-medium text-[#435b78] transition-colors hover:text-primary focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2.5 xl:flex">
          <Link
            href={`/${locale}/mentor-registration`}
            className="inline-flex h-12 items-center rounded-xl border border-primary px-5 text-sm font-bold text-primary transition hover:-translate-y-px hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Đăng ký làm mentor
          </Link>
          <Link
            href={`/${locale}/dashboard`}
            className="inline-flex h-12 items-center rounded-xl bg-primary px-6 text-sm font-bold text-white shadow-xs transition hover:-translate-y-px hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Bắt đầu ngay
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
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border-light pt-4">
            <Link
              href={`/${locale}/mentor-registration`}
              onClick={closeMenu}
              className="grid min-h-11 place-items-center rounded-xl border border-primary-border px-3 text-center text-xs font-bold text-primary"
            >
              Đăng ký mentor
            </Link>
            <Link
              href={`/${locale}/dashboard`}
              onClick={closeMenu}
              className="grid min-h-11 place-items-center rounded-xl bg-primary px-3 text-center text-xs font-bold text-white"
            >
              Bắt đầu ngay
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
