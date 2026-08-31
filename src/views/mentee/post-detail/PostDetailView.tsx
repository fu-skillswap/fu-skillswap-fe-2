/**
 * @file PostDetailView.tsx
 * @description React Component trang Chi tiết bài viết & Bình luận (Post Detail & Comments View) sử dụng React Hook Form.
 * Hiển thị nội dung chi tiết bài viết, tác giả, hashtag và khung thảo luận bình luận của cộng đồng.
 */

'use client';

import Link from 'next/link';
import type { Comment, Post } from '@/models/entities';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/providers/AuthProvider';
import { usePostDetail } from './usePostDetail';

/** Props của PostDetailView Component */
interface PostDetailViewProps {
  /** Chi tiết đối tượng bài viết */
  post: Post;
  /** Danh sách các bình luận ban đầu của bài viết */
  initialComments: Comment[];
  /** Mã locale ngôn ngữ */
  locale: string;
}

/**
 * Component hiển thị chi tiết bài viết và form bình luận.
 */
export function PostDetailView({ post, initialComments, locale }: PostDetailViewProps) {
  const { register, errors, serverError, comments, submitComment } = usePostDetail(
    post.id,
    initialComments,
  );
  const { isAuthenticated, showAuthRequiredModal } = useAuth();

  const handleTextareaClick = () => {
    if (!isAuthenticated) {
      showAuthRequiredModal(
        'Bạn cần Đăng nhập hoặc Đăng ký tài khoản để tham gia bình luận bài viết.',
      );
    }
  };

  return (
    <main className="max-w-4xl mx-auto space-y-6 py-4">
      <Link href={`/${locale}/dashboard`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
        ← Quay về trang chủ
      </Link>
      <article className="bg-white p-6 sm:p-8 rounded-3xl border border-solid border-border-light shadow-xs flex flex-col gap-4">
        <div className="text-xs text-text-muted font-medium">
          {post.author.name} · {post.createdAt}
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-text-main m-0">{post.title}</h1>
        <p className="text-sm text-text-secondary leading-relaxed m-0 whitespace-pre-wrap">{post.content}</p>
        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-solid border-border-light">
          {post.tags.map((tag) => (
            <span key={tag} className="px-2.5 py-0.5 rounded-full bg-surface-subtle text-[11px] font-semibold text-text-secondary border border-solid border-border-color">#{tag}</span>
          ))}
        </div>
      </article>
      <section className="bg-white p-6 sm:p-8 rounded-3xl border border-solid border-border-light shadow-xs flex flex-col gap-4">
        <h2 className="text-base font-bold text-text-main m-0">Thảo luận ({comments.length})</h2>
        {comments.map((comment) => (
          <article className="p-4 rounded-2xl bg-surface-subtle border border-solid border-border-color flex flex-col gap-1" key={comment.id}>
            <div className="flex items-center justify-between">
              <strong className="text-xs font-bold text-text-main">{comment.authorName}</strong>
              <span className="text-[10px] text-text-muted">{comment.createdAt}</span>
            </div>
            <p className="text-xs text-text-secondary m-0 mt-1">{comment.content}</p>
          </article>
        ))}
        <form className="flex flex-col gap-3 pt-2" onSubmit={submitComment} noValidate>
          <textarea
            className="w-full p-3.5 rounded-2xl border border-solid border-border-color bg-white text-text-main text-xs transition-all outline-none focus:border-primary focus:ring-3 focus:ring-primary-border resize-y"
            placeholder="Viết bình luận của bạn..."
            rows={4}
            onClick={handleTextareaClick}
            {...register('content')}
          />
          {errors.content && <p className="text-xs text-danger font-medium m-0">{errors.content.message}</p>}
          {serverError && <p className="text-xs text-danger font-medium m-0">{serverError}</p>}
          <Button type="submit" className="self-end">Gửi bình luận</Button>
        </form>
      </section>
    </main>
  );
}
