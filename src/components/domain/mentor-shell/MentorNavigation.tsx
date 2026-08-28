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
  CalendarDays,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Plus,
  Settings,
  Wallet,
} from 'lucide-react';

export function MentorNavigation({ locale }: { locale: string }) {
  const pathname = usePathname();
  const dashboardHref = `/${locale}/mentor/dashboard`;
  const scheduleHref = `/${locale}/mentor/schedule-manage`;
  const coursesHref = `/${locale}/mentor/my-courses`;

  return (
    <aside className="figma-sidebar mentor-sidebar">
      <div className="figma-sidebar-header">
        <Link href={dashboardHref} className="figma-brand" aria-label="SkillSwap Mentor">
          <img
            src="/images/SkillSwap_Logo_Text.png"
            alt="SkillSwap"
            className="figma-brand-logo-text"
          />
        </Link>
      </div>

      <nav className="figma-navigation" aria-label="Điều hướng Mentor">
        {/* 1. Tổng quan */}
        <Link
          href={dashboardHref}
          className={
            pathname === dashboardHref || pathname.includes('/mentor/dashboard')
              ? 'figma-nav-link figma-nav-link-active'
              : 'figma-nav-link'
          }
        >
          <LayoutDashboard className="w-5 h-5" aria-hidden="true" />
          <span>Tổng quan</span>
        </Link>

        {/* 2. Dịch vụ & Lịch dạy */}
        <Link
          href={scheduleHref}
          className={
            pathname.includes('/mentor/schedule-manage')
              ? 'figma-nav-link figma-nav-link-active'
              : 'figma-nav-link'
          }
        >
          <Settings className="w-5 h-5" aria-hidden="true" />
          <span>Dịch vụ & Lịch dạy</span>
        </Link>

        {/* 3. Lịch đặt */}
        <button type="button" className="figma-nav-link mentor-nav-link-unavailable" tabIndex={-1}>
          <Calendar className="w-5 h-5" aria-hidden="true" />
          <span>Lịch đặt</span>
        </button>

        {/* 4. Bài viết của tôi */}
        <button type="button" className="figma-nav-link mentor-nav-link-unavailable" tabIndex={-1}>
          <FileText className="w-5 h-5" aria-hidden="true" />
          <span>Bài viết của tôi</span>
        </button>

        {/* 5. Khóa học của tôi */}
        <Link
          href={coursesHref}
          className={
            pathname.includes('/mentor/my-courses')
              ? 'figma-nav-link figma-nav-link-active'
              : 'figma-nav-link'
          }
        >
          <GraduationCap className="w-5 h-5" aria-hidden="true" />
          <span>Khóa học của tôi</span>
        </Link>

        {/* 6. Ví */}
        <button type="button" className="figma-nav-link mentor-nav-link-unavailable" tabIndex={-1}>
          <Wallet className="w-5 h-5" aria-hidden="true" />
          <span>Ví</span>
        </button>
      </nav>

      {/* Bottom Action Button: + Bài viết mới */}
      <button type="button" className="figma-sidebar-compose">
        + Bài viết mới
      </button>
    </aside>
  );
}
