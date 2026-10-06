/**
 * @file ForumReportModal.tsx
 * @description Form báo cáo nội dung forum theo các lý do backend hỗ trợ.
 */

'use client';

import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import type { ForumReportCreateRequest } from '@/models/auth';
import { postRepo } from '@/repositories/postRepo';
import { showError, showSuccess } from '@/utils/toast';
import { useState } from 'react';

const reasons: Array<{ value: ForumReportCreateRequest['reasonType']; label: string }> = [
  { value: 'SPAM', label: 'Nội dung rác' },
  { value: 'OFF_TOPIC', label: 'Không đúng chủ đề' },
  { value: 'HARASSMENT', label: 'Quấy rối hoặc công kích' },
  { value: 'MISLEADING', label: 'Thông tin gây hiểu nhầm' },
  { value: 'OTHER', label: 'Lý do khác' },
];

export function ForumReportModal({
  open,
  targetId,
  targetType,
  onClose,
}: {
  open: boolean;
  targetId: string;
  targetType: 'POST' | 'COMMENT';
  onClose: () => void;
}) {
  const [reasonType, setReasonType] = useState<ForumReportCreateRequest['reasonType']>('SPAM');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await postRepo.report({
        targetId,
        targetType,
        reasonType,
        description: description.trim() || undefined,
      });
      showSuccess('Báo cáo của bạn đã được ghi nhận.');
      onClose();
    } catch {
      showError('Không thể gửi báo cáo. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Báo cáo nội dung" className="max-w-md">
      <form className="space-y-4" onSubmit={submit}>
        <label className="block text-xs font-semibold text-text-secondary">
          Lý do
          <select
            value={reasonType}
            onChange={(event) =>
              setReasonType(event.target.value as ForumReportCreateRequest['reasonType'])
            }
            className="mt-2 h-11 w-full rounded-xl border border-solid border-border-light bg-white px-3 text-sm text-text-main outline-none focus:border-primary"
          >
            {reasons.map((reason) => (
              <option key={reason.value} value={reason.value}>
                {reason.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-semibold text-text-secondary">
          Mô tả thêm (tùy chọn)
          <textarea
            value={description}
            maxLength={1000}
            rows={4}
            onChange={(event) => setDescription(event.target.value)}
            className="mt-2 w-full resize-y rounded-xl border border-solid border-border-light p-3 text-sm text-text-main outline-none focus:border-primary"
          />
        </label>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Gửi báo cáo
          </Button>
        </div>
      </form>
    </Modal>
  );
}
