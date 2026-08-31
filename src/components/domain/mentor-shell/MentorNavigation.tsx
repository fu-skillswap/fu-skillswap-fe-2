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
    <aside className={`figma-sidebar mentor-sidebar ${isOpen ? 'figma-sidebar-open' : ''}`}>
      <div className="figma-sidebar-header">
        <Link
          href={dashboardHref}
          onClick={onClose}
          className="figma-brand"
          aria-label="SkillSwap Mentor"
        >
          <img
            src="/images/SkillSwap_Logo_Text.png"
            alt="SkillSwap"
            className="figma-brand-logo-text"
          />
        </Link>
        <button
          type="button"
          className="figma-sidebar-close-btn"
          onClick={onClose}
          aria-label="Đóng thanh điều hướng"
        >
          <X aria-hidden="true" />
        </button>
      </div>

      <nav className="figma-navigation" aria-label="Điều hướng Mentor">
        {/* Phần giống Mentee */}

        <Link
          href={dashboardHref}
          onClick={onClose}
          className={
            pathname === dashboardHref || pathname.includes('/mentor/dashboard')
              ? 'figma-nav-link figma-nav-link-active'
              : 'figma-nav-link'
          }
        >
          <LayoutDashboard className="w-5 h-5" aria-hidden="true" />
          <span>Tổng quan</span>
        </Link>

        <Link
          href={feedHref}
          onClick={onClose}
          className={
            pathname === feedHref ? 'figma-nav-link figma-nav-link-active' : 'figma-nav-link'
          }
        >
          <Home className="w-5 h-5" aria-hidden="true" />
          <span>Bảng tin</span>
        </Link>

        <Link
          href={bookingHref}
          onClick={onClose}
          className={
            pathname.includes('/mentor-booking')
              ? 'figma-nav-link figma-nav-link-active'
              : 'figma-nav-link'
          }
        >
          <Search className="w-5 h-5" aria-hidden="true" />
          <span>Tìm Mentor</span>
        </Link>

        {/* Phần dành riêng cho Mentor */}

        <Link
          href={scheduleHref}
          onClick={onClose}
          className={
            pathname.includes('/mentor/schedule-manage')
              ? 'figma-nav-link figma-nav-link-active'
              : 'figma-nav-link'
          }
        >
          <Settings className="w-5 h-5" aria-hidden="true" />
          <span>Dịch vụ & Lịch dạy</span>
        </Link>

        <Link
          href={mentorBookingsHref}
          onClick={onClose}
          className={
            pathname.includes('/mentor/bookings')
              ? 'figma-nav-link figma-nav-link-active'
              : 'figma-nav-link'
          }
        >
          <Calendar className="w-5 h-5" aria-hidden="true" />
          <span>Lịch đặt</span>
        </Link>

        <Link
          href={mentorPostsHref}
          onClick={onClose}
          className={
            pathname.includes('/mentor/posts')
              ? 'figma-nav-link figma-nav-link-active'
              : 'figma-nav-link'
          }
        >
          <FileText className="w-5 h-5" aria-hidden="true" />
          <span>Bài viết của tôi</span>
        </Link>

        <Link
          href={coursesHref}
          onClick={onClose}
          className={
            pathname.includes('/mentor/my-courses')
              ? 'figma-nav-link figma-nav-link-active'
              : 'figma-nav-link'
          }
        >
          <GraduationCap className="w-5 h-5" aria-hidden="true" />
          <span>Khóa học của tôi</span>
        </Link>

        <button type="button" className="figma-nav-link mentor-nav-link-unavailable" tabIndex={-1}>
          <Wallet className="w-5 h-5" aria-hidden="true" />
          <span>Ví S-coins</span>
        </button>
      </nav>

      {/* Bottom Action Button: + Bài viết mới */}
      <Link
        href={`${mentorPostsHref}?create=1`}
        onClick={onClose}
        className="figma-sidebar-compose"
      >
        + Bài viết mới
      </Link>
    </aside>
  );
}
