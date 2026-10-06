/**
 * @file ForumPostEditModal.tsx
 * @description Modal chỉnh sửa bài forum của chính người dùng bằng contract hiện có.
 */

'use client';

import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { TextArea } from '@/components/ui/TextArea';
import { TextField } from '@/components/ui/TextField';
import type { ForumPostResponse, ForumTopicResponse } from '@/models/auth';
import type { Post } from '@/models/entities';
import { postRepo } from '@/repositories/postRepo';
import { showError, showSuccess } from '@/utils/toast';
import { useEffect, useState } from 'react';

export function ForumPostEditModal({
  open,
  post,
  onClose,
  onUpdated,
}: {
  open: boolean;
  post: Post;
  onClose: () => void;
  onUpdated: (post: ForumPostResponse) => void;
}) {
  const [topics, setTopics] = useState<ForumTopicResponse[]>([]);
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content);
  const [topicId, setTopicId] = useState(post.topicId ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(post.title);
    setContent(post.content);
    setTopicId(post.topicId ?? '');
    void postRepo
      .listTopics()
      .then(setTopics)
      .catch(() => showError('Không thể tải danh sách chủ đề. Vui lòng thử lại.'));
  }, [open, post]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || !content.trim() || !topicId) return;
    setIsSubmitting(true);
    try {
      const updated = await postRepo.update(post.id, {
        title: title.trim(),
        content: content.trim(),
        forumTopicId: topicId,
        imageUrls: post.imageUrls,
      });
      onUpdated(updated);
      showSuccess('Bài viết đã được cập nhật.');
      onClose();
    } catch {
      showError('Không thể cập nhật bài viết. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Chỉnh sửa bài viết" className="max-w-[620px]">
      <form className="space-y-4" onSubmit={submit}>
        <TextField
          label="Tiêu đề"
          required
          value={title}
          maxLength={200}
          onChange={(event) => setTitle(event.target.value)}
        />
        <TextArea
          label="Nội dung"
          required
          rows={8}
          value={content}
          maxLength={5000}
          onChange={(event) => setContent(event.target.value)}
        />
        <label className="block text-xs font-semibold text-text-secondary">
          Chủ đề <span className="text-danger">*</span>
          <select
            value={topicId}
            onChange={(event) => setTopicId(event.target.value)}
            className="mt-2 h-11 w-full rounded-xl border border-solid border-border-light bg-white px-3 text-sm text-text-main outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
          >
            <option value="">Chọn chủ đề</option>
            {topics.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.nameVi}
              </option>
            ))}
          </select>
        </label>
        <div className="flex justify-end gap-3 border-t border-solid border-border-light pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button
            type="submit"
            loading={isSubmitting}
            disabled={!title.trim() || !content.trim() || !topicId}
          >
            Lưu thay đổi
          </Button>
        </div>
      </form>
    </Modal>
  );
}
