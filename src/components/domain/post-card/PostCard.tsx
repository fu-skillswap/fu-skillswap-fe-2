/**
 * @file PostCard.tsx
 * @description Component Thẻ hiển thị Bài viết trên Bảng tin (Post Card Component).
 * Hiển thị tác giả, tiêu đề, nội dung, hình ảnh đính kèm, hashtag, lượt like, bình luận xem trước.
 */

'use client';

import Link from 'next/link';
import type { Post } from '@/models/entities';
import { useAuth } from '@/providers/AuthProvider';
import { Bookmark, Heart, MessageCircle } from 'lucide-react';
import { usePostCard } from './usePostCard';

const mascotSrc = '/images/Koko.png';

/** Props của PostCard Component */
interface PostCardProps {
  /** Thông tin đối tượng bài viết */
  post: Post;
  /** Mã ngôn ngữ hiện tại */
  locale?: string;
}

/**
 * Component thẻ bài viết hiển thị trên dòng thời gian Bảng tin.
 */
export function PostCard({ post, locale = 'vi' }: PostCardProps) {
  const { likes, liked, toggleLike } = usePostCard(post.likes);
  const { isAuthenticated, showAuthRequiredModal } = useAuth();

  const initials = post.author.name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('');
  const commentCount = post.commentCount ?? 0;

  const handleLikeClick = () => {
    if (!isAuthenticated) {
      showAuthRequiredModal(
        'Bạn cần Đăng nhập hoặc Đăng ký tài khoản để tương tác yêu thích bài viết.',
      );
      return;
    }
    toggleLike();
  };

  const handleCommentClick = () => {
    if (!isAuthenticated) {
      showAuthRequiredModal(
        'Bạn cần Đăng nhập hoặc Đăng ký tài khoản để tham gia bình luận bài viết.',
      );
    }
  };

  const handleFlagClick = () => {
    if (!isAuthenticated) {
      showAuthRequiredModal('Bạn cần Đăng nhập hoặc Đăng ký tài khoản để lưu bài viết.');
    }
  };

  return (
    <article className="figma-post-card">
      <span className="figma-post-accent" />
      <header className="figma-post-header">
        <span className="figma-avatar figma-post-avatar">{initials}</span>
        <span className="figma-post-author">
          <strong>{post.author.name}</strong>
          <small>{post.createdAt}</small>
        </span>
        <button
          type="button"
          className="figma-more-button"
          aria-label={`More options for ${post.title}`}
          onClick={handleFlagClick}
        >
          ⋮
        </button>
        {post.showMascot && <img className="figma-post-mascot" src={mascotSrc} alt="" />}
      </header>
      {post.mediaUrl && <img className="figma-post-media" src={post.mediaUrl} alt="" />}
      <div className="figma-post-body">
        {post.showTitle !== false && (
          <Link href={`/${locale}/post-detail/${post.id}`} className="figma-post-title">
            {post.title}
          </Link>
        )}
        <p>{post.content}</p>
        {post.tags.length > 0 && (
          <div className="figma-post-tags">
            {post.tags.map((tag) => (
              <span key={tag}>#{tag}</span>
            ))}
          </div>
        )}
      </div>
      <footer className="figma-post-actions">
        <button
          type="button"
          onClick={handleLikeClick}
          className={liked ? 'figma-like-button figma-like-button-active' : 'figma-like-button'}
          aria-pressed={liked}
        >
          <Heart aria-hidden="true" fill={liked ? 'currentColor' : 'none'} />
          <span>{likes}</span>
        </button>
        <Link
          href={`/${locale}/post-detail/${post.id}`}
          className="figma-discussion-link"
          aria-label={`${commentCount} comments`}
        >
          <MessageCircle aria-hidden="true" />
          <span>{commentCount}</span>
        </Link>
        <button
          type="button"
          className="figma-flag-button"
          aria-label="Save post"
          onClick={handleFlagClick}
        >
          <Bookmark aria-hidden="true" />
        </button>
      </footer>
      {post.previewComments?.length ? (
        <div className="figma-post-comment-preview">
          {post.previewComments.map((comment) => (
            <p key={comment.id}>
              <strong>{comment.authorName}</strong> {comment.content}
            </p>
          ))}
        </div>
      ) : null}
      <div
        className="figma-post-comment-input"
        onClick={handleCommentClick}
        style={{ cursor: 'pointer' }}
      >
        <span className="figma-inline-avatar">YO</span>
        <input
          readOnly
          aria-label="Add a comment"
          placeholder="Add a comment..."
          style={{ cursor: 'pointer' }}
        />
      </div>
    </article>
  );
}
