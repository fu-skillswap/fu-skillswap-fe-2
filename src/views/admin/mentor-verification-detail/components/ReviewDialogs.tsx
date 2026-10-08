/**
 * @file ReviewDialogs.tsx
 * @description Hộp thoại xác nhận duyệt / yêu cầu bổ sung / từ chối và gia hạn / trả hồ sơ.
 */

'use client';

import { AdminDialog } from '@/components/domain/admin/AdminDialog';
import {
  rejectMentorVerificationSchema,
  requestMentorRevisionSchema,
  type RejectMentorVerificationForm,
  type RequestMentorRevisionForm,
} from '@/models/schemas/mentorVerificationSchema';
import { getUserFriendlyErrorMessage } from '@/utils/toast';
import { yupResolver } from '@hookform/resolvers/yup';
import { Check, MessageSquareWarning, RefreshCw, ShieldCheck, Unlock, XCircle } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { LockAction } from '../useMentorVerificationDetail';

export type ReviewDialog = 'approve' | 'revision' | 'reject' | LockAction;

type ReviewDialogsProps = {
  dialog: ReviewDialog;
  mentorFullName: string;
  /** Note typed in the decision panel, used to prefill revision / rejection reasons. */
  initialNote: string;
  onClose: () => void;
  onApprove: () => Promise<void>;
  onRequestRevision: (note: string) => Promise<void>;
  onReject: (note: string) => Promise<void>;
  onLockAction: (action: LockAction) => Promise<void>;
};

const fallbackError = 'Không thể cập nhật hồ sơ mentor.';

export function ReviewDialogs({ dialog, ...props }: ReviewDialogsProps) {
  if (dialog === 'revision') return <RevisionDialog {...props} />;
  if (dialog === 'reject') return <RejectDialog {...props} />;
  if (dialog === 'approve') return <ApproveDialog {...props} />;
  return <LockActionDialog action={dialog} {...props} />;
}

type DialogProps = Omit<ReviewDialogsProps, 'dialog'>;

function useSubmitting() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const run = async (task: () => Promise<void>, onDone: () => void, fallback = fallbackError) => {
    setBusy(true);
    setError(undefined);
    try {
      await task();
      onDone();
    } catch (reason) {
      setError(getUserFriendlyErrorMessage(reason, fallback));
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, run };
}

function RevisionDialog({ initialNote, onClose, onRequestRevision }: DialogProps) {
  const { busy, error, run } = useSubmitting();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RequestMentorRevisionForm>({
    resolver: yupResolver(requestMentorRevisionSchema),
    defaultValues: { note: initialNote },
  });

  return (
    <AdminDialog
      titleId="mentor-revision-title"
      tone="warning"
      icon={<MessageSquareWarning aria-hidden="true" />}
      title="Yêu cầu bổ sung hồ sơ"
      description="Gửi lý do cụ thể để mentor cập nhật hồ sơ."
      busy={busy}
      onClose={onClose}
      onSubmit={handleSubmit(({ note }) => run(() => onRequestRevision(note), onClose))}
      footer={
        <>
          <button type="button" className="admin-button" onClick={onClose} disabled={busy}>
            Hủy
          </button>
          <button className="admin-button is-warning" type="submit" disabled={busy}>
            {busy ? 'Đang gửi...' : 'Gửi yêu cầu bổ sung'}
          </button>
        </>
      }
    >
      <label className="admin-dialog-field" htmlFor="revision-note">
        Lý do yêu cầu bổ sung
        <textarea
          id="revision-note"
          rows={6}
          placeholder="Ví dụ: Vui lòng bổ sung minh chứng chuyên môn và cập nhật phần giới thiệu..."
          aria-invalid={Boolean(errors.note)}
          {...register('note')}
          disabled={busy}
          autoFocus
        />
      </label>
      {errors.note && <p className="mentor-form-error">{errors.note.message}</p>}
      {error && <p className="mentor-form-error">{error}</p>}
    </AdminDialog>
  );
}

function RejectDialog({ initialNote, onClose, onReject }: DialogProps) {
  const { busy, error, run } = useSubmitting();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RejectMentorVerificationForm>({
    resolver: yupResolver(rejectMentorVerificationSchema),
    defaultValues: { note: initialNote },
  });

  return (
    <AdminDialog
      titleId="mentor-reject-title"
      tone="danger"
      icon={<XCircle aria-hidden="true" />}
      title="Từ chối hồ sơ mentor"
      description="Gửi lý do cụ thể để mentor biết nội dung cần cải thiện."
      busy={busy}
      onClose={onClose}
      onSubmit={handleSubmit(({ note }) => run(() => onReject(note), onClose))}
      footer={
        <>
          <button type="button" className="admin-button" disabled={busy} onClick={onClose}>
            Hủy
          </button>
          <button className="admin-button is-danger-solid" type="submit" disabled={busy}>
            {busy ? 'Đang từ chối...' : 'Xác nhận từ chối'}
          </button>
        </>
      }
    >
      <label className="admin-dialog-field" htmlFor="mentor-reject-note">
        Lý do từ chối
        <textarea
          id="mentor-reject-note"
          rows={6}
          placeholder="Ví dụ: Hồ sơ chưa có đủ minh chứng chuyên môn..."
          aria-invalid={Boolean(errors.note)}
          disabled={busy}
          autoFocus
          {...register('note')}
        />
      </label>
      {errors.note && <p className="mentor-form-error">{errors.note.message}</p>}
      {error && <p className="mentor-form-error">{error}</p>}
    </AdminDialog>
  );
}

function ApproveDialog({ mentorFullName, onClose, onApprove }: DialogProps) {
  const { busy, error, run } = useSubmitting();

  return (
    <AdminDialog
      titleId="mentor-approve-title"
      tone="success"
      icon={<ShieldCheck aria-hidden="true" />}
      title="Xác nhận duyệt mentor"
      description={
        <>
          Bạn có chắc muốn duyệt hồ sơ của <strong>{mentorFullName}</strong>? Thao tác này sẽ gửi
          kết quả duyệt đến mentor.
        </>
      }
      busy={busy}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="admin-button" onClick={onClose} disabled={busy}>
            Hủy
          </button>
          <button
            className="admin-button is-success"
            type="button"
            onClick={() => void run(onApprove, onClose)}
            disabled={busy}
          >
            <Check aria-hidden="true" />
            {busy ? 'Đang duyệt...' : 'Xác nhận duyệt'}
          </button>
        </>
      }
    >
      {error && <p className="mentor-form-error">{error}</p>}
    </AdminDialog>
  );
}

function LockActionDialog({ action, onClose, onLockAction }: DialogProps & { action: LockAction }) {
  const { busy, error, run } = useSubmitting();
  const isRefresh = action === 'refresh';

  return (
    <AdminDialog
      titleId="mentor-lock-action-title"
      tone={isRefresh ? 'info' : 'danger'}
      icon={isRefresh ? <RefreshCw aria-hidden="true" /> : <Unlock aria-hidden="true" />}
      title={isRefresh ? 'Gia hạn giữ hồ sơ' : 'Trả hồ sơ'}
      description={
        isRefresh
          ? 'Bạn có muốn gia hạn thêm thời gian xử lý hồ sơ này không?'
          : 'Bạn có chắc muốn trả hồ sơ này để quản trị viên khác có thể xử lý?'
      }
      busy={busy}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="admin-button" disabled={busy} onClick={onClose}>
            Hủy
          </button>
          <button
            type="button"
            className={`admin-button ${isRefresh ? 'is-primary' : 'is-danger-solid'}`}
            disabled={busy}
            onClick={() =>
              void run(
                () => onLockAction(action),
                onClose,
                'Không thể cập nhật thời gian giữ hồ sơ.',
              )
            }
          >
            {busy ? 'Đang xác nhận...' : isRefresh ? 'Xác nhận gia hạn' : 'Xác nhận trả hồ sơ'}
          </button>
        </>
      }
    >
      {error && <p className="mentor-form-error">{error}</p>}
    </AdminDialog>
  );
}
