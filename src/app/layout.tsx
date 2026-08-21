/**
 * @file layout.tsx
 * @description Layout gốc của ứng dụng (Root Layout Component).
 * Nạp file stylesheet toàn cục `globals.css` và định nghĩa metadata mặc định cho ứng dụng SkillSwap.
 */

import type { Metadata } from 'next';
import '@/styles/globals.css';

/** Metadata mặc định của trang web */
export const metadata: Metadata = {
  title: 'SkillSwap',
  description: 'University skill exchange platform',
  icons: {
    icon: '/images/SkillSwapLogo.png',
  },
};

/**
 * Component RootLayout bọc toàn bộ mã HTML gốc của ứng dụng Next.js.
 */
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Browser extensions can add attributes to <html> before React hydrates.
  return (
    <html lang="vi" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
