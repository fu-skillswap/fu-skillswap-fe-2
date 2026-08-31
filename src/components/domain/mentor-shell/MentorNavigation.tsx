/**
 * @file MentorNavigation.tsx
 * @description Thanh điều hướng bên trái (Sidebar) cho không gian làm việc của Mentor.
 * Đảm bảo 100% đúng bố cục, icon và liên kết theo thiết kế mẫu.
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  Calendar,
  FileText,
  GraduationCap,
  Home,
  LayoutDashboard,
  Search,
  Settings,
  Wallet,
  X,
} from 'lucide-react';

interface MentorNavigationProps {
  locale: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export function MentorNavigation({ locale, isOpen, onClose }: MentorNavigationProps) {
  const pathname = usePathname();
  const feedHref = `/${locale}/dashboard`;
  const bookingHref = `/${locale}/mentor-booking`;
  const dashboardHref = `/${locale}/mentor/dashboard`;
  const scheduleHref = `/${locale}/mentor/schedule-manage`;
  const mentorBookingsHref = `/${locale}/mentor/bookings`;
  const mentorPostsHref = `/${locale}/mentor/posts`;
  const coursesHref = `/${locale}/mentor/my-courses`;

  return (
    <aside className={`fixed top-0 left-0 bottom-0 w-64 bg-white border-r border-solid border-border-light z-50 flex flex-col p-4 transition-transform duration-300 ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}`}>
      <div className="relative flex items-center justify-center text-center py-0.5 pb-1 mb-1 border-b border-solid border-border-light/60 w-full">
        <Link
          href={dashboardHref}
          onClick={onClose}
          className="w-full flex justify-center items-center px-1"
          aria-label="SkillSwap Mentor"
        >
          <img
            src="/images/SkillSwap_Logo_Text.png"
            alt="SkillSwap"
            className="w-full max-w-[145px] h-auto object-contain mx-auto"
          />
        </Link>
        <button
          type="button"
          className="lg:hidden absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-text-muted hover:text-text-main hover:bg-surface-subtle transition-colors border-none bg-transparent cursor-pointer"
          onClick={onClose}
          aria-label="Đóng thanh điều hướng"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      <nav className="flex-1 flex flex-col gap-1 overflow-y-auto" aria-label="Điều hướng Mentor">
        {/* Phần giống Mentee */}

        <Link
          href={dashboardHref}
          onClick={onClose}
          className={
            pathname === dashboardHref || pathname.includes('/mentor/dashboard')
              ? 'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-primary-light text-primary border border-solid border-primary-border/40 transition-all'
              : 'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-text-secondary hover:text-text-main hover:bg-surface-subtle border border-solid border-transparent transition-all'
          }
        >
          <LayoutDashboard className="w-5 h-5 shrink-0" aria-hidden="true" />
          <span>Tổng quan</span>
        </Link>

        <Link
          href={feedHref}
          onClick={onClose}
          className={
            pathname === feedHref
              ? 'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-primary-light text-primary border border-solid border-primary-border/40 transition-all'
              : 'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-text-secondary hover:text-text-main hover:bg-surface-subtle border border-solid border-transparent transition-all'
          }
        >
          <Home className="w-5 h-5 shrink-0" aria-hidden="true" />
          <span>Bảng tin</span>
        </Link>

        <Link
          href={bookingHref}
          onClick={onClose}
          className={
            pathname.includes('/mentor-booking')
              ? 'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-primary-light text-primary border border-solid border-primary-border/40 transition-all'
              : 'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-text-secondary hover:text-text-main hover:bg-surface-subtle border border-solid border-transparent transition-all'
          }
        >
          <Search className="w-5 h-5 shrink-0" aria-hidden="true" />
          <span>Tìm Mentor</span>
        </Link>

        {/* Phần dành riêng cho Mentor */}

        <Link
          href={scheduleHref}
          onClick={onClose}
          className={
            pathname.includes('/mentor/schedule-manage')
              ? 'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-primary-light text-primary border border-solid border-primary-border/40 transition-all'
              : 'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-text-secondary hover:text-text-main hover:bg-surface-subtle border border-solid border-transparent transition-all'
          }
        >
          <Settings className="w-5 h-5 shrink-0" aria-hidden="true" />
          <span>Dịch vụ & Lịch dạy</span>
        </Link>

        <Link
          href={mentorBookingsHref}
          onClick={onClose}
          className={
            pathname.includes('/mentor/bookings')
              ? 'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-primary-light text-primary border border-solid border-primary-border/40 transition-all'
              : 'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-text-secondary hover:text-text-main hover:bg-surface-subtle border border-solid border-transparent transition-all'
          }
        >
          <Calendar className="w-5 h-5 shrink-0" aria-hidden="true" />
          <span>Lịch đặt</span>
        </Link>

        <Link
          href={mentorPostsHref}
          onClick={onClose}
          className={
            pathname.includes('/mentor/posts')
              ? 'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-primary-light text-primary border border-solid border-primary-border/40 transition-all'
              : 'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-text-secondary hover:text-text-main hover:bg-surface-subtle border border-solid border-transparent transition-all'
          }
        >
          <FileText className="w-5 h-5 shrink-0" aria-hidden="true" />
          <span>Bài viết của tôi</span>
        </Link>

        <Link
          href={coursesHref}
          onClick={onClose}
          className={
            pathname.includes('/mentor/my-courses')
              ? 'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-primary-light text-primary border border-solid border-primary-border/40 transition-all'
              : 'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-text-secondary hover:text-text-main hover:bg-surface-subtle border border-solid border-transparent transition-all'
          }
        >
          <GraduationCap className="w-5 h-5 shrink-0" aria-hidden="true" />
          <span>Khóa học của tôi</span>
        </Link>

        <button type="button" className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-text-disabled bg-transparent border border-solid border-transparent opacity-50 cursor-not-allowed text-left w-full" tabIndex={-1}>
          <Wallet className="w-5 h-5 shrink-0" aria-hidden="true" />
          <span>Ví S-coins</span>
        </button>
      </nav>

      {/* Bottom Action Button: + Bài viết mới */}
      <Link
        href={`${mentorPostsHref}?create=1`}
        onClick={onClose}
        className="w-full mt-4 py-2.5 px-4 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary-hover shadow-xs transition-colors border-none cursor-pointer flex items-center justify-center gap-2 text-center"
      >
        + Bài viết mới
      </Link>
    </aside>
  );
}
