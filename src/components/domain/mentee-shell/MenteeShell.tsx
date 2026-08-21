"use client";

import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { DashboardNavigation } from "@/components/domain/dashboard-navigation/DashboardNavigation";
import { MenteeHeader } from "@/components/domain/mentee-shell/MenteeHeader";
import { useAuth } from "@/providers/AuthProvider";

type MenteeShellContextValue = {
  setHeaderTitle: (title?: string) => void;
};

const MenteeShellContext = createContext<MenteeShellContextValue | undefined>(undefined);

function routeTitle(pathname: string) {
  if (pathname.endsWith("/profile")) return "Hồ sơ của tôi";
  if (pathname.includes("/mentor-booking")) return "Tìm Mentor";
  if (pathname.includes("/post-detail/")) return "Chi tiết bài viết";
  return "Bảng tin";
}

export function useMenteeShell() {
  const context = useContext(MenteeShellContext);
  if (!context) throw new Error("useMenteeShell must be used inside MenteeShell");
  return context;
}

export function MenteeShell({ children, locale }: { children: React.ReactNode; locale: string }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [headerTitle, setHeaderTitle] = useState<string>();
  const title = headerTitle ?? routeTitle(pathname);
  const contextValue = useMemo(() => ({ setHeaderTitle }), []);

  useEffect(() => {
    setHeaderTitle(undefined);
  }, [pathname]);

  return <MenteeShellContext.Provider value={contextValue}>
    <div className="figma-app">
      <DashboardNavigation locale={locale} />
      <div className="figma-content-pane">
        <MenteeHeader title={title} locale={locale} user={user} />
        <main className="figma-shell-main">{children}</main>
      </div>
      <img className="figma-assistant-mascot" src="https://fang-squad-69023135.figma.site/assets/image-ByFusQW8.png" alt="" />
    </div>
  </MenteeShellContext.Provider>;
}
