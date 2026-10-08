/**
 * @file useInlineImageUpload.ts
 * @description Uploads images picked, dropped or pasted into the editor and inserts them at the caret.
 * Each file gets its own placeholder line, replaced by the final image block when the upload ends.
 */

'use client';

import { useCallback, useState } from 'react';
import { formatImageBlock } from '@/components/domain/blog/BlogMarkdown';
import { mentorPostRepo } from '@/repositories/mentorPostRepo';
import { showError, showWarning } from '@/utils/toast';
import type { MarkdownEditor } from './useMarkdownEditor';

export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const placeholderFor = (tempId: string) => `![Đang tải ảnh…](uploading:${tempId})`;

function altFromFileName(name: string) {
  return (
    name
      .replace(/\.[^.]+$/, '')
      .replace(/[-_]+/g, ' ')
      .trim() || 'Ảnh minh họa'
  );
}

export function useInlineImageUpload(editor: MarkdownEditor) {
  const [pendingCount, setPendingCount] = useState(0);

  const uploadOne = useCallback(
    async (file: File, placeholder: string) => {
      try {
        const intent = await mentorPostRepo.createUploadIntent({
          filename: file.name,
          contentType: file.type,
        });
        await mentorPostRepo.uploadFile(intent, file);
        const asset = await mentorPostRepo.confirmUpload(intent.uploadIntentId);
        const block = formatImageBlock({
          alt: altFromFileName(file.name),
          url: asset.publicUrl,
          caption: '',
          size: 'vua',
        });
        // The mentor may have deleted the placeholder while uploading; then nothing is inserted.
        editor.replaceText(placeholder, block);
      } catch (reason) {
        editor.replaceText(placeholder, '');
        showError(reason, {
          title: 'Không thể tải ảnh lên',
          description: 'Vui lòng chọn ảnh khác hoặc thử lại.',
        });
      } finally {
        setPendingCount((count) => count - 1);
      }
    },
    [editor],
  );

  /** Validates the files, inserts one placeholder per file at the caret, then uploads in parallel. */
  const uploadFiles = useCallback(
    (fileList: Iterable<File>) => {
      const files = Array.from(fileList).filter((file) => file.type.startsWith('image/'));
      if (!files.length) return;
      const accepted = files.filter((file) => {
        if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
          showWarning('Chỉ hỗ trợ ảnh JPG, PNG, WEBP hoặc GIF.');
          return false;
        }
        if (file.size > MAX_IMAGE_BYTES) {
          showWarning('Ảnh tối đa 5 MB');
          return false;
        }
        return true;
      });
      if (!accepted.length) return;

      const jobs = accepted.map((file) => ({
        file,
        placeholder: placeholderFor(
          `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        ),
      }));
      // One insert for all placeholders: the caret is read once, so they stay in order.
      editor.insertBlock(jobs.map((job) => job.placeholder).join('\n\n'));
      setPendingCount((count) => count + jobs.length);
      jobs.forEach((job) => void uploadOne(job.file, job.placeholder));
    },
    [editor, uploadOne],
  );

  return { uploadFiles, isUploading: pendingCount > 0 };
}
