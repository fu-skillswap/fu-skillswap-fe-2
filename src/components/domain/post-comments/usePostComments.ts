/**
 * @file usePostComments.ts
 * @description Quản lý lazy-load, cache tại chỗ và thao tác bình luận của một bài forum.
 */

'use client';

import type { Comment } from '@/models/entities';
import { commentSchema, type CommentFormValues } from '@/models/schemas/postSchema';
import { postRepo } from '@/repositories/postRepo';
import { yupResolver } from '@hookform/resolvers/yup';
import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';

export function usePostComments(
  postId: string,
  initialComments?: Comment[],
  onCountChange?: (count: number) => void,
) {
  const [comments, setComments] = useState<Comment[]>(initialComments ?? []);
  const [isLoaded, setIsLoaded] = useState(initialComments !== undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string>();
  const form = useForm<CommentFormValues>({
    resolver: yupResolver(commentSchema),
    defaultValues: { content: '' },
    mode: 'onChange',
  });

  const loadComments = useCallback(async () => {
    if (isLoaded || isLoading) return;
    setIsLoading(true);
    setServerError(undefined);
    try {
      const items = await postRepo.listComments(postId);
      setComments(items);
      setIsLoaded(true);
      onCountChange?.(items.length);
    } catch {
      setServerError('Không thể tải bình luận. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, isLoading, onCountChange, postId]);

  const submitComment = form.handleSubmit(async ({ content }) => {
    setIsSubmitting(true);
    setServerError(undefined);
    try {
      const comment = await postRepo.addComment(postId, content);
      setComments((current) => {
        const next = [...current, comment];
        onCountChange?.(next.length);
        return next;
      });
      form.reset({ content: '' });
    } catch {
      setServerError('Không thể gửi bình luận. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  });

  const updateComment = async (commentId: string, content: string) => {
    const updated = await postRepo.updateComment(commentId, content);
    setComments((current) => current.map((item) => (item.id === commentId ? updated : item)));
  };

  const deleteComment = async (commentId: string) => {
    await postRepo.deleteComment(commentId);
    setComments((current) => {
      const next = current.filter((item) => item.id !== commentId);
      onCountChange?.(next.length);
      return next;
    });
  };

  return {
    comments,
    form,
    isLoaded,
    isLoading,
    isSubmitting,
    serverError,
    loadComments,
    submitComment,
    updateComment,
    deleteComment,
  };
}
