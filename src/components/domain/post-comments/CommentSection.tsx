/**
 * @file CommentSection.tsx
 * @description Khối thảo luận dùng chung cho feed và trang chi tiết bài viết.
 */

'use client';

import type { Comment } from '@/models/entities';
import { useAuth } from '@/providers/AuthProvider';
import { useEffect } from 'react';
import { CommentComposer } from './CommentComposer';
import { CommentItem } from './CommentItem';
import { usePostComments } from './usePostComments';

interface CommentSectionProps {
  postId: string;
  initialComments?: Comment[];
  initialCount?: number;
  onCountChange?: (count: number) => void;
  autoLoad?: boolean;
  variant?: 'compact' | 'full';
}

export function CommentSection({
  postId,
  initialComments,
  initialCount = 0,
  onCountChange,
  autoLoad = false,
  variant = 'compact',
}: CommentSectionProps) {
  const { user, isAuthenticated, showAuthRequiredModal } = useAuth();
  const commentsState = usePostComments(postId, initialComments, onCountChange);
  const content = commentsState.form.watch('content');
  const contentError = commentsState.form.formState.errors.content?.message;

  useEffect(() => {
    if (autoLoad) void commentsState.loadComments();
  }, [autoLoad, commentsState.loadComments]);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    if (!isAuthenticated) {
      event.preventDefault();
      showAuthRequiredModal('Bạn cần đăng nhập để gửi bình luận.');
      return;
    }
    void commentsState.submitComment(event);
  };

  const count = commentsState.isLoaded ? commentsState.comments.length : initialCount;

  return (
    <section
      className={
        variant === 'full'
          ? 'px-5 pb-5 pt-5 sm:px-6'
          : 'border-t border-solid border-border-light px-4 pb-4 pt-4 sm:px-5'
      }
    >
      <h3
        className={`mb-4 mt-0 font-extrabold text-text-main ${variant === 'full' ? 'text-lg' : 'text-[15px]'}`}
      >
        Bình luận ({count})
      </h3>
      <CommentComposer
        value={content}
        onChange={(value) =>
          commentsState.form.setValue('content', value, { shouldValidate: true })
        }
        onSubmit={submit}
        authorName={user?.fullName}
        avatarUrl={user?.avatarUrl}
        isSubmitting={commentsState.isSubmitting}
        error={contentError || commentsState.serverError}
      />

      {commentsState.isLoading && (
        <div className="mt-4 space-y-3" aria-label="Đang tải bình luận" aria-live="polite">
          {[0, 1].map((item) => (
            <div key={item} className="flex animate-pulse gap-3 py-2">
              <span className="h-9 w-9 rounded-full bg-slate-100" />
              <span className="h-14 flex-1 rounded-xl bg-slate-100" />
            </div>
          ))}
        </div>
      )}

      {commentsState.isLoaded && commentsState.comments.length === 0 && (
        <p className="mb-0 mt-4 text-sm text-text-muted">
          Chưa có bình luận. Hãy bắt đầu cuộc thảo luận.
        </p>
      )}

      {commentsState.comments.length > 0 && (
        <div className="mt-3 divide-y divide-border-light">
          {commentsState.comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              postId={postId}
              onUpdate={commentsState.updateComment}
              onDelete={commentsState.deleteComment}
            />
          ))}
        </div>
      )}
    </section>
  );
}
