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
    setIsSidebarOpen((prev) => !prev);
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
    if (pathname.endsWith('/messages')) {
      title = 'Tin nhắn';
    } else if (pathname.includes('/my-courses')) {
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
      <div className="min-h-screen bg-bg text-text-main flex relative overflow-x-clip">
        <div
          className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center opacity-[0.08] select-none overflow-hidden"
          aria-hidden="true"
        >
          <img
            src="/images/Koko.png"
            alt=""
            className="w-full h-full object-contain p-4 md:p-8 scale-105"
          />
        </div>

        {/* Backdrop overlay for mobile sidebar */}
        <div
          className={`fixed inset-0 bg-slate-950/50 z-40 lg:hidden transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
          onClick={closeSidebar}
          aria-hidden="true"
        />
        <MentorNavigation locale={locale} isOpen={isSidebarOpen} onClose={closeSidebar} />
        <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 relative z-10 lg:pl-64">
          <MenteeHeader title={title} locale={locale} user={user} onToggleSidebar={toggleSidebar} />
          <main className="w-full flex-1">
            <div
              key={pathname}
              className="mentor-page-enter mx-auto w-full max-w-6xl px-4 py-4 sm:px-6 md:py-5 lg:px-8"
            >
              {children}
            </div>
          </main>
        </div>

        {/* AI Chatbot Floating Trigger (con cú bo tròn + chấm xanh active ở góc trên) */}
        <button
          type="button"
          aria-label="AI Support Chat"
          className="fixed bottom-6 right-6 z-40 w-15 h-15 rounded-full bg-white shadow-2xl border-2 border-solid border-primary/30 p-1 flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 transition-all duration-200 group"
        >
          <img
            src="/images/Koko.png"
            alt="AI Assistant"
            className="w-full h-full rounded-full object-cover"
          />
          <span
            className="absolute top-0 right-0 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-xs animate-pulse"
            title="AI Trợ lý trực tuyến"
          />
        </button>
      </div>
    </MenteeShellContext.Provider>
  );
}
