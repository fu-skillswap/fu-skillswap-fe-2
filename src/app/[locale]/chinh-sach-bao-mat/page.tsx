/**
 * @file page.tsx
 * @description Route công khai Chính sách bảo mật (`/[locale]/chinh-sach-bao-mat`), không cần
 * đăng nhập. `/en` tạm dùng cùng nội dung tiếng Việt.
 */

import type { Metadata } from 'next';
import { PrivacyPolicyView } from '@/views/legal/PrivacyPolicyView';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Chính sách bảo mật | SkillSwap',
    description:
      'SkillSwap thu thập dữ liệu gì, dùng để làm gì, chia sẻ với ai, giữ bao lâu và cách xóa tài khoản.',
    alternates: { canonical: '/vi/chinh-sach-bao-mat' },
    robots: { index: true, follow: true },
  };
}

export default async function PrivacyPolicyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <PrivacyPolicyView locale={locale} />;
}
