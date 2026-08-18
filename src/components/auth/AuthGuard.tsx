"use client";

import { useAuth } from "@/providers/AuthProvider";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export function AuthGuard({ children, locale }: { children: React.ReactNode; locale: string }) {
  const { isAuthenticated, isBootstrapping } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => { if (!isBootstrapping && !isAuthenticated) router.replace(`/${locale}/login?next=${encodeURIComponent(pathname)}`); }, [isAuthenticated, isBootstrapping, locale, pathname, router]);
  if (isBootstrapping) return <main className="auth-guard-loading" aria-live="polite">Đang khôi phục phiên đăng nhập...</main>;
  return isAuthenticated ? <>{children}</> : null;
}
