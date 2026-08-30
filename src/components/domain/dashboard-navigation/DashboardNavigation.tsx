/**
 * @file DashboardNavigation.tsx
 * @description Component Thanh điều hướng bên trái (Sidebar Navigation Component).
 * Chứa Logo thương hiệu và các liên kết điều hướng Bảng tin, Tìm Mentor, Ví S-Coin và Lịch hẹn.
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { Calendar, Home, Search, Wallet, X } from 'lucide-react';

type NavIcon = 'home' | 'search' | 'wallet' | 'calendar';

/** Helper render Icon tương ứng từ lucide-react cho sidebar item */
function Icon({ name }: { name: NavIcon }) {
  if (name === 'search') {
    return <Search aria-hidden="true" />;
  }
  if (name === 'wallet') {
    return <Wallet aria-hidden="true" />;
  }
  if (name === 'calendar') {
    return <Calendar aria-hidden="true" />;
  }
  return <Home aria-hidden="true" />;
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
    <aside className={`figma-sidebar ${isOpen ? 'figma-sidebar-open' : ''}`}>
      <div className="figma-sidebar-header">
        <Link
          href={dashboardHref}
          className="figma-brand"
          aria-label="SkillSwap newsfeed"
          onClick={onClose}
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

      <nav className="figma-navigation" aria-label="Main navigation">
        <Link
          href={dashboardHref}
          onClick={onClose}
          className={dashboardActive ? 'figma-nav-link figma-nav-link-active' : 'figma-nav-link'}
        >
          <Icon name="home" />
          <span>Bảng tin</span>
        </Link>
        <Link
          href={mentorHref}
          onClick={onClose}
          className={mentorActive ? 'figma-nav-link figma-nav-link-active' : 'figma-nav-link'}
        >
          <Icon name="search" />
          <span>Tìm Mentor</span>
        </Link>
        <button
          type="button"
          onClick={() => handleProtectedAction('Ví S-Coin')}
          className="figma-nav-link figma-nav-link-static"
          style={{
            width: '100%',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <Icon name="wallet" />
          <span>S-coin</span>
        </button>
        <Link
          href={bookingsHref}
          onClick={onClose}
          className={bookingsActive ? 'figma-nav-link figma-nav-link-active' : 'figma-nav-link'}
        >
          <Icon name="calendar" />
          <span>Booking của tôi</span>
        </Link>
      </nav>
      <button
        type="button"
        onClick={() => handleProtectedAction('Tạo bài viết mới')}
        className="figma-sidebar-compose"
        style={{ cursor: 'pointer' }}
      >
        + Bài viết mới
      </button>
    </aside>
  );
}
