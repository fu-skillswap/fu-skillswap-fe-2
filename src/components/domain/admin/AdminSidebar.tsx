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
  return <Component aria-hidden="true" className="w-5 h-5 shrink-0" />;
}

export function AdminSidebar({ locale }: { locale: string }) {
  const pathname = usePathname();
  const dashboardHref = `/${locale}/admin/dashboard`;
  const mentorVerificationHref = `/${locale}/admin/mentor-verification`;
  const usersHref = `/${locale}/admin/users`;
  const bookingsHref = `/${locale}/admin/bookings`;
  const reportsHref = `/${locale}/admin/reports`;
  const profileHref = `/${locale}/admin/profile`;

  return (
    <aside className="w-64 bg-slate-950 text-white min-h-screen flex flex-col p-4 shrink-0 border-r border-solid border-slate-800/80 shadow-2xl">
      <div className="flex items-center gap-3 pb-5 mb-3 border-b border-solid border-slate-800/80">
        <img src="/images/SkillSwapLogo.png" alt="SkillSwap" className="h-9 w-auto object-contain drop-shadow-md" />
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Cổng quản lý</span>
          <strong className="text-sm font-extrabold text-white block tracking-tight">SkillSwap Admin</strong>
        </div>
      </div>
      <nav className="flex-1 flex flex-col gap-1.5 overflow-y-auto" aria-label="Điều hướng quản trị">
        <Link className={pathname === dashboardHref ? 'flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-extrabold bg-primary text-white shadow-lg shadow-primary/20 transition-all border border-solid border-primary/40' : 'flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-900 transition-all'} href={dashboardHref}>
          <Icon name="grid" />
          Tổng quan
        </Link>
        <Link
          className={pathname === mentorVerificationHref ? 'flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-extrabold bg-primary text-white shadow-lg shadow-primary/20 transition-all border border-solid border-primary/40' : 'flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-900 transition-all'}
          href={mentorVerificationHref}
        >
          <Icon name="shield" />
          Xác minh mentor
        </Link>
        <Link className={pathname === usersHref ? 'flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-extrabold bg-primary text-white shadow-lg shadow-primary/20 transition-all border border-solid border-primary/40' : 'flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-900 transition-all'} href={usersHref}>
          <Icon name="users" />
          Người dùng
        </Link>
        <Link className={pathname === bookingsHref ? 'flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-extrabold bg-primary text-white shadow-lg shadow-primary/20 transition-all border border-solid border-primary/40' : 'flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-900 transition-all'} href={bookingsHref}>
          <Icon name="booking" />
          Lịch hẹn
        </Link>
        <Link className={pathname === reportsHref ? 'flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-extrabold bg-primary text-white shadow-lg shadow-primary/20 transition-all border border-solid border-primary/40' : 'flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-900 transition-all'} href={reportsHref}>
          <Icon name="report" />
          Đánh giá &amp; báo cáo
        </Link>
      </nav>
      <div className="pt-4 border-t border-solid border-slate-800/80 flex flex-col gap-1.5">
        <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-900 transition-all">
          <ArrowUpRight aria-hidden="true" className="w-5 h-5 shrink-0" /> <span>Xem SkillSwap</span>
        </a>
        <Link className={pathname === profileHref ? 'flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-extrabold bg-primary text-white shadow-lg shadow-primary/20 transition-all border border-solid border-primary/40' : 'flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-900 transition-all'} href={profileHref}>
          <CircleUserRound aria-hidden="true" className="w-5 h-5 shrink-0" /> <span>Hồ sơ</span>
        </Link>
      </div>
    </aside>
  );
}
