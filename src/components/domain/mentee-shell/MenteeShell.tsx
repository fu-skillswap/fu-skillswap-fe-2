/**
 * @file MenteeShell.tsx
 * @description Component Khung giao diện chính dành cho khu vực Mentee (Mentee Dashboard Layout Shell).
 * Cung cấp Context điều chỉnh tiêu đề thanh Topbar động theo từng trang con.
 */

"use client";

import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { DashboardNavigation } from "@/components/domain/dashboard-navigation/DashboardNavigation";
import { MenteeHeader } from "@/components/domain/mentee-shell/MenteeHeader";
import { useAuth } from "@/providers/AuthProvider";

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

const MenteeShellContext = createContext<MenteeShellContextValue | undefined>(
  undefined,
);

/** Helper tự động xác định tiêu đề hiển thị mặc định theo path */
function routeTitle(pathname: string) {
  if (pathname.endsWith("/profile")) return "Hồ sơ của tôi";
  if (pathname.includes("/mentor-booking")) return "Tìm Mentor";
  if (pathname.includes("/post-detail/")) return "Chi tiết bài viết";
  return "Bảng tin";
}

/** Hook tùy chỉnh tiêu đề Topbar dành cho các component con nằm trong MenteeShell */
export function useMenteeShell() {
  const context = useContext(MenteeShellContext);
  if (!context)
    throw new Error("useMenteeShell must be used inside MenteeShell");
  return context;
}

/**
 * Component bọc layout chuẩn của Mentee (Sidebar navigation, topbar header, mascot trợ lý).
 */
export function MenteeShell({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: string;
}) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [headerTitle, setHeaderTitle] = useState<string>();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const title = headerTitle ?? routeTitle(pathname);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
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

  /** Tự động đóng sidebar và reset tiêu đề khi thay đổi trang */
  useEffect(() => {
    setHeaderTitle(undefined);
    setIsSidebarOpen(false);
  }, [pathname]);

  return (
    <MenteeShellContext.Provider value={contextValue}>
      <div className={`figma-app ${isSidebarOpen ? "figma-app-sidebar-open" : ""}`}>
        {/* Backdrop che mờ màn hình khi mở Sidebar trên thiết bị di động */}
        <div
          className={`figma-sidebar-backdrop ${
            isSidebarOpen ? "figma-sidebar-backdrop-open" : ""
          }`}
          onClick={closeSidebar}
          aria-hidden="true"
        />

        <DashboardNavigation
          locale={locale}
          isOpen={isSidebarOpen}
          onClose={closeSidebar}
        />

        <div className="figma-content-pane">
          <MenteeHeader
            title={title}
            locale={locale}
            user={user}
            onToggleSidebar={toggleSidebar}
          />
          <main className="figma-shell-main">{children}</main>
        </div>

        <img
          className="figma-assistant-mascot"
          src="https://fang-squad-69023135.figma.site/assets/image-ByFusQW8.png"
          alt=""
        />
      </div>
    </MenteeShellContext.Provider>
  );
}
