/**
 * @file layout.tsx
 * @description Layout cho nhóm Route hỗ trợ đa ngôn ngữ (`/[locale]`).
 * Bọc các Provider toàn cục QueryProvider và AuthProvider cho toàn bộ cây component con.
 */

import type { Metadata } from 'next';
import { AuthProvider } from '@/providers/AuthProvider';
import { QueryProvider } from '@/providers/QueryProvider';

const SITE_URL = new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://skillswap.asia');
// TODO: Thay ảnh ghép từ logo bằng thiết kế Open Graph chính thức khi có bộ nhận diện.
const OG_IMAGE_URL = new URL('/images/og-cover.png', SITE_URL).toString();

const localizedMetadata = {
  vi: {
    title: 'SkillSwap - Đổi kinh nghiệm, trao kỹ năng',
    description:
      'Kết nối bạn với mentor có kinh nghiệm thực tế. Đặt lịch học 1:1 hoặc khóa học ngắn, xem giá rõ ràng trước khi xác nhận đặt lịch.',
    openGraphLocale: 'vi_VN',
    imageAlt: 'SkillSwap - Đổi kinh nghiệm, trao kỹ năng',
  },
  en: {
    title: 'SkillSwap - Exchange experience, share skills',
    description:
      'Connect with experienced mentors. Book a one-to-one session or a short course and review transparent pricing before you confirm.',
    openGraphLocale: 'en_US',
    imageAlt: 'SkillSwap - Exchange experience, share skills',
  },
} as const;

type SupportedLocale = keyof typeof localizedMetadata;

function isSupportedLocale(locale: string): locale is SupportedLocale {
  return locale in localizedMetadata;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const supportedLocale = isSupportedLocale(locale) ? locale : 'vi';
  const content = localizedMetadata[supportedLocale];

  return {
    title: content.title,
    description: content.description,
    alternates: {
      canonical: `/${supportedLocale}`,
      languages: {
        vi: '/vi',
        en: '/en',
      },
    },
    openGraph: {
      title: content.title,
      description: content.description,
      url: `/${supportedLocale}`,
      siteName: 'SkillSwap',
      images: [
        {
          url: OG_IMAGE_URL,
          width: 1200,
          height: 630,
          alt: content.imageAlt,
        },
      ],
      locale: content.openGraphLocale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: content.title,
      description: content.description,
      images: [OG_IMAGE_URL],
    },
  };
}

/**
 * Component LocaleLayout cấp cao nhất dưới route `/[locale]`.
 */
export default function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  void params;
  return (
    <QueryProvider>
      <AuthProvider>{children}</AuthProvider>
    </QueryProvider>
  );
}
