'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { SelectField } from '@/components/ui/SelectField';
import type { BookingIssueType, MentorBookingResponse } from '@/models/auth';
import type { MenteeBookingMutation } from '../useMyBookings';

export type NoteActionType = 'confirm' | 'reportIssue' | 'respondIssue';

/** Note-based booking actions (confirm / report issue / respond issue). Cancel has its own modal. */
export function ActionModal({
  action,
  isSaving,
  onClose,
  onSubmit,
}: {
  action?: { type: NoteActionType; booking: MentorBookingResponse };
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (mutation: MenteeBookingMutation) => void;
}) {
  const [note, setNote] = useState('');
  const [issueType, setIssueType] = useState<BookingIssueType>('OTHER');
  useEffect(() => {
    setNote('');
    setIssueType('OTHER');
  }, [action]);
  if (!action) return null;
  const titles = {
    confirm: 'Xác nhận hoàn tất',
    reportIssue: 'Báo vấn đề',
    respondIssue: 'Phản hồi vấn đề',
  };
  const submit = () => {
    const value = note.trim();
    if (action.type !== 'confirm' && !value) return;
    if (action.type === 'confirm')
      onSubmit({ type: 'confirm', data: { confirmationNote: value || undefined } });
    if (action.type === 'reportIssue')
      onSubmit({ type: 'reportIssue', data: { issueType, description: value, evidenceIds: [] } });
    if (action.type === 'respondIssue') onSubmit({ type: 'respondIssue', responseNote: value });
  };
  return (
    <Modal open title={titles[action.type]} onClose={onClose}>
      <div className="grid gap-4">
        {action.type === 'reportIssue' && (
          <SelectField
            label="Loại vấn đề"
            required
            value={issueType}
            onValueChange={(val) => setIssueType(val as BookingIssueType)}
            options={[
              { value: 'MENTOR_NO_SHOW', label: 'Mentor không tham gia' },
              { value: 'QUALITY_ISSUE', label: 'Chất lượng buổi học' },
              { value: 'TECHNICAL_PROBLEM', label: 'Sự cố kỹ thuật' },
              { value: 'OTHER', label: 'Vấn đề khác' },
            ]}
          />
        )}
        <label className="grid gap-2 text-sm font-semibold text-text-main">
          <span>Ghi chú {action.type !== 'confirm' && <b>*</b>}</span>
          <textarea
            className="min-h-28 resize-y rounded-xl border border-border-color p-3 font-normal outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            value={note}
            maxLength={2000}
            onChange={(event) => setNote(event.target.value)}
          />
        </label>
      </div>
      <footer className="mt-6 flex flex-wrap justify-end gap-2 border-t border-border-light pt-4">
        <Button variant="outline" onClick={onClose}>
          Đóng
        </Button>
        <Button onClick={submit} disabled={isSaving || (action.type !== 'confirm' && !note.trim())}>
          {isSaving ? 'Đang xử lý...' : 'Xác nhận'}
        </Button>
      </footer>
    </Modal>
  );
}
