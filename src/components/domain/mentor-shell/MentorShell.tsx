/**
 * @file MentorShell.tsx
 * @description Khung giao diện dành cho Mentor đã được xác thực.
 */

'use client';

import { MentorNavigation } from '@/components/domain/mentor-shell/MentorNavigation';
import { MenteeHeader } from '@/components/domain/mentee-shell/MenteeHeader';
import { useAuth } from '@/providers/AuthProvider';
import { usePathname } from 'next/navigation';

export function MentorShell({ children, locale }: { children: React.ReactNode; locale: string }) {
  const { user } = useAuth();
  const pathname = usePathname();

  let title = 'Bảng điều khiển Mentor';
  if (pathname.includes('/my-courses')) {
    title = 'Khóa học của tôi';
  } else if (pathname.includes('/mentor/services/')) {
    title = 'Chi tiết dịch vụ';
  } else if (pathname.includes('/schedule-manage')) {
    title = 'Dịch vụ & Lịch dạy';
  }

  return (
    <div className="figma-app mentor-app">
      <MentorNavigation locale={locale} />
      <div className="figma-content-pane">
        <MenteeHeader title={title} locale={locale} user={user} />
        <main className="figma-shell-main">{children}</main>
      </div>
    </div>
  );
}
