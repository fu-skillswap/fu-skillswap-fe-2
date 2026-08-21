/**
 * @file DashboardNavigation.tsx
 * @description Component Thanh điều hướng bên trái (Sidebar Navigation Component).
 * Chứa Logo thương hiệu và các liên kết điều hướng Bảng tin, Tìm Mentor, Ví S-Coin và Lịch hẹn.
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavIcon = "home" | "search" | "wallet" | "calendar";

/** Helper render SVG Icon tương ứng cho sidebar item */
function Icon({ name }: { name: NavIcon }) {
  if (name === "search") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="11" cy="11" r="6.5" />
        <path d="m16 16 4.25 4.25" />
      </svg>
    );
  }
  if (name === "wallet") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4.5 7.25h15v11.5h-15z" />
        <path d="M4.5 10.5h15M15.5 14.25h1" />
        <path d="M6.5 7.25V5.5h11" />
      </svg>
    );
  }
  if (name === "calendar") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M8 3v4M16 3v4M4 10h16" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m3.5 10 8.5-7 8.5 7v9.25a1.25 1.25 0 0 1-1.25 1.25H4.75a1.25 1.25 0 0 1-1.25-1.25Z" />
      <path d="M9 20.5v-6h6v6" />
    </svg>
  );
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
export function DashboardNavigation({
  locale,
  isOpen,
  onClose,
}: DashboardNavigationProps) {
  const pathname = usePathname();

  const dashboardHref = `/${locale}/dashboard`;
  const mentorHref = `/${locale}/mentor-booking`;
  const dashboardActive =
    pathname === dashboardHref ||
    pathname.startsWith(`/${locale}/post-detail/`);
  const mentorActive = pathname.startsWith(mentorHref);

  return (
    <aside
      className={`figma-sidebar ${
        isOpen ? "figma-sidebar-open" : ""
      }`}
    >
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
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M18 6 6 18M6 6l12 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      <nav className="figma-navigation" aria-label="Main navigation">
        <Link
          href={dashboardHref}
          onClick={onClose}
          className={
            dashboardActive
              ? "figma-nav-link figma-nav-link-active"
              : "figma-nav-link"
          }
        >
          <Icon name="home" />
          <span>Bảng tin</span>
        </Link>
        <Link
          href={mentorHref}
          onClick={onClose}
          className={
            mentorActive
              ? "figma-nav-link figma-nav-link-active"
              : "figma-nav-link"
          }
        >
          <Icon name="search" />
          <span>Tìm Mentor</span>
        </Link>
        <span
          className="figma-nav-link figma-nav-link-static"
          aria-disabled="true"
        >
          <Icon name="wallet" />
          <span>S-coin Wallet</span>
        </span>
        <span
          className="figma-nav-link figma-nav-link-static"
          aria-disabled="true"
        >
          <Icon name="calendar" />
          <span>Lịch đặt của tôi</span>
        </span>
      </nav>
      <span className="figma-sidebar-compose" aria-disabled="true">
        + Bài viết mới
      </span>
    </aside>
  );
}
