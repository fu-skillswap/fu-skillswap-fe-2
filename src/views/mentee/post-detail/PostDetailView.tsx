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
    <main className="page-shell narrow">
      <Link href={`/${locale}/dashboard`} className="back-link">
        ← Quay về trang chủ
      </Link>
      <article className="card post-detail">
        <div className="post-meta">
          {post.author.name} · {post.createdAt}
        </div>
        <h1>{post.title}</h1>
        <p>{post.content}</p>
        <div className="tags">
          {post.tags.map((tag) => (
            <span key={tag}>#{tag}</span>
          ))}
        </div>
      </article>
      <section className="comments">
        <h2>Thảo luận ({comments.length})</h2>
        {comments.map((comment) => (
          <article className="comment" key={comment.id}>
            <strong>{comment.authorName}</strong>
            <span>{comment.createdAt}</span>
            <p>{comment.content}</p>
          </article>
        ))}
        <form className="comment-form" onSubmit={submitComment} noValidate>
          <textarea
            placeholder="Viết bình luận của bạn..."
            rows={4}
            onClick={handleTextareaClick}
            {...register('content')}
          />
          {errors.content && <p className="error">{errors.content.message}</p>}
          {serverError && <p className="error">{serverError}</p>}
          <Button type="submit">Gửi bình luận</Button>
        </form>
      </section>
    </main>
  );
}
