/**
 * @file PostDetailView.tsx
 * @description Trang đọc sâu bài viết Forum và thảo luận đầy đủ của cộng đồng SkillSwap.
 */

'use client';

import { CommentSection } from '@/components/domain/post-comments/CommentSection';
import { KouKouAnswerCard } from '@/components/domain/post-comments/KouKouAnswerCard';
import { ForumPostEditModal } from '@/components/domain/post-card/ForumPostEditModal';
import { ForumReportModal } from '@/components/domain/post-card/ForumReportModal';
import { usePostCard } from '@/components/domain/post-card/usePostCard';
import type { Comment, Post } from '@/models/entities';
import { useAuth } from '@/providers/AuthProvider';
import { postRepo } from '@/repositories/postRepo';
import { confirmAction, showError, showSuccess } from '@/utils/toast';
import {
  ArrowLeft,
  CheckCircle2,
  Heart,
  Lightbulb,
  MessageCircle,
  MessageSquareText,
  MoreHorizontal,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface PostDetailViewProps {
  post: Post;
  initialComments: Comment[];
  relatedPosts: Post[];
  locale: string;
}

const discussionTips = [
  'Đặt câu hỏi rõ ràng, cụ thể',
  'Chia sẻ thêm bối cảnh nếu có',
  'Tôn trọng và lắng nghe ý kiến khác',
  'Cảm ơn những người đã hỗ trợ',
];

export function PostDetailView({
  post,
  initialComments,
  relatedPosts,
  locale,
}: PostDetailViewProps) {
  const router = useRouter();
  const { user, isAuthenticated, showAuthRequiredModal } = useAuth();
  const [currentPost, setCurrentPost] = useState(post);
  const [commentCount, setCommentCount] = useState(post.commentCount ?? initialComments.length);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [botAnswer, setBotAnswer] = useState<Comment>();
  const { likes, liked, isUpdatingLike, toggleLike } = usePostCard(
    currentPost.id,
    currentPost.likes,
    currentPost.likedByCurrentUser,
  );
  const isOwner = Boolean(user?.id && currentPost.author.id === user.id);
  const roleLabel = isOwner
    ? user?.roles.includes('MENTOR')
      ? 'Mentor'
      : user?.roles.includes('MENTEE')
        ? 'Mentee'
        : undefined
    : undefined;
  const initials = currentPost.author.name
    .split(' ')
    .map((part) => part[0])
    .slice(-2)
    .join('');

  const handleLike = () => {
    if (!isAuthenticated) {
      showAuthRequiredModal('Bạn cần đăng nhập để thích bài viết.');
      return;
    }
    void toggleLike();
  };

  const handleDelete = async () => {
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
      await postRepo.delete(currentPost.id);
      showSuccess('Bài viết đã được xóa.');
      router.push(`/${locale}/dashboard`);
    } catch {
      showError('Không thể xóa bài viết. Vui lòng thử lại.');
    }
  };

  return (
    <main className="mx-auto w-full max-w-[1240px] px-0 pb-24 pt-4 sm:px-1 lg:px-2">
      <Link
        href={`/${locale}/dashboard`}
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Quay lại Bảng tin
      </Link>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-5">
          <article className="overflow-hidden rounded-[20px] border border-solid border-border-light bg-white shadow-[0_4px_16px_rgba(16,50,90,0.05)]">
            <div className="p-5 sm:p-7">
              <header className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  {currentPost.author.avatarUrl ? (
                    <img
                      src={currentPost.author.avatarUrl}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-solid border-primary-border bg-primary-light text-sm font-extrabold text-primary">
                      {initials}
                    </span>
                  )}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="truncate text-sm font-extrabold text-text-main">
                        {currentPost.author.name}
                      </strong>
                      {roleLabel && (
                        <span className="rounded-md bg-primary-light px-2 py-0.5 text-[10px] font-bold text-primary">
                          {roleLabel}
                        </span>
                      )}
                    </div>
                    <time className="mt-1 block text-xs text-text-muted">
                      {currentPost.createdAt}
                    </time>
                  </div>
                </div>
                <div className="relative">
                  <button
                    type="button"
                    aria-label="Tùy chọn bài viết"
                    aria-expanded={isMenuOpen}
                    onClick={() => setIsMenuOpen((value) => !value)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border-none bg-transparent text-text-muted hover:bg-surface-subtle hover:text-text-main"
                  >
                    <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
                  </button>
                  {isMenuOpen && (
                    <div className="absolute right-0 top-10 z-20 min-w-32 rounded-xl border border-solid border-border-light bg-white p-1 shadow-lg">
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
                            onClick={handleDelete}
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

              <h1 className="mb-0 mt-5 text-[26px] font-extrabold leading-[1.25] tracking-tight text-text-main sm:text-[30px]">
                {currentPost.title}
              </h1>
              <p className="mb-0 mt-3 max-w-[780px] whitespace-pre-wrap text-[15px] leading-7 text-text-secondary sm:text-base">
                {currentPost.content}
              </p>

              {currentPost.mediaUrl && (
                <img
                  src={currentPost.mediaUrl}
                  alt=""
                  className="mt-5 max-h-[420px] w-full rounded-xl object-cover"
                />
              )}

              {currentPost.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {currentPost.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-lg border border-solid border-border-light bg-surface-subtle px-2.5 py-1 text-[11px] font-bold text-text-secondary"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-6 border-t border-solid border-border-light px-5 py-3.5 sm:px-7">
              <button
                type="button"
                onClick={handleLike}
                disabled={isUpdatingLike}
                aria-pressed={liked}
                className={`inline-flex items-center gap-1.5 border-none bg-transparent p-0 text-sm font-bold ${liked ? 'text-primary' : 'text-text-secondary hover:text-primary'}`}
              >
                <Heart className="h-5 w-5" fill={liked ? 'currentColor' : 'none'} />
                {likes}
              </button>
              <button
                type="button"
                onClick={() =>
                  document.getElementById('post-comments')?.scrollIntoView({ behavior: 'smooth' })
                }
                className="inline-flex items-center gap-1.5 border-none bg-transparent p-0 text-sm font-bold text-text-secondary hover:text-primary"
              >
                <MessageCircle className="h-5 w-5" aria-hidden="true" />
                {commentCount}
              </button>
            </div>
          </article>

          {botAnswer && <KouKouAnswerCard comment={botAnswer} locale={locale} />}

          <section
            id="post-comments"
            className="scroll-mt-24 overflow-hidden rounded-[20px] border border-solid border-border-light bg-white shadow-[0_4px_16px_rgba(16,50,90,0.04)]"
          >
            <CommentSection
              postId={currentPost.id}
              initialComments={initialComments}
              initialCount={commentCount}
              onCountChange={setCommentCount}
              onBotAnswerChange={setBotAnswer}
              variant="full"
            />
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24" aria-label="Thông tin bổ trợ">
          {relatedPosts.length > 0 && (
            <section className="rounded-[18px] border border-solid border-border-light bg-white p-5 shadow-[0_3px_12px_rgba(16,50,90,0.035)]">
              <h2 className="mb-3 mt-0 text-base font-extrabold text-text-main">
                Bài viết cùng chủ đề
              </h2>
              <div className="divide-y divide-border-light">
                {relatedPosts.map((related) => (
                  <Link
                    key={related.id}
                    href={`/${locale}/post-detail/${related.id}`}
                    className="flex gap-3 py-3 first:pt-1 last:pb-0"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
                      <MessageSquareText className="h-4.5 w-4.5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <strong className="line-clamp-2 text-xs font-extrabold leading-5 text-text-main hover:text-primary">
                        {related.title}
                      </strong>
                      <small className="mt-1 block text-[10px] text-text-muted">
                        {related.commentCount ?? 0} bình luận · {related.createdAt}
                      </small>
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section className="rounded-[18px] border border-solid border-border-light bg-white p-5 shadow-[0_3px_12px_rgba(16,50,90,0.035)]">
            <h2 className="mb-4 mt-0 flex items-center gap-2 text-base font-extrabold text-text-main">
              <Lightbulb className="h-5 w-5 text-primary" aria-hidden="true" />
              Mẹo thảo luận hiệu quả
            </h2>
            <ul className="m-0 space-y-3 p-0">
              {discussionTips.map((tip) => (
                <li
                  key={tip}
                  className="flex items-start gap-2 text-xs leading-5 text-text-secondary"
                >
                  <CheckCircle2
                    className="mt-0.5 h-4 w-4 shrink-0 text-sky-400"
                    aria-hidden="true"
                  />
                  {tip}
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>

      {isEditOpen && (
        <ForumPostEditModal
          open
          post={currentPost}
          onClose={() => setIsEditOpen(false)}
          onUpdated={(updated) => setCurrentPost(postRepo.mapResponse(updated))}
        />
      )}
      {isReportOpen && (
        <ForumReportModal
          open
          targetId={currentPost.id}
          targetType="POST"
          onClose={() => setIsReportOpen(false)}
        />
      )}
    </main>
  );
}
