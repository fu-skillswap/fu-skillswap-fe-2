/**
 * @file useMentorPosts.ts
 * @description Điều phối danh sách, biểu mẫu và vòng đời bài viết Blog của Mentor.
 */

'use client';

import { yupResolver } from '@hookform/resolvers/yup';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { ApiClientError } from '@/models/apiClient';
import type { MentorBlogPostDetailResponse, MentorBlogPostCreateRequest } from '@/models/auth';
import { mentorPostSchema, type MentorPostFormValues } from '@/models/schemas/mentorPostSchema';
import { useAuth } from '@/providers/AuthProvider';
import { mentorPostRepo } from '@/repositories/mentorPostRepo';
import { showError, showSuccess } from '@/utils/toast';

const EMPTY_FORM: MentorPostFormValues = {
  title: '',
  excerpt: '',
  contentMarkdown: '',
  visibility: 'PUBLIC',
};

export function useMentorPosts() {
  const { isBootstrapping } = useAuth();
  const [posts, setPosts] = useState<MentorBlogPostDetailResponse[]>([]);
  const [editingPost, setEditingPost] = useState<MentorBlogPostDetailResponse | null>();
  const [archiveTarget, setArchiveTarget] = useState<MentorBlogPostDetailResponse>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>();

  const form = useForm<MentorPostFormValues>({
    resolver: yupResolver(mentorPostSchema),
    defaultValues: EMPTY_FORM,
  });

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(undefined);
    try {
      setPosts(await mentorPostRepo.list());
    } catch (reason) {
      setPosts([]);
      setError(
        reason instanceof ApiClientError
          ? reason.message
          : 'Không thể tải bài viết. Vui lòng thử lại.',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isBootstrapping) void refresh();
  }, [isBootstrapping, refresh]);

  const visiblePosts = useMemo(
    () =>
      posts
        .filter((post) => post.status !== 'ARCHIVED')
        .sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt)),
    [posts],
  );

  const counts = useMemo(
    () => ({
      published: visiblePosts.filter((post) => post.status === 'PUBLISHED').length,
      draft: visiblePosts.filter((post) => post.status === 'DRAFT').length,
    }),
    [visiblePosts],
  );

  const openCreate = useCallback(() => {
    form.reset(EMPTY_FORM);
    setEditingPost(null);
  }, [form]);

  const openEdit = useCallback(
    async (post: MentorBlogPostDetailResponse) => {
      setIsSaving(true);
      try {
        const detail = await mentorPostRepo.detail(post.id);
        form.reset({
          title: detail.title,
          excerpt: detail.excerpt ?? '',
          contentMarkdown: detail.contentMarkdown ?? '',
          visibility: detail.visibility,
        });
        setEditingPost(detail);
      } catch (reason) {
        showError(
          reason instanceof Error ? reason.message : 'Không thể tải bài viết để chỉnh sửa.',
        );
      } finally {
        setIsSaving(false);
      }
    },
    [form],
  );

  const closeEditor = () => {
    if (!isSaving) setEditingPost(undefined);
  };

  const save = async (values: MentorPostFormValues, shouldPublish: boolean) => {
    setIsSaving(true);
    try {
      const payload: MentorBlogPostCreateRequest = {
        title: values.title.trim(),
        excerpt: values.excerpt?.trim() || undefined,
        contentMarkdown: values.contentMarkdown?.trim() || undefined,
        visibility: values.visibility,
      };
      const saved = editingPost
        ? await mentorPostRepo.update(editingPost.id, {
            ...payload,
            expectedVersion: editingPost.version,
          })
        : await mentorPostRepo.create(payload);
      setEditingPost(saved);
      if (shouldPublish) {
        await mentorPostRepo.publish(saved.id, { expectedVersion: saved.version });
      }
      showSuccess(shouldPublish ? 'Đã đăng bài viết.' : 'Đã lưu bản nháp.');
      setEditingPost(undefined);
      await refresh();
    } catch (reason) {
      showError(reason instanceof Error ? reason.message : 'Không thể lưu bài viết.');
    } finally {
      setIsSaving(false);
    }
  };

  const submitDraft = form.handleSubmit((values) => save(values, false));
  const submitPublish = form.handleSubmit((values) => save(values, true));

  const archive = async () => {
    if (!archiveTarget) return;
    setIsSaving(true);
    try {
      await mentorPostRepo.archive(archiveTarget.id, { expectedVersion: archiveTarget.version });
      showSuccess('Đã chuyển bài viết vào lưu trữ.');
      setArchiveTarget(undefined);
      await refresh();
    } catch (reason) {
      showError(reason instanceof Error ? reason.message : 'Không thể lưu trữ bài viết.');
    } finally {
      setIsSaving(false);
    }
  };

  return {
    archive,
    archiveTarget,
    closeEditor,
    counts,
    editingPost,
    error,
    form,
    isEditorOpen: editingPost !== undefined,
    isLoading: isLoading || isBootstrapping,
    isSaving,
    openCreate,
    openEdit,
    posts: visiblePosts,
    refresh,
    setArchiveTarget,
    submitDraft,
    submitPublish,
  };
}
