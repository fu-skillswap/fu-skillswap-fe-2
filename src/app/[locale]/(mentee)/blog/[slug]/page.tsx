/**
 * @file page.tsx
 * @description Route đọc bài Blog theo slug (`/[locale]/blog/[slug]`). Dữ liệu tải ở trình duyệt
 * để bài chỉ dành cho người đã đăng nhập dùng được token của người đọc.
 */

import { BlogDetailView } from '@/views/mentee/blog-detail/BlogDetailView';

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  return <BlogDetailView slug={decodeURIComponent(slug)} locale={locale} />;
}
