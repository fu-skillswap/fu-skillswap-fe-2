/**
 * @file AdminSidebar.tsx
 * @description Điều hướng dùng chung cho toàn bộ khu vực quản trị.
 */

'use client';

import { adminRepo } from '@/repositories/adminRepo';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  ChartNoAxesCombined,
  CircleUserRound,
  LayoutDashboard,
  Menu,
  ShieldCheck,
  TriangleAlert,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';

type NavigationItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  /** Query param `source` value this item represents; items without it match only when absent. */
  source?: string;
  badge?: { count: number; variant?: 'primary' | 'warning' };
};

type PendingVerification = { count: number; overdue: boolean };

function formatBadgeCount(count: number) {
  return count > 99 ? '99+' : String(count);
}

export function AdminSidebar({ locale }: { locale: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [pendingVerification, setPendingVerification] = useState<PendingVerification>();
  const adminRoot = `/${locale}/admin`;
  const source = searchParams.get('source') ?? undefined;

  useEffect(() => {
    let cancelled = false;
    adminRepo
      .getQueues()
      .then(({ queues }) => {
        const queue = queues.find((item) => item.queueKey === 'MENTOR_VERIFICATION');
        if (!cancelled && queue) {
          setPendingVerification({ count: queue.pendingCount, overdue: queue.slaBreachCount > 0 });
        }
      })
      .catch(() => {
        // The badge is optional; navigation must keep working without it.
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const navigation: NavigationItem[] = [
    { href: `${adminRoot}/dashboard`, label: 'Tổng quan', icon: LayoutDashboard, exact: true },
    {
      href: `${adminRoot}/mentor-verification`,
      label: 'Xác minh mentor',
      icon: ShieldCheck,
      badge: pendingVerification?.count
        ? {
            count: pendingVerification.count,
            variant: pendingVerification.overdue ? 'warning' : 'primary',
          }
        : undefined,
    },
    { href: `${adminRoot}/users`, label: 'Người dùng', icon: Users },
    { href: `${adminRoot}/bookings`, label: 'Lịch hẹn', icon: CalendarDays },
    { href: `${adminRoot}/reports`, label: 'Báo cáo & đánh giá', icon: ChartNoAxesCombined },
  ];
  const aiNavigation: NavigationItem[] = [
    { href: `${adminRoot}/ai-knowledge`, label: 'Kho tri thức & chi phí', icon: BookOpen },
    {
      href: `${adminRoot}/reports?source=ai`,
      label: 'Nội dung AI gắn cờ',
      icon: TriangleAlert,
      source: 'ai',
    },
  ];
  const isActive = (item: NavigationItem) => {
    const path = item.href.split('?')[0];
    const pathMatches = item.exact
      ? pathname === path
      : pathname === path || pathname.startsWith(`${path}/`);
    return pathMatches && item.source === source;
  };

  const renderItem = (item: NavigationItem) => {
    const Icon = item.icon;
    const active = isActive(item);
    return (
      <Link
        key={item.href}
        className={active ? 'is-active' : ''}
        href={item.href}
        aria-current={active ? 'page' : undefined}
        onClick={() => setIsOpen(false)}
      >
        <Icon aria-hidden="true" />
        <span>{item.label}</span>
        {item.badge && (
          <span
            className={`admin-navigation-badge ${item.badge.variant === 'warning' ? 'is-warning' : ''}`}
            aria-label={`${item.badge.count} đang chờ`}
          >
            {formatBadgeCount(item.badge.count)}
          </span>
        )}
      </Link>
    );
  };

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
            <strong>SkillSwap Admin</strong>
            <span>Quản trị nền tảng</span>
          </div>
        </div>
        <nav className="admin-navigation-links" aria-label="Điều hướng quản trị">
          {navigation.map(renderItem)}
          <p className="admin-navigation-group-label">Trợ lý AI</p>
          {aiNavigation.map(renderItem)}
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
