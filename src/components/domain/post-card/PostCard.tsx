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
    <article className="bg-white rounded-3xl border border-solid border-border-light shadow-xs hover:border-primary-border/60 transition-all duration-200 overflow-hidden flex flex-col mb-6 max-w-2xl mx-auto w-full">
      {/* Instagram Header */}
      <header className="flex items-center justify-between p-4 border-b border-solid border-border-light/60">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-full bg-primary-light border border-solid border-primary-border text-primary font-extrabold text-sm flex items-center justify-center shrink-0">
            {initials}
          </span>
          <div className="flex flex-col">
            <strong className="text-sm font-extrabold text-text-main hover:text-primary transition-colors leading-tight cursor-pointer">
              {post.author.name}
            </strong>
            <small className="text-xs text-text-muted font-normal mt-0.5">{post.createdAt}</small>
          </div>
        </div>
        <button
          type="button"
          className="p-1.5 rounded-xl text-text-muted hover:text-text-main hover:bg-surface-subtle transition-colors border-none bg-transparent cursor-pointer"
          aria-label={`More options for ${post.title}`}
          onClick={handleFlagClick}
        >
          ⋮
        </button>
      </header>

      {/* Post Media (Image) */}
      {post.mediaUrl && (
        <div className="w-full bg-slate-100 overflow-hidden">
          <img src={post.mediaUrl} alt="" className="w-full max-h-[480px] object-cover" />
        </div>
      )}

      {/* Instagram Action Buttons Bar */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleLikeClick}
            className={`flex items-center gap-1.5 text-sm font-bold transition-colors border-none bg-transparent cursor-pointer ${
              liked ? 'text-rose-500' : 'text-text-secondary hover:text-rose-500'
            }`}
            aria-pressed={liked}
          >
            <Heart className="w-5 h-5" aria-hidden="true" fill={liked ? 'currentColor' : 'none'} />
          </button>
          <Link
            href={`/${locale}/post-detail/${post.id}`}
            className="flex items-center gap-1.5 text-sm font-bold text-text-secondary hover:text-primary transition-colors"
            aria-label={`${commentCount} comments`}
          >
            <MessageCircle className="w-5 h-5" aria-hidden="true" />
          </Link>
        </div>
        <button
          type="button"
          className="p-1 text-text-secondary hover:text-primary transition-colors border-none bg-transparent cursor-pointer"
          aria-label="Save post"
          onClick={handleFlagClick}
        >
          <Bookmark className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      {/* Likes Count line */}
      <div className="px-4 text-xs font-extrabold text-text-main mb-1">
        {likes} lượt thích
      </div>

      {/* Post Caption & Body */}
      <div className="px-4 pb-3 flex flex-col gap-2">
        {post.showTitle !== false && (
          <Link href={`/${locale}/post-detail/${post.id}`} className="text-base font-extrabold text-text-main hover:text-primary transition-colors m-0 block">
            {post.title}
          </Link>
        )}
        <p className="text-sm text-text-secondary leading-relaxed m-0">{post.content}</p>
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {post.tags.map((tag) => (
              <span key={tag} className="text-xs font-semibold text-primary hover:underline cursor-pointer">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Comment Preview */}
      {post.previewComments?.length ? (
        <div className="px-4 py-2 bg-surface-subtle/50 text-xs text-text-secondary border-t border-solid border-border-light/60 flex flex-col gap-1">
          {post.previewComments.map((comment) => (
            <p key={comment.id} className="m-0 leading-relaxed">
              <strong className="font-bold text-text-main mr-1">{comment.authorName}</strong> {comment.content}
            </p>
          ))}
        </div>
      ) : null}

      {/* Comment Input Footer */}
      <div
        className="flex items-center gap-3 px-4 py-3 border-t border-solid border-border-light/60 bg-white"
        onClick={handleCommentClick}
        style={{ cursor: 'pointer' }}
      >
        <span className="w-7 h-7 rounded-full bg-primary-light text-primary font-bold text-[11px] flex items-center justify-center shrink-0">
          YO
        </span>
        <input
          readOnly
          className="w-full text-xs text-text-main bg-transparent outline-none cursor-pointer placeholder:text-text-muted"
          aria-label="Add a comment"
          placeholder="Thêm bình luận..."
        />
      </div>
    </article>
  );
}
