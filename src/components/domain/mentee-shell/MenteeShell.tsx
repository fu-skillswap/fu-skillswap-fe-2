/**
 * @file MenteeShell.tsx
 * @description Component Khung giao diện chính dành cho khu vực Mentee (Mentee Dashboard Layout Shell).
 * Cung cấp Context điều chỉnh tiêu đề thanh Topbar động theo từng trang con.
 */

'use client';

import { usePathname } from 'next/navigation';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { DashboardNavigation } from '@/components/domain/dashboard-navigation/DashboardNavigation';
import { MentorNavigation } from '@/components/domain/mentor-shell/MentorNavigation';
import { MenteeHeader } from '@/components/domain/mentee-shell/MenteeHeader';
import { useAuth } from '@/providers/AuthProvider';

type MenteeShellContextValue = {
  /** Hàm tùy chỉnh tiêu đề Topbar từ các view con */
  setHeaderTitle: (title?: string) => void;
  /** Cờ đánh dấu Sidebar đang mở (trên mobile/tablet) */
  isSidebarOpen: boolean;
  /** Hàm bật/tắt hiển thị Sidebar */
  toggleSidebar: () => void;
  /** Hàm đóng Sidebar */
  closeSidebar: () => void;
};

export const MenteeShellContext = createContext<MenteeShellContextValue | undefined>(undefined);

const SIDEBAR_STORAGE_KEY = 'SS_SIDEBAR_OPEN';

function getInitialSidebarOpen(): boolean {
  if (typeof window === 'undefined') return true;
  if (window.innerWidth <= 1024) return false;
  const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY);
  return saved !== null ? saved === 'true' : true;
}

/** Helper tự động xác định tiêu đề hiển thị mặc định theo path */
function routeTitle(pathname: string) {
  if (pathname.endsWith('/profile')) return 'Hồ sơ của tôi';
  if (pathname.includes('/my-bookings')) return 'Booking của tôi';
  if (pathname.includes('/mentor-booking')) return 'Tìm Mentor';
  if (pathname.includes('/post-detail/')) return 'Chi tiết bài viết';
  return 'Bảng tin';
}

/** Hook tùy chỉnh tiêu đề Topbar dành cho các component con nằm trong MenteeShell */
export function useMenteeShell() {
  const context = useContext(MenteeShellContext);
  return (
    context ?? {
      setHeaderTitle: () => {},
      isSidebarOpen: true,
      toggleSidebar: () => {},
      closeSidebar: () => {},
    }
  );
}

/**
 * Component bọc layout chuẩn của Mentee (Sidebar navigation, topbar header, mascot trợ lý).
 */
export function MenteeShell({ children, locale }: { children: React.ReactNode; locale: string }) {
  const pathname = usePathname();
  const { user } = useAuth();
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

  const title = headerTitle ?? routeTitle(pathname);
  const isMentor = user?.roles?.includes('MENTOR');

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

  /** Tự động đóng sidebar trên mobile và reset tiêu đề khi thay đổi trang */
  useEffect(() => {
    setHeaderTitle(undefined);
    if (typeof window !== 'undefined' && window.innerWidth <= 1024) {
      setIsSidebarOpen(false);
    }
  }, [pathname]);

  return (
    <MenteeShellContext.Provider value={contextValue}>
      <div className="min-h-screen bg-bg text-text-main flex relative overflow-x-clip">
        {/* Background Watermark KooKoo Mascot (phóng to chiếm trọn màn hình dưới sidebar & bài post) */}
        <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center opacity-[0.08] select-none overflow-hidden" aria-hidden="true">
          <img
            src="/images/Koko.png"
            alt=""
            className="w-full h-full object-contain p-4 md:p-8 scale-105"
          />
        </div>

        {/* Backdrop che mờ màn hình khi mở Sidebar trên thiết bị di động */}
        <div
          className={`fixed inset-0 bg-slate-950/50 z-40 lg:hidden transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
          onClick={closeSidebar}
          aria-hidden="true"
        />

        {isMentor ? (
          <MentorNavigation locale={locale} isOpen={isSidebarOpen} onClose={closeSidebar} />
        ) : (
          <DashboardNavigation locale={locale} isOpen={isSidebarOpen} onClose={closeSidebar} />
        )}

        <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 relative z-10 lg:pl-64">
          <MenteeHeader title={title} locale={locale} user={user} onToggleSidebar={toggleSidebar} />
          <main className="flex-1 p-4 md:p-6 max-w-[1480px] w-full mx-auto">{children}</main>
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
