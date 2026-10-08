/**
 * @file ReviewDialogs.tsx
 * @description Hộp thoại xác nhận duyệt / yêu cầu bổ sung / từ chối và gia hạn / trả hồ sơ.
 */

'use client';

import { AdminDialog, type AdminDialogTone } from '@/components/domain/admin/AdminDialog';
import type { MentorVerificationLock } from '@/models/admin';
import {
  MENTOR_DECISION_MESSAGE_MAX,
  mentorDecisionSchema,
  type MentorDecisionForm,
} from '@/models/schemas/mentorVerificationSchema';
import { getUserFriendlyErrorMessage, showSuccess } from '@/utils/toast';
import { yupResolver } from '@hookform/resolvers/yup';
import { FilePenLine, LoaderCircle, ShieldCheck, Timer, Unlock, XCircle } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import {
  composeDecisionNote,
  formatDuration,
  formatExpiry,
  rejectReasons,
  revisionReasons,
} from '../mentorVerificationDetail.constants';
import type { LockAction } from '../useMentorVerificationDetail';

export type ReviewDialog = 'approve' | 'revision' | 'reject' | LockAction;

type ReviewDialogsProps = {
  dialog: ReviewDialog;
  mentorFullName: string;
  /** Note typed in the decision panel, used to prefill the message to the applicant. */
  initialNote: string;
  checklistDone: number;
  checklistTotal: number;
  lock?: MentorVerificationLock;
  lockReceivedAt: number;
  onClose: () => void;
  onApprove: () => Promise<void>;
  onRequestRevision: (note: string) => Promise<void>;
  onReject: (note: string) => Promise<void>;
  onLockAction: (action: LockAction) => Promise<MentorVerificationLock>;
};

type DialogProps = Omit<ReviewDialogsProps, 'dialog'>;

export function ReviewDialogs({ dialog, ...props }: ReviewDialogsProps) {
  if (dialog === 'approve') return <ApproveDialog {...props} />;
  if (dialog === 'reject')
    return (
      <DecisionFormDialog
        {...props}
        titleId="mentor-reject-title"
        tone="danger"
        icon={<XCircle aria-hidden="true" />}
        title={`Từ chối hồ sơ của ${props.mentorFullName}`}
        description="Ứng viên sẽ thấy lý do và có thể nộp lại sau khi sửa."
        reasons={rejectReasons}
        submitLabel="Từ chối hồ sơ"
        busyLabel="Đang từ chối..."
        submitClassName="is-danger-solid"
        successMessage={`Đã từ chối hồ sơ của ${props.mentorFullName}`}
        onConfirm={props.onReject}
      />
    );
  if (dialog === 'revision')
    return (
      <DecisionFormDialog
        {...props}
        titleId="mentor-revision-title"
        tone="info"
        icon={<FilePenLine aria-hidden="true" />}
        title={`Yêu cầu ${props.mentorFullName} bổ sung hồ sơ`}
        description="Ứng viên sẽ thấy lời nhắn và cập nhật hồ sơ rồi gửi lại."
        reasons={revisionReasons}
        submitLabel="Gửi yêu cầu bổ sung"
        busyLabel="Đang gửi..."
        submitClassName="is-primary"
        successMessage={`Đã gửi yêu cầu bổ sung cho ${props.mentorFullName}`}
        onConfirm={props.onRequestRevision}
      />
    );
  return <LockActionDialog action={dialog} {...props} />;
}

function useSubmitting() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  /** Runs `task`; resolves to false (and shows the error) when it throws. */
  const run = async (task: () => Promise<void>, fallback = 'Không thể cập nhật hồ sơ mentor.') => {
    setBusy(true);
    setError(undefined);
    try {
      await task();
      return true;
    } catch (reason) {
      setError(getUserFriendlyErrorMessage(reason, fallback));
      return false;
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, run };
}

function BusyLabel({
  busy,
  label,
  busyLabel,
}: {
  busy: boolean;
  label: string;
  busyLabel: string;
}) {
  return busy ? (
    <>
      <LoaderCircle aria-hidden="true" className="is-spinning" /> {busyLabel}
    </>
  ) : (
    <>{label}</>
  );
}

function ApproveDialog({
  mentorFullName,
  checklistDone,
  checklistTotal,
  onClose,
  onApprove,
}: DialogProps) {
  const { busy, error, run } = useSubmitting();

  const confirm = async () => {
    if (await run(onApprove)) {
      showSuccess(`Đã duyệt ${mentorFullName} làm mentor`);
    }
  };

  return (
    <AdminDialog
      titleId="mentor-approve-title"
      tone="success"
      icon={<ShieldCheck aria-hidden="true" />}
      title={`Duyệt ${mentorFullName} làm mentor?`}
      description={
        checklistDone === checklistTotal
          ? `Bạn đã kiểm đủ ${checklistDone}/${checklistTotal} mục rà soát.`
          : `Đã kiểm ${checklistDone}/${checklistTotal} mục rà soát.`
      }
      busy={busy}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="admin-button" onClick={onClose} disabled={busy}>
            Hủy
          </button>
          <button
            className="admin-button is-primary"
            type="button"
            onClick={() => void confirm()}
            disabled={busy}
            aria-busy={busy}
          >
            <BusyLabel busy={busy} label="Duyệt mentor" busyLabel="Đang duyệt..." />
          </button>
        </>
      }
    >
      <p className="admin-dialog-text">Sau khi duyệt:</p>
      <ul className="admin-dialog-list">
        <li>Ứng viên nhận email và thông báo đã trở thành mentor</li>
        <li>Hồ sơ xuất hiện trong trang Tìm mentor</li>
        <li>Ứng viên có thể tạo dịch vụ và mở lịch ngay</li>
      </ul>
      {error && (
        <p className="mentor-form-error" role="alert">
          {error}
        </p>
      )}
    </AdminDialog>
  );
}

type DecisionFormDialogProps = DialogProps & {
  titleId: string;
  tone: AdminDialogTone;
  icon: ReactNode;
  title: string;
  description: string;
  reasons: string[];
  submitLabel: string;
  busyLabel: string;
  submitClassName: string;
  successMessage: string;
  onConfirm: (note: string) => Promise<void>;
};

function DecisionFormDialog({
  titleId,
  tone,
  icon,
  title,
  description,
  reasons,
  submitLabel,
  busyLabel,
  submitClassName,
  successMessage,
  initialNote,
  onClose,
  onConfirm,
}: DecisionFormDialogProps) {
  const { busy, error, run } = useSubmitting();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<MentorDecisionForm>({
    resolver: yupResolver(mentorDecisionSchema),
    defaultValues: { reason: reasons[0], message: initialNote },
  });
  const messageLength = watch('message')?.length ?? 0;

  const submit = handleSubmit(async ({ reason, message }) => {
    if (await run(() => onConfirm(composeDecisionNote(reason, message)))) {
      showSuccess(successMessage);
      onClose();
    }
  });

  return (
    <AdminDialog
      titleId={titleId}
      tone={tone}
      icon={icon}
      title={title}
      description={description}
      busy={busy}
      onClose={onClose}
      onSubmit={submit}
      footer={
        <>
          <button type="button" className="admin-button" disabled={busy} onClick={onClose}>
            Hủy
          </button>
          <button
            className={`admin-button ${submitClassName}`}
            type="submit"
            disabled={busy}
            aria-busy={busy}
          >
            <BusyLabel busy={busy} label={submitLabel} busyLabel={busyLabel} />
          </button>
        </>
      }
    >
      <div className="admin-dialog-fields">
        <label className="admin-dialog-field" htmlFor={`${titleId}-reason`}>
          Lý do chính
          <select id={`${titleId}-reason`} disabled={busy} {...register('reason')}>
            {reasons.map((reason) => (
              <option key={reason} value={reason}>
                {reason}
              </option>
            ))}
          </select>
        </label>
        <div className="admin-dialog-field">
          <label htmlFor={`${titleId}-message`}>Lời nhắn cho ứng viên</label>
          <textarea
            id={`${titleId}-message`}
            rows={4}
            maxLength={MENTOR_DECISION_MESSAGE_MAX}
            placeholder="Nêu rõ điều ứng viên cần sửa để nộp lại."
            aria-invalid={Boolean(errors.message)}
            aria-describedby={`${titleId}-message-meta`}
            disabled={busy}
            autoFocus
            {...register('message')}
          />
          <div id={`${titleId}-message-meta`} className="admin-dialog-field-meta">
            <span className="mentor-form-error" role={errors.message ? 'alert' : undefined}>
              {errors.message?.message}
            </span>
            <span>
              {messageLength}/{MENTOR_DECISION_MESSAGE_MAX}
            </span>
          </div>
        </div>
      </div>
      {error && (
        <p className="mentor-form-error" role="alert">
          {error}
        </p>
      )}
    </AdminDialog>
  );
}

function LockActionDialog({
  action,
  lock,
  lockReceivedAt,
  onClose,
  onLockAction,
}: DialogProps & { action: LockAction }) {
  const { busy, error, run } = useSubmitting();
  const isRefresh = action === 'refresh';
  const [secondsRemaining] = useState(() =>
    lock ? Math.max(0, lock.secondsRemaining - (Date.now() - lockReceivedAt) / 1000) : 0,
  );
  const currentExpiry = lock?.lockExpiresAt ? formatExpiry(lock.lockExpiresAt) : '';

  const confirm = async () => {
    let updated: MentorVerificationLock | undefined;
    const ok = await run(async () => {
      updated = await onLockAction(action);
    }, 'Không thể cập nhật thời gian giữ hồ sơ.');
    if (!ok) return;
    if (isRefresh) {
      const newExpiry = updated?.lockExpiresAt ? formatExpiry(updated.lockExpiresAt) : '';
      showSuccess(newExpiry ? `Đã gia hạn giữ hồ sơ đến ${newExpiry}` : 'Đã gia hạn giữ hồ sơ');
    } else {
      showSuccess('Đã trả hồ sơ');
    }
    onClose();
  };

  return (
    <AdminDialog
      titleId="mentor-lock-action-title"
      tone={isRefresh ? 'info' : 'danger'}
      icon={isRefresh ? <Timer aria-hidden="true" /> : <Unlock aria-hidden="true" />}
      title={isRefresh ? 'Gia hạn giữ hồ sơ' : 'Trả hồ sơ'}
      description={
        isRefresh
          ? `Hiện còn ${formatDuration(secondsRemaining)}${
              currentExpiry ? `, hết lúc ${currentExpiry}` : ''
            }.`
          : 'Quản trị viên khác sẽ có thể nhận xử lý hồ sơ này.'
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
            aria-busy={busy}
            onClick={() => void confirm()}
          >
            <BusyLabel
              busy={busy}
              label={isRefresh ? 'Gia hạn' : 'Trả hồ sơ'}
              busyLabel="Đang xác nhận..."
            />
          </button>
        </>
      }
    >
      {isRefresh && (
        // TODO(api): custom duration (15/30/60 phút) once the refresh endpoint accepts one.
        <p className="admin-dialog-text">Gia hạn thêm theo thời lượng mặc định của hệ thống.</p>
      )}
      {error && (
        <p className="mentor-form-error" role="alert">
          {error}
        </p>
      )}
    </AdminDialog>
  );
}
