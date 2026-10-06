/**
 * @file page.tsx
 * @description Route Cài đặt & hỗ trợ dành cho người dùng đã đăng nhập.
 */

import { AuthGuard } from '@/components/auth/AuthGuard';
import { SettingsSupportView } from '@/views/mentee/settings/SettingsSupportView';

export default async function SettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <AuthGuard locale={locale}>
      <SettingsSupportView />
    </AuthGuard>
  );
}
