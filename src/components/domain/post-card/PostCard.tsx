/**
 * @file PostCard.tsx
 * @description Component Thẻ hiển thị Bài viết trên Bảng tin (Post Card Component).
 * Hiển thị tác giả, tiêu đề, nội dung, hình ảnh đính kèm, hashtag, lượt like, bình luận xem trước.
 */

'use client';

import Link from 'next/link';
import { CommentSection } from '@/components/domain/post-comments/CommentSection';
import type { Post } from '@/models/entities';
import { useAuth } from '@/providers/AuthProvider';
import { postRepo } from '@/repositories/postRepo';
import { confirmAction, showError, showSuccess } from '@/utils/toast';
import { Bookmark, Heart, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { ForumPostEditModal } from './ForumPostEditModal';
import { ForumReportModal } from './ForumReportModal';
import { usePostCard } from './usePostCard';

const mascotSrc = '/images/Koko.png';

/** Props của PostCard Component */
interface PostCardProps {
  /** Thông tin đối tượng bài viết */
  post: Post;
  /** Mã ngôn ngữ hiện tại */
  locale?: string;
  variant?: 'default' | 'community';
  typeLabel?: string;
  detailLabel?: string;
  onUpdated?: (post: Post) => void;
  onDeleted?: (postId: string) => void;
}

/**
 * Component thẻ bài viết hiển thị trên dòng thời gian Bảng tin.
 */
export function PostCard({
  post,
  locale = 'vi',
  variant = 'default',
  typeLabel,
  detailLabel = 'Xem chi tiết',
  onUpdated,
  onDeleted,
}: PostCardProps) {
  const { likes, liked, toggleLike } = usePostCard(post.id, post.likes, post.likedByCurrentUser);
  const { user, isAuthenticated, showAuthRequiredModal } = useAuth();
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [commentCount, setCommentCount] = useState(post.commentCount ?? 0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const isOwner = Boolean(user?.id && post.author.id === user.id);

  const initials = post.author.name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('');

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
      return;
    }
    setIsCommentsOpen((current) => !current);
  };

  const handleDeletePost = async () => {
    setIsMenuOpen(false);
    const confirmed = await confirmAction({
      title: 'Bạn chắc chắn muốn xóa bài viết?',
      message: 'Hành động này không thể hoàn tác.',
      confirmText: 'Xóa bài viết',
      variant: 'danger',
      simple: true,
    });
    if (!confirmed) return;
    try {
      await postRepo.delete(post.id);
      onDeleted?.(post.id);
      showSuccess('Bài viết đã được xóa.');
    } catch {
      showError('Không thể xóa bài viết. Vui lòng thử lại.');
    }
  };

  const handleFlagClick = () => {
    if (!isAuthenticated) {
      showAuthRequiredModal('Bạn cần Đăng nhập hoặc Đăng ký tài khoản để lưu bài viết.');
    }
  };

  if (variant === 'community') {
    return (
      <>
        <article className="w-full overflow-hidden rounded-[18px] border border-solid border-border-light bg-white shadow-[0_4px_16px_rgba(16,50,90,0.05)] transition-colors hover:border-primary-border/70">
          <header className="flex items-center justify-between gap-3 px-4 pb-3 pt-4 sm:px-5">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-solid border-primary-border bg-primary-light text-sm font-extrabold text-primary">
                {initials}
              </span>
              <div className="min-w-0">
                <strong className="block truncate text-sm font-extrabold leading-5 text-text-main">
                  {post.author.name}
                </strong>
                <div className="mt-0.5 flex flex-wrap items-center gap-2">
                  <small className="text-xs text-text-muted">{post.createdAt}</small>
                  {typeLabel && (
                    <span className="rounded-md bg-primary-light px-2 py-0.5 text-[10px] font-bold text-primary">
                      {typeLabel}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="relative">
              <button
                type="button"
                className="shrink-0 rounded-lg border-none bg-transparent p-1.5 text-text-muted hover:bg-surface-subtle hover:text-text-main"
                aria-label={`Tùy chọn cho ${post.title}`}
                aria-expanded={isMenuOpen}
                onClick={() => setIsMenuOpen((current) => !current)}
              >
                ⋮
              </button>
              {isMenuOpen && (
                <div className="absolute right-0 top-9 z-20 min-w-32 rounded-xl border border-solid border-border-light bg-white p-1 shadow-lg">
                  {isOwner ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditOpen(true);
                          setIsMenuOpen(false);
                        }}
                        className="w-full rounded-lg border-none bg-transparent px-3 py-2 text-left text-xs font-bold text-text-secondary hover:bg-surface-subtle"
                      >
                        Chỉnh sửa
                      </button>
                      <button
                        type="button"
                        onClick={handleDeletePost}
                        className="w-full rounded-lg border-none bg-transparent px-3 py-2 text-left text-xs font-bold text-danger hover:bg-red-50"
                      >
                        Xóa bài viết
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setIsReportOpen(true);
                        setIsMenuOpen(false);
                      }}
                      className="w-full rounded-lg border-none bg-transparent px-3 py-2 text-left text-xs font-bold text-text-secondary hover:bg-surface-subtle"
                    >
                      Báo cáo
                    </button>
                  )}
                </div>
              )}
            </div>
          </header>

          <div
            className={`px-4 sm:px-5 ${post.mediaUrl ? 'md:grid md:grid-cols-[minmax(0,1fr)_200px] md:gap-5' : ''}`}
          >
            <div className="min-w-0">
              {post.showTitle !== false && (
                <Link
                  href={`/${locale}/post-detail/${post.id}`}
                  className="m-0 line-clamp-2 block text-base font-extrabold leading-6 text-text-main transition-colors hover:text-primary sm:text-[17px]"
                >
                  {post.title}
                </Link>
              )}
              <p className="mb-0 mt-1 line-clamp-3 text-sm leading-6 text-text-secondary">
                {post.content}
              </p>
              {post.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md bg-surface-subtle px-2 py-1 text-[11px] font-semibold text-primary"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {post.mediaUrl && (
              <div className="mt-4 h-44 overflow-hidden rounded-xl bg-slate-100 md:mt-0 md:h-32">
                <img src={post.mediaUrl} alt="" className="h-full w-full object-cover" />
              </div>
            )}
          </div>

          <footer className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-solid border-border-light/70 px-4 py-3 sm:px-5">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleLikeClick}
                className={`flex items-center gap-1.5 border-none bg-transparent p-0 text-xs font-bold ${liked ? 'text-rose-500' : 'text-text-secondary hover:text-rose-500'}`}
                aria-pressed={liked}
              >
                <Heart
                  className="h-4.5 w-4.5"
                  fill={liked ? 'currentColor' : 'none'}
                  aria-hidden="true"
                />
                {likes}
              </button>
              <button
                type="button"
                onClick={handleCommentClick}
                aria-expanded={isCommentsOpen}
                aria-controls={`comments-${post.id}`}
                className="flex items-center gap-1.5 border-none bg-transparent p-0 text-xs font-bold text-text-secondary hover:text-primary"
              >
                <MessageCircle className="h-4.5 w-4.5" aria-hidden="true" />
                {commentCount}
              </button>
              <button
                type="button"
                onClick={handleFlagClick}
                className="flex items-center gap-1.5 border-none bg-transparent p-0 text-xs font-bold text-text-secondary hover:text-primary"
              >
                <Bookmark className="h-4.5 w-4.5" aria-hidden="true" />
                Lưu
              </button>
            </div>
            {detailLabel !== 'Xem thảo luận' && (
              <Link
                href={`/${locale}/post-detail/${post.id}`}
                className="inline-flex items-center text-xs font-bold text-primary hover:underline"
              >
                {detailLabel} →
              </Link>
            )}
          </footer>
          {isCommentsOpen && (
            <div id={`comments-${post.id}`}>
              <CommentSection
                postId={post.id}
                initialCount={commentCount}
                onCountChange={setCommentCount}
                autoLoad
              />
            </div>
          )}
        </article>
        {isEditOpen && (
          <ForumPostEditModal
            open
            post={post}
            onClose={() => setIsEditOpen(false)}
            onUpdated={(response) => onUpdated?.(postRepo.mapResponse(response))}
          />
        )}
        {isReportOpen && (
          <ForumReportModal
            open
            targetId={post.id}
            targetType="POST"
            onClose={() => setIsReportOpen(false)}
          />
        )}
      </>
    );
  }

  return (
    <article className="mx-auto mb-6 flex w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-solid border-border-light bg-white shadow-xs transition-all duration-200 hover:border-primary-border/60">
      {/* Instagram Header */}
      <header className="flex items-center justify-between p-4 border-b border-solid border-border-light/60">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-full bg-primary-light border border-solid border-primary-border text-primary font-extrabold text-sm flex items-center justify-center shrink-0">
            {initials}
          </span>
          <div className="flex flex-col min-w-0">
            <strong className="text-sm font-extrabold text-text-main hover:text-primary transition-colors leading-tight cursor-pointer">
              {post.author.name}
            </strong>
            <div className="mt-0.5 flex flex-wrap items-center gap-2">
              <small className="text-xs text-text-muted font-normal">{post.createdAt}</small>
              {typeLabel && (
                <span className="rounded-md bg-primary-light px-2 py-0.5 text-[10px] font-bold text-primary">
                  {typeLabel}
                </span>
              )}
            </div>
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
          <img src={post.mediaUrl} alt="" className="max-h-[480px] w-full object-cover" />
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
      <div className="px-4 text-xs font-extrabold text-text-main mb-1">{likes} lượt thích</div>

      {/* Post Caption & Body */}
      <div className="px-4 pb-3 flex flex-col gap-2">
        {post.showTitle !== false && (
          <Link
            href={`/${locale}/post-detail/${post.id}`}
            className="text-base font-extrabold text-text-main hover:text-primary transition-colors m-0 block"
          >
            {post.title}
          </Link>
        )}
        <p className="m-0 text-sm leading-relaxed text-text-secondary">{post.content}</p>
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs font-semibold text-primary hover:underline cursor-pointer"
              >
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
              <strong className="font-bold text-text-main mr-1">{comment.authorName}</strong>{' '}
              {comment.content}
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
