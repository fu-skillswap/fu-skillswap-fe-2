/**
 * @file CommentItem.tsx
 * @description Hiển thị bình luận forum, replies và các thao tác được backend cho phép.
 */

'use client';

import type { Comment } from '@/models/entities';
import { ForumReportModal } from '@/components/domain/post-card/ForumReportModal';
import { useAuth } from '@/providers/AuthProvider';
import { postRepo } from '@/repositories/postRepo';
import { confirmAction, showError } from '@/utils/toast';
import { Heart, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { CommentComposer } from './CommentComposer';

interface CommentItemProps {
  comment: Comment;
  postId: string;
  onUpdate?: (commentId: string, content: string) => Promise<void>;
  onDelete?: (commentId: string) => Promise<void>;
  isReply?: boolean;
}

export function CommentItem({
  comment,
  postId,
  onUpdate,
  onDelete,
  isReply = false,
}: CommentItemProps) {
  const { user, isAuthenticated, showAuthRequiredModal } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [replies, setReplies] = useState<Comment[]>([]);
  const [replyCount, setReplyCount] = useState(comment.replyCount ?? 0);
  const [areRepliesLoaded, setAreRepliesLoaded] = useState(false);
  const [isLoadingReplies, setIsLoadingReplies] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLiked, setIsLiked] = useState(comment.reactedByCurrentUser ?? false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reactionCount, setReactionCount] = useState(comment.reactionCount ?? 0);
  const isOwner = Boolean(user?.id && comment.authorId === user.id);
  const initials = comment.authorName
    .split(' ')
    .map((part) => part[0])
    .slice(-2)
    .join('');

  const loadReplies = async () => {
    if (areRepliesLoaded) return;
    setIsLoadingReplies(true);
    try {
      const items = await postRepo.listCommentReplies(comment.id);
      setReplies(items);
      setReplyCount(items.length);
      setAreRepliesLoaded(true);
    } catch {
      showError('Không thể tải câu trả lời. Vui lòng thử lại.');
    } finally {
      setIsLoadingReplies(false);
    }
  };

  const submitReply = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isAuthenticated) {
      showAuthRequiredModal('Bạn cần đăng nhập để trả lời bình luận.');
      return;
    }
    const content = replyContent.trim();
    if (!content) return;
    setIsSaving(true);
    try {
      const reply = await postRepo.addComment(postId, content, comment.id);
      setReplies((current) => [...current, reply]);
      setReplyCount((current) => current + 1);
      setAreRepliesLoaded(true);
      setReplyContent('');
      setIsReplying(false);
    } catch {
      showError('Không thể gửi câu trả lời. Vui lòng thử lại.');
    } finally {
      setIsSaving(false);
    }
  };

  const saveEdit = async () => {
    const content = editContent.trim();
    if (!content || !onUpdate) return;
    setIsSaving(true);
    try {
      await onUpdate(comment.id, content);
      setIsEditing(false);
    } catch {
      showError('Không thể cập nhật bình luận. Vui lòng thử lại.');
    } finally {
      setIsSaving(false);
    }
  };

  const remove = async () => {
    if (!onDelete) return;
    const confirmed = await confirmAction({
      title: 'Bạn chắc chắn muốn xóa bình luận?',
      message: 'Hành động này không thể hoàn tác.',
      confirmText: 'Xóa bình luận',
      variant: 'danger',
      simple: true,
    });
    if (!confirmed) return;
    try {
      await onDelete(comment.id);
    } catch {
      showError('Không thể xóa bình luận. Vui lòng thử lại.');
    }
  };

  const toggleReaction = async () => {
    if (!isAuthenticated) {
      showAuthRequiredModal('Bạn cần đăng nhập để thích bình luận.');
      return;
    }
    const previousLiked = isLiked;
    const previousCount = reactionCount;
    setIsLiked(!previousLiked);
    setReactionCount(Math.max(0, previousCount + (previousLiked ? -1 : 1)));
    try {
      const response = previousLiked
        ? await postRepo.removeCommentReaction(comment.id)
        : await postRepo.reactToComment(comment.id);
      setIsLiked(response.reactedByCurrentUser ?? !previousLiked);
      setReactionCount(response.reactionCount ?? previousCount);
    } catch {
      setIsLiked(previousLiked);
      setReactionCount(previousCount);
    }
  };

  return (
    <div className={isReply ? 'ml-5 border-l border-solid border-border-light pl-3 sm:ml-10' : ''}>
      <article className="flex gap-2.5 py-3">
        {comment.authorAvatarUrl ? (
          <img
            src={comment.authorAvatarUrl}
            alt=""
            className="h-9 w-9 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-light text-[11px] font-extrabold text-primary">
            {initials}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <strong className="font-extrabold text-text-main">{comment.authorName}</strong>
            {comment.authorRole?.toUpperCase() === 'MENTOR' && (
              <span className="rounded-md bg-primary-light px-1.5 py-0.5 text-[10px] font-bold text-primary">
                Mentor
              </span>
            )}
            <span className="text-text-muted">· {comment.createdAt}</span>
          </div>
          {isEditing ? (
            <div className="mt-2">
              <textarea
                value={editContent}
                maxLength={500}
                onChange={(event) => setEditContent(event.target.value)}
                className="min-h-20 w-full resize-y rounded-xl border border-solid border-border-light p-3 text-sm text-text-main outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                aria-label="Chỉnh sửa bình luận"
              />
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={saveEdit}
                  disabled={!editContent.trim() || isSaving}
                  className="rounded-lg border-none bg-primary px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                >
                  Lưu
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="border-none bg-transparent px-2 text-xs font-bold text-text-secondary"
                >
                  Hủy
                </button>
              </div>
            </div>
          ) : (
            <p className="mb-0 mt-1 whitespace-pre-wrap text-sm leading-6 text-text-secondary">
              {comment.content}
            </p>
          )}
          {!isEditing && (
            <div className="mt-1.5 flex items-center gap-3">
              <button
                type="button"
                onClick={toggleReaction}
                className={`inline-flex items-center gap-1 border-none bg-transparent p-0 text-xs font-bold ${isLiked ? 'text-rose-500' : 'text-text-muted hover:text-rose-500'}`}
              >
                <Heart className="h-3.5 w-3.5" fill={isLiked ? 'currentColor' : 'none'} />
                {reactionCount > 0 && reactionCount}
              </button>
              {!isReply && (
                <button
                  type="button"
                  onClick={() => setIsReplying((current) => !current)}
                  className="border-none bg-transparent p-0 text-xs font-bold text-text-muted hover:text-primary"
                >
                  Trả lời
                </button>
              )}
              <div className="relative">
                <button
                  type="button"
                  aria-label="Tùy chọn bình luận"
                  aria-expanded={isMenuOpen}
                  onClick={() => setIsMenuOpen((current) => !current)}
                  className="inline-flex border-none bg-transparent p-0 text-text-muted hover:text-text-main"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
                {isMenuOpen && (
                  <div className="absolute bottom-5 left-0 z-20 min-w-32 rounded-xl border border-solid border-border-light bg-white p-1 shadow-lg">
                    {isOwner ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditing(true);
                            setIsMenuOpen(false);
                          }}
                          className="w-full rounded-lg border-none bg-transparent px-3 py-2 text-left text-xs font-bold text-text-secondary hover:bg-surface-subtle"
                        >
                          Chỉnh sửa
                        </button>
                        <button
                          type="button"
                          onClick={remove}
                          className="w-full rounded-lg border-none bg-transparent px-3 py-2 text-left text-xs font-bold text-danger hover:bg-red-50"
                        >
                          Xóa
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
            </div>
          )}
          {isReplying && (
            <div className="mt-3">
              <CommentComposer
                value={replyContent}
                onChange={setReplyContent}
                onSubmit={submitReply}
                authorName={user?.fullName}
                avatarUrl={user?.avatarUrl}
                placeholder={`Trả lời ${comment.authorName}…`}
                isSubmitting={isSaving}
                compact
              />
            </div>
          )}
        </div>
      </article>
      {!isReply && replyCount > 0 && !areRepliesLoaded && (
        <button
          type="button"
          onClick={loadReplies}
          disabled={isLoadingReplies}
          className="ml-12 border-none bg-transparent p-0 text-xs font-bold text-primary hover:underline disabled:opacity-50"
        >
          {isLoadingReplies ? 'Đang tải…' : `Xem ${replyCount} câu trả lời`}
        </button>
      )}
      {replies.map((reply) => (
        <CommentItem
          key={reply.id}
          comment={reply}
          postId={postId}
          isReply
          onUpdate={async (id, content) => {
            const updated = await postRepo.updateComment(id, content);
            setReplies((current) => current.map((item) => (item.id === id ? updated : item)));
          }}
          onDelete={async (id) => {
            await postRepo.deleteComment(id);
            setReplies((current) => current.filter((item) => item.id !== id));
            setReplyCount((current) => Math.max(0, current - 1));
          }}
        />
      ))}
      {isReportOpen && (
        <ForumReportModal
          open
          targetId={comment.id}
          targetType="COMMENT"
          onClose={() => setIsReportOpen(false)}
        />
      )}
    </div>
  );
}
