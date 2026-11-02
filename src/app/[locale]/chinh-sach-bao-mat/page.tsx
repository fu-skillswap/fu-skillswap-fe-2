/**
 * @file page.tsx
 * @description Route công khai Chính sách bảo mật (`/[locale]/chinh-sach-bao-mat`), không cần
 * đăng nhập. `/en` tạm dùng cùng nội dung tiếng Việt.
 */

import type { Metadata, ResolvingMetadata } from 'next';
import { PrivacyPolicyView } from '@/views/legal/PrivacyPolicyView';

const TITLE = 'Chính sách bảo mật | SkillSwap';
const DESCRIPTION =
  'SkillSwap thu thập dữ liệu gì, dùng để làm gì, chia sẻ với ai, giữ bao lâu và cách xóa tài khoản.';
const CANONICAL_PATH = '/vi/chinh-sach-bao-mat';

export async function generateMetadata(
  _props: unknown,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  // Keep the layout's Open Graph image/siteName, but point the URL at this page.
  const parentOpenGraph = (await parent).openGraph ?? {};
  return {
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical: CANONICAL_PATH },
    robots: { index: true, follow: true },
    openGraph: {
      ...parentOpenGraph,
      title: TITLE,
      description: DESCRIPTION,
      url: CANONICAL_PATH,
    },
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
