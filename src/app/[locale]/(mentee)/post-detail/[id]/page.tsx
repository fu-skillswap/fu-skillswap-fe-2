/**
 * @file page.tsx
 * @description Route Chi tiết bài viết theo ID (`/[locale]/post-detail/[id]`).
 * Lấy ID bài viết từ URL params, truy xuất bài viết & bình luận từ `postRepo` hoặc trả về 404 nếu không tìm thấy.
 */

import { notFound } from 'next/navigation';
import { PostDetailView } from '@/views/mentee/post-detail/PostDetailView';
import { postRepo } from '@/repositories/postRepo';

/**
 * Server Component cho trang Chi tiết bài viết.
 */
export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  try {
    const { post, comments } = await postRepo.findById(id);
    return <PostDetailView post={post} initialComments={comments} locale={locale} />;
  } catch {
    notFound();
  }
}
