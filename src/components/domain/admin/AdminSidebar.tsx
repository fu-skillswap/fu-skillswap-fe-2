/**
 * @file AdminSidebar.tsx
 * @description Điều hướng dùng chung cho toàn bộ khu vực quản trị.
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  ArrowUpRight,
  CalendarDays,
  ChartNoAxesCombined,
  CircleUserRound,
  LayoutDashboard,
  Menu,
  ShieldCheck,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';

type NavigationItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

export function AdminSidebar({ locale }: { locale: string }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const adminRoot = `/${locale}/admin`;
  const navigation: NavigationItem[] = [
    { href: `${adminRoot}/dashboard`, label: 'Tổng quan', icon: LayoutDashboard, exact: true },
    { href: `${adminRoot}/mentor-verification`, label: 'Xác minh mentor', icon: ShieldCheck },
    { href: `${adminRoot}/users`, label: 'Người dùng', icon: Users },
    { href: `${adminRoot}/bookings`, label: 'Lịch hẹn', icon: CalendarDays },
    { href: `${adminRoot}/reports`, label: 'Đánh giá & báo cáo', icon: ChartNoAxesCombined },
  ];
  const isActive = (item: NavigationItem) =>
    item.exact
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <>
      <button
        type="button"
        className="admin-mobile-menu"
        aria-label="Mở menu quản trị"
        aria-expanded={isOpen}
        aria-controls="admin-sidebar"
        onClick={() => setIsOpen(true)}
      >
        <Menu aria-hidden="true" />
      </button>
      {isOpen && (
        <button
          type="button"
          className="admin-sidebar-backdrop"
          aria-label="Đóng menu quản trị"
          onClick={() => setIsOpen(false)}
        />
      )}
      <aside id="admin-sidebar" className={`admin-navigation ${isOpen ? 'is-open' : ''}`}>
        <div className="admin-navigation-brand">
          <Link
            href={`/${locale}`}
            aria-label="Trang chủ SkillSwap"
            onClick={() => setIsOpen(false)}
          >
            <img src="/images/SkillSwapLogo.png" alt="SkillSwap" />
          </Link>
          <button
            type="button"
            className="admin-navigation-close"
            aria-label="Đóng menu quản trị"
            onClick={() => setIsOpen(false)}
          >
            <X aria-hidden="true" />
          </button>
          <div>
            <span>Không gian quản trị</span>
            <strong>SkillSwap Admin</strong>
          </div>
        </div>
        <nav className="admin-navigation-links" aria-label="Điều hướng quản trị">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                className={isActive(item) ? 'is-active' : ''}
                href={item.href}
                aria-current={isActive(item) ? 'page' : undefined}
                onClick={() => setIsOpen(false)}
              >
                <Icon aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="admin-navigation-footer">
          <a href={`/${locale}`} target="_blank" rel="noreferrer">
            <ArrowUpRight aria-hidden="true" />
            <span>Xem trang SkillSwap</span>
          </a>
          <Link
            href={`${adminRoot}/profile`}
            className={pathname.startsWith(`${adminRoot}/profile`) ? 'is-active' : ''}
            onClick={() => setIsOpen(false)}
          >
            <CircleUserRound aria-hidden="true" />
            <span>Hồ sơ của tôi</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
