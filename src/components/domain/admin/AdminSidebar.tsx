/**
 * @file AdminSidebar.tsx
 * @description Sidebar cố định dùng chung cho toàn bộ khu vực quản trị.
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type ReactNode } from 'react';
import {
  CalendarDays,
  ChartNoAxesCombined,
  CircleUserRound,
  LayoutDashboard,
  ArrowUpRight,
  ShieldCheck,
  Users,
  type LucideIcon,
} from 'lucide-react';

type IconName = 'booking' | 'grid' | 'report' | 'shield' | 'users';

const iconPaths: Record<IconName, ReactNode> = {
  booking: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18M12 14v3" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </>
  ),
  report: (
    <>
      <path d="M3 21V3h18v12H8z" />
      <path d="m10 15 2-2 2 1 3-4" />
    </>
  ),
  shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Zm-3.5-10 2.2 2.2 4.8-4.8" />,
  users: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" />
    </>
  ),
};

const iconComponents: Record<IconName, LucideIcon> = {
  booking: CalendarDays,
  grid: LayoutDashboard,
  report: ChartNoAxesCombined,
  shield: ShieldCheck,
  users: Users,
};

function Icon({ name }: { name: IconName }) {
  const Component = iconComponents[name];
  return <Component aria-hidden="true" className="admin-icon" />;
}

export function AdminSidebar({ locale }: { locale: string }) {
  const pathname = usePathname();
  const dashboardHref = `/${locale}/admin/dashboard`;
  const mentorVerificationHref = `/${locale}/admin/mentor-verification`;
  const usersHref = `/${locale}/admin/users`;

  return (
    <aside className="admin-sidebar admin-shared-sidebar">
      <div className="admin-brand">
        <img src="/images/SkillSwapLogo.png" alt="SkillSwap" />
        <div>
          <strong>
            SkillSwap
            <br />
            Admin
          </strong>
          <span>
            Academic
            <br />
            Management
          </span>
        </div>
      </div>
      <nav aria-label="Điều hướng quản trị">
        <Link className={pathname === dashboardHref ? 'is-active' : ''} href={dashboardHref}>
          <Icon name="grid" />
          Tổng quan
        </Link>
        <Link
          className={pathname === mentorVerificationHref ? 'is-active' : ''}
          href={mentorVerificationHref}
        >
          <Icon name="shield" />
          Xác minh mentor
        </Link>
        <Link className={pathname === usersHref ? 'is-active' : ''} href={usersHref}>
          <Icon name="users" />
          Người dùng
        </Link>
        <a href="#bookings">
          <Icon name="booking" />
          Lịch hẹn
        </a>
        <a href="#reports">
          <Icon name="report" />
          Đánh giá &amp; báo cáo
        </a>
      </nav>
      <div className="admin-sidebar-footer">
        <a href="/" target="_blank" rel="noreferrer">
          <ArrowUpRight aria-hidden="true" className="admin-icon" /> <span>Xem SkillSwap</span>
        </a>
        <a href="#profile">
          <CircleUserRound aria-hidden="true" className="admin-icon" /> <span>Hồ sơ</span>
        </a>
      </div>
    </aside>
  );
}
