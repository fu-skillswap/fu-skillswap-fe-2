/**
 * @file page.tsx
 * @description Route Chi tiết bài viết theo ID (`/[locale]/post-detail/[id]`).
 * Lấy ID bài viết từ URL params, truy xuất bài viết & bình luận từ `postRepo` hoặc trả về 404 nếu không tìm thấy.
 */

import { PostDetailLoader } from '@/views/mentee/post-detail/PostDetailLoader';
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
    const { post, comments, relatedPosts } = await postRepo.findById(id);
    return (
      <PostDetailView
        post={post}
        initialComments={comments}
        relatedPosts={relatedPosts}
        locale={locale}
      />
    );
  } catch {
    // The server has no user token and may not reach the API: retry in the browser.
    return <PostDetailLoader id={id} locale={locale} />;
  }
}
