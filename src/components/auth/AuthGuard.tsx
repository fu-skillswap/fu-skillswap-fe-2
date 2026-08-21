/**
 * @file AuthGuard.tsx
 * @description Component bảo vệ Route (Route Protection Guard).
 * Kiểm tra trạng thái đăng nhập người dùng, nếu chưa xác thực sẽ tự động điều hướng về trang Login kèm query parameter `next`.
 */

'use client';

import { useAuth } from '@/providers/AuthProvider';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Component bọc các trang yêu cầu xác thực để bảo vệ truy cập.
 */
export function AuthGuard({ children, locale }: { children: React.ReactNode; locale: string }) {
  const { isAuthenticated, isBootstrapping } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isBootstrapping && !isAuthenticated)
      router.replace(`/${locale}/login?next=${encodeURIComponent(pathname)}`);
  }, [isAuthenticated, isBootstrapping, locale, pathname, router]);

  if (isBootstrapping)
    return (
      <main className="auth-guard-loading" aria-live="polite">
        Đang khôi phục phiên đăng nhập...
      </main>
    );

  return isAuthenticated ? <>{children}</> : null;
}
