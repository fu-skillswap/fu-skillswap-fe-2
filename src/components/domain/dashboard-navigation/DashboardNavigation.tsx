/**
 * @file DashboardNavigation.tsx
 * @description Component Thanh điều hướng bên trái (Sidebar Navigation Component).
 * Chứa Logo thương hiệu và các liên kết điều hướng Bảng tin, Tìm Mentor và Lịch hẹn.
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { Calendar, Home, Search, X } from 'lucide-react';

type NavIcon = 'home' | 'search' | 'calendar';

/** Helper render Icon tương ứng từ lucide-react cho sidebar item */
function Icon({ name }: { name: NavIcon }) {
  if (name === 'search') {
    return <Search className="w-5 h-5 shrink-0" aria-hidden="true" />;
  }
  if (name === 'calendar') {
    return <Calendar className="w-5 h-5 shrink-0" aria-hidden="true" />;
  }
  return <Home className="w-5 h-5 shrink-0" aria-hidden="true" />;
}

/** Props của DashboardNavigation Component */
interface DashboardNavigationProps {
  /** Mã locale ngôn ngữ hiện tại */
  locale: string;
  /** Cờ đánh dấu sidebar đang mở trên mobile/tablet */
  isOpen?: boolean;
  /** Callback đóng sidebar */
  onClose?: () => void;
}

/**
 * Component thanh điều hướng chính ở cạnh trái màn hình Dashboard.
 */
export function DashboardNavigation({ locale, isOpen, onClose }: DashboardNavigationProps) {
  const pathname = usePathname();
  const { isAuthenticated, showAuthRequiredModal } = useAuth();

  const dashboardHref = `/${locale}/dashboard`;
  const mentorHref = `/${locale}/mentor-booking`;
  const bookingsHref = `/${locale}/my-bookings`;
  const dashboardActive =
    pathname === dashboardHref || pathname.startsWith(`/${locale}/post-detail/`);
  const mentorActive = pathname.startsWith(mentorHref);
  const bookingsActive = pathname.startsWith(bookingsHref);

  const handleProtectedAction = (featureName: string) => {
    if (onClose) onClose();
    if (!isAuthenticated) {
      showAuthRequiredModal(
        `Bạn cần Đăng nhập hoặc Đăng ký tài khoản để sử dụng tính năng ${featureName}.`,
      );
    }
  };

  return (
    <aside className={`fixed top-0 left-0 bottom-0 w-64 bg-white border-r border-solid border-border-light z-50 flex flex-col p-4 transition-transform duration-300 ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}`}>
      <div className="relative flex items-center justify-center text-center py-0.5 pb-1 mb-1 border-b border-solid border-border-light/60 w-full">
        <Link
          href={dashboardHref}
          className="w-full flex justify-center items-center px-1"
          aria-label="SkillSwap newsfeed"
          onClick={onClose}
        >
          <img
            src="/images/SkillSwap_Logo_Text.png"
            alt="SkillSwap"
            className="w-full max-w-[130px] max-h-[90px] object-contain mx-auto"
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

      <nav className="flex-1 flex flex-col gap-1 overflow-y-auto" aria-label="Main navigation">
        <Link
          href={dashboardHref}
          onClick={onClose}
          className={dashboardActive ? 'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold bg-primary-light text-primary border border-solid border-primary-border/40 transition-all' : 'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-text-secondary hover:text-text-main hover:bg-surface-subtle border border-solid border-transparent transition-all'}
        >
          <Icon name="home" />
          <span>Bảng tin</span>
        </Link>
        <Link
          href={mentorHref}
          onClick={onClose}
          className={mentorActive ? 'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold bg-primary-light text-primary border border-solid border-primary-border/40 transition-all' : 'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-text-secondary hover:text-text-main hover:bg-surface-subtle border border-solid border-transparent transition-all'}
        >
          <Icon name="search" />
          <span>Tìm Mentor</span>
        </Link>
        <Link
          href={bookingsHref}
          onClick={onClose}
          className={bookingsActive ? 'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold bg-primary-light text-primary border border-solid border-primary-border/40 transition-all' : 'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-text-secondary hover:text-text-main hover:bg-surface-subtle border border-solid border-transparent transition-all'}
        >
          <Icon name="calendar" />
          <span>Booking của tôi</span>
        </Link>
      </nav>
      <button
        type="button"
        onClick={() => handleProtectedAction('Tạo bài viết mới')}
        className="w-full mt-4 py-2.5 px-4 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-hover shadow-xs transition-colors border-none cursor-pointer flex items-center justify-center gap-2"
      >
        + Bài viết mới
      </button>
    </aside>
  );
}
