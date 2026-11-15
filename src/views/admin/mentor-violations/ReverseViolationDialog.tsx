/**
 * @file ReverseViolationDialog.tsx
 * @description Confirmation dialog every "Gỡ vi phạm" action goes through: recap of the violation,
 * a required reason, then POST .../violations/{violationId}/reverse and a refetch.
 */

'use client';

import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ApiClientError } from '@/models/apiClient';
import type { MentorViolationItemResponse } from '@/models/auth';
import { adminRepo } from '@/repositories/adminRepo';
import { getUserFriendlyErrorMessage, showInfo, showSuccess } from '@/utils/toast';
import { useQueryClient } from '@tanstack/react-query';
import { Info, Undo2, X } from 'lucide-react';
import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import {
  ADMIN_MENTORS_QUERY_KEY,
  formatPoints,
  formatViolationDateTime,
  mentorViolationsQueryKey,
  violationState,
} from './mentorViolations.helpers';
import { violationTypeLabel } from './ViolationPills';

const REASON_MAX_LENGTH = 500;
const REASON_MIN_LENGTH = 3;

export interface ReverseViolationDialogProps {
  mentorUserId: string;
  mentorName: string;
  violation: MentorViolationItemResponse;
  /** Current active penalty score of the mentor, for the "hiện hành a → b" recap. */
  activePenaltyScore?: number;
  activeWindowStartAt?: string | null;
  onClose: () => void;
  /** Called after the violation queries were refetched (also when it was already reversed). */
  onReversed?: () => void;
}

export function ReverseViolationDialog({
  mentorUserId,
  mentorName,
  violation,
  activePenaltyScore,
  activeWindowStartAt,
  onClose,
  onReversed,
}: ReverseViolationDialogProps) {
  const queryClient = useQueryClient();
  const titleId = useId();
  const leadId = useId();
  const reasonId = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const submittingRef = useRef(false);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reasonError, setReasonError] = useState<string>();
  const [submitError, setSubmitError] = useState<string>();

  useEffect(() => {
    // After the Modal's own initial focus (first button), so the admin can type right away.
    const timeout = window.setTimeout(() => textareaRef.current?.focus(), 30);
    return () => window.clearTimeout(timeout);
  }, []);

  const points = violation.points ?? 0;
  const isCounting = violationState(violation, activeWindowStartAt) === 'active';
  const showScoreChange = isCounting && activePenaltyScore != null;

  const cancel = () => {
    if (!submittingRef.current) onClose();
  };

  const refetch = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: mentorViolationsQueryKey(mentorUserId) }),
      queryClient.invalidateQueries({ queryKey: ADMIN_MENTORS_QUERY_KEY }),
    ]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (submittingRef.current) return;
    const trimmed = reason.trim();
    if (trimmed.length < REASON_MIN_LENGTH) {
      setReasonError('Nhập lý do gỡ để lưu vào lịch sử.');
      textareaRef.current?.focus();
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);
    setReasonError(undefined);
    setSubmitError(undefined);
    try {
      await adminRepo.reverseMentorViolation(mentorUserId, violation.violationId, trimmed);
      await refetch();
      showSuccess('Đã gỡ vi phạm.');
      onReversed?.();
      onClose();
    } catch (error) {
      if (error instanceof ApiClientError && (error.status === 404 || error.status === 409)) {
        await refetch();
        showInfo('Vi phạm này đã được gỡ trước đó.');
        onReversed?.();
        onClose();
        return;
      }
      setSubmitError(
        getUserFriendlyErrorMessage(error, 'Chưa gỡ được vi phạm. Vui lòng thử lại sau.'),
      );
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open
      hideHeader
      role="alertdialog"
      labelledBy={titleId}
      describedBy={leadId}
      onClose={cancel}
      className="max-w-lg"
    >
      <form noValidate onSubmit={submit} className="space-y-4">
        <div className="flex items-start gap-3">
          <span
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600"
            aria-hidden="true"
          >
            <Undo2 className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="m-0 text-lg font-extrabold text-slate-900">
              Gỡ vi phạm này?
            </h2>
            <p id={leadId} className="m-0 mt-1 text-sm leading-6 text-slate-500">
              Điểm phạt của vi phạm sẽ không còn được tính cho mentor. Thao tác này không thể hoàn
              tác.
            </p>
          </div>
          <button
            type="button"
            aria-label="Đóng"
            disabled={isSubmitting}
            onClick={cancel}
            className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border-none bg-transparent text-slate-400 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-4.5 w-4.5" aria-hidden="true" />
          </button>
        </div>

        <dl className="m-0 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 rounded-xl bg-slate-100 p-4 text-sm">
          <dt className="text-slate-500">Mentor</dt>
          <dd className="m-0 font-semibold text-slate-900">{mentorName}</dd>
          <dt className="text-slate-500">Vi phạm</dt>
          <dd className="m-0 font-semibold text-slate-900">{violationTypeLabel(violation.type)}</dd>
          <dt className="text-slate-500">Thời điểm</dt>
          <dd className="m-0 font-semibold text-slate-900">
            {formatViolationDateTime(violation.occurredAt)}
          </dd>
          <dt className="text-slate-500">Điểm sẽ gỡ</dt>
          <dd className="m-0 font-semibold text-slate-900">
            {formatPoints(points)} điểm
            {showScoreChange && (
              <span className="font-medium text-slate-500">
                {' '}
                (hiện hành {formatPoints(activePenaltyScore)} →{' '}
                {formatPoints(Math.max(0, activePenaltyScore - points))})
              </span>
            )}
          </dd>
        </dl>

        <div>
          <label htmlFor={reasonId} className="mb-1.5 block text-sm font-semibold text-slate-700">
            Lý do gỡ <span className="text-red-600">*</span>
          </label>
          <textarea
            ref={textareaRef}
            id={reasonId}
            rows={3}
            required
            maxLength={REASON_MAX_LENGTH}
            value={reason}
            disabled={isSubmitting}
            aria-invalid={Boolean(reasonError)}
            aria-describedby={`${reasonId}-help`}
            placeholder="Ví dụ: Vi phạm được ghi nhận nhầm, mentor đã có mặt đúng giờ."
            onChange={(event) => {
              setReason(event.target.value);
              if (reasonError) setReasonError(undefined);
            }}
            className={`block min-h-24 w-full resize-y rounded-xl border border-solid bg-white p-3 text-sm text-slate-900 outline-none transition focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-50 ${
              reasonError
                ? 'border-red-600 focus:ring-red-600/15'
                : 'border-slate-200 focus:border-primary focus:ring-primary/15'
            }`}
          />
          <div className="mt-1.5 flex items-start justify-between gap-3 text-xs">
            <div id={`${reasonId}-help`} className="min-w-0">
              {reasonError ? (
                <span role="alert" className="font-semibold text-red-700">
                  {reasonError}
                </span>
              ) : (
                <span className="text-slate-500">Lý do sẽ được lưu vào lịch sử vi phạm.</span>
              )}
            </div>
            <span className="shrink-0 tabular-nums text-slate-500">
              {reason.length}/{REASON_MAX_LENGTH}
            </span>
          </div>
        </div>

        <p className="m-0 flex items-start gap-2 text-xs leading-5 text-slate-500">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          Hạn khóa nhận lịch được hệ thống tính lại sau khi gỡ.
        </p>

        {submitError && (
          <p
            role="alert"
            className="m-0 rounded-xl border border-solid border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700"
          >
            {submitError}
          </p>
        )}

        <div className="flex flex-col-reverse gap-2 border-t border-solid border-slate-200 pt-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" disabled={isSubmitting} onClick={cancel}>
            Hủy
          </Button>
          <Button
            type="submit"
            variant="destructive"
            loading={isSubmitting}
            className="!border-red-600 !bg-red-600 hover:!bg-red-700"
          >
            {isSubmitting ? 'Đang gỡ…' : 'Gỡ vi phạm'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
