/**
 * @file layout.tsx
 * @description Layout gốc của ứng dụng (Root Layout Component).
 * Nạp file stylesheet toàn cục `globals.css` và định nghĩa metadata mặc định cho ứng dụng SkillSwap.
 */

import type { Metadata, Viewport } from 'next';
import '@/styles/globals.css';
import { ToastProvider } from '@/components/ui/ToastProvider';

/** Metadata mặc định của trang web */
export const metadata: Metadata = {
  title: 'SkillSwap- Đổi kinh nghiệm, trao kỹ năng',
  description: 'University skill exchange platform',
  // Tối ưu thêm SEO, thêm keywords khi search trên google, openGraph để hiển thị tiêu đề, hình, nội dung như đã modify khi chia sẻ
  keywords: ['SkillSwap', 'tư vấn đồ án', 'mentor', 'hỗ trợ học tập', 'sinh viên', 'kinh nghiệm', 'kỹ năng', 'trao đổi', 'booking', 'university', 'fpt'],
  openGraph: {
    title: 'SkillSwap- Đổi kinh nghiệm, trao kỹ năng',
    description: 'University skill exchange platform',
    images: [
      {
        url: '/images/SkillSwap_Logo_Text.png',
        width: 1200,
        height: 630,
        // Đây là kích thước chuẩn của openGraph nha
        alt: 'SkillSwapLogo',
      },
    ],
    locale: 'vi_VN',
    type: 'website',
  },
  icons: {
    icon: '/images/SkillSwapLogo.png',
  },
  // alternates: {
  //   canonical: 'localhost:300'//địa chỉ tạm, mốt ghi link deploy vào env
  // },
  // metadataBase: new URL('localhost:300'),
};

//Thêm thư viện này vào để tránh bể nét khi hiển thị trên các thiêt bị khác
export const viewport: Viewport = {
  colorScheme: 'light',
  width: 'device-width',
  initialScale: 1,
};


/**
 * Component RootLayout bọc toàn bộ mã HTML gốc của ứng dụng Next.js.
 */
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Browser extensions can add attributes to <html> before React hydrates.
  return (
    <html lang="vi" suppressHydrationWarning>
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
