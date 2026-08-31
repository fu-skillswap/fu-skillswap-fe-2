/**
 * @file MentorShell.tsx
 * @description Khung giao diện dành cho Mentor đã được xác thực.
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import { MentorNavigation } from '@/components/domain/mentor-shell/MentorNavigation';
import { MenteeHeader } from '@/components/domain/mentee-shell/MenteeHeader';
import { MenteeShellContext } from '@/components/domain/mentee-shell/MenteeShell';
import { useAuth } from '@/providers/AuthProvider';
import { usePathname } from 'next/navigation';

const SIDEBAR_STORAGE_KEY = 'SS_SIDEBAR_OPEN';

function getInitialSidebarOpen(): boolean {
  if (typeof window === 'undefined') return true;
  if (window.innerWidth <= 1024) return false;
  const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY);
  return saved !== null ? saved === 'true' : true;
}

export function MentorShell({ children, locale }: { children: React.ReactNode; locale: string }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [headerTitle, setHeaderTitle] = useState<string>();
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth <= 1024) {
        setIsSidebarOpen(false);
      } else {
        const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY);
        setIsSidebarOpen(saved !== null ? saved === 'true' : true);
      }
    }
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined' && window.innerWidth > 1024) {
        try {
          localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
        } catch {
          // Ignore quota/access errors
        }
      }
      return next;
    });
  };
  const closeSidebar = () => setIsSidebarOpen(false);

  const contextValue = useMemo(
    () => ({
      setHeaderTitle,
      isSidebarOpen,
      toggleSidebar,
      closeSidebar,
    }),
    [isSidebarOpen],
  );

  useEffect(() => {
    setHeaderTitle(undefined);
    if (typeof window !== 'undefined' && window.innerWidth <= 1024) {
      setIsSidebarOpen(false);
    }
  }, [pathname]);

  let title = headerTitle ?? 'Bảng điều khiển Mentor';
  if (!headerTitle) {
    if (pathname.includes('/my-courses')) {
      title = 'Khóa học của tôi';
    } else if (pathname.includes('/mentor/services/')) {
      title = 'Chi tiết dịch vụ';
    } else if (pathname.includes('/schedule-manage')) {
      title = 'Dịch vụ & Lịch dạy';
    } else if (pathname.includes('/mentor/bookings')) {
      title = 'Lịch đặt';
    } else if (pathname.includes('/mentor/posts')) {
      title = 'Bài viết của tôi';
    }
  }

  return (
    <MenteeShellContext.Provider value={contextValue}>
      <div
        className={`figma-app mentor-app ${isSidebarOpen ? 'figma-app-sidebar-open' : 'figma-app-sidebar-closed'}`}
      >
        <div
          className={`figma-sidebar-backdrop ${isSidebarOpen ? 'figma-sidebar-backdrop-open' : ''}`}
          onClick={closeSidebar}
          aria-hidden="true"
        />
        <MentorNavigation locale={locale} isOpen={isSidebarOpen} onClose={closeSidebar} />
        <div className="figma-content-pane">
          <MenteeHeader title={title} locale={locale} user={user} onToggleSidebar={toggleSidebar} />
          <main className="figma-shell-main">{children}</main>
        </div>
      </div>
    </MenteeShellContext.Provider>
  );
}
