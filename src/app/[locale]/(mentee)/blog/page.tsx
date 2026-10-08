/**
 * @file page.tsx
 * @description Route Blog cộng đồng (`/[locale]/blog`). Dữ liệu tải ở trình duyệt trong View.
 */

import { BlogListView } from '@/views/mentee/blog/BlogListView';

export default async function BlogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <BlogListView locale={locale} />;
}
