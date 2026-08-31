/**
 * @file AdminGuard.tsx
 * @description Bảo vệ khu vực Admin, chỉ cho phép role ADMIN hoặc SYSTEM_ADMIN truy cập.
 */

'use client';

import { useAuth } from '@/providers/AuthProvider';
import { AdminLoadingState } from '@/components/domain/admin/AdminLoadingState';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

function hasAdminRole(roles?: string[]) {
  return roles?.some((role) => role === 'ADMIN' || role === 'SYSTEM_ADMIN') ?? false;
}

export function AdminGuard({ children, locale }: { children: React.ReactNode; locale: string }) {
  const { isAuthenticated, isBootstrapping, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isBootstrapping && !isAuthenticated) router.replace(`/${locale}/admin/login`);
  }, [isAuthenticated, isBootstrapping, locale, router]);

  if (isBootstrapping) {
    return <AdminLoadingState message="Đang xác thực quyền quản trị..." />;
  }

  if (!isAuthenticated) return null;

  if (!hasAdminRole(user?.roles)) {
    return (
      <main className="min-h-screen bg-bg flex flex-col items-center justify-center p-6 text-center text-text-main gap-2" role="alert">
        <strong className="text-lg font-bold text-danger">Không có quyền truy cập</strong>
        <span className="text-sm text-text-muted">Tài khoản này không có vai trò quản trị viên.</span>
      </main>
    );
  }

  return <>{children}</>;
}
