/**
 * @file DecisionCard.tsx
 * @description Thẻ "Quyết định" của chi tiết báo cáo: nhận xử lý, chọn cách xử lý (ẩn / giữ / bỏ qua)
 * kèm ghi chú, xác nhận ẩn nội dung, kết quả xử lý và khôi phục nội dung.
 */

'use client';

import { AdminDialog } from '@/components/domain/admin/AdminDialog';
import { CircleCheck, EyeOff, Info, LoaderCircle, Lock, RotateCcw, UserMinus } from 'lucide-react';
import Link from 'next/link';
import { useId, useRef, useState, type FormEvent } from 'react';
import styles from '../AdminReportDetailView.module.css';
import {
  HIDE_NOTE_MIN,
  REVIEW_NOTE_MAX,
  formatReportTime,
  getStatusUi,
  getTargetState,
  getTargetTitle,
  personName,
  targetNoun,
  TARGET_TYPE_LABEL,
  getTargetType,
  type ReportDecision,
} from '../../reports/reportModeration.constants';
import type { AdminReportDetailState } from '../useAdminReportDetail';

const SUBMIT_LABEL: Record<ReportDecision, string> = {
  HIDE: 'Ẩn nội dung & đóng báo cáo',
  KEEP: 'Giữ nội dung & đóng báo cáo',
  DISMISS: 'Bỏ qua báo cáo',
};

function Spinner() {
  return <LoaderCircle aria-hidden="true" className={styles.spinner} />;
}

export function DecisionCard({ state, locale }: { state: AdminReportDetailState; locale: string }) {
  const { report, ownership } = state;
  if (!report) return null;

  let body;
  if (report.status !== 'OPEN') body = <ResolvedState state={state} locale={locale} />;
  else if (!ownership?.assigned) body = <UnassignedState state={state} />;
  else if (state.isMine) body = <DecisionForm state={state} />;
  else body = <HeldByOtherState state={state} />;

  return (
    <section className={`${styles.card} ${styles.decisionCard}`} aria-labelledby="report-decision">
      <h2 id="report-decision" className={styles.cardTitle}>
        {report.status === 'OPEN' ? 'Quyết định' : 'Kết quả xử lý'}
      </h2>
      {body}
    </section>
  );
}

function UnassignedState({ state }: { state: AdminReportDetailState }) {
  const pending = state.busy === 'assign';
  return (
    <>
      <p className={styles.cardText}>
        Chưa có ai nhận báo cáo này. Nhận xử lý để chọn cách xử lý. Admin khác sẽ thấy bạn đang giữ
        báo cáo.
      </p>
      <button
        type="button"
        className={`admin-button is-primary ${styles.fullButton}`}
        disabled={Boolean(state.busy)}
        onClick={() => void state.assign()}
      >
        {pending ? (
          <>
            <Spinner /> Đang nhận…
          </>
        ) : (
          'Nhận xử lý'
        )}
      </button>
    </>
  );
}

function HeldByOtherState({ state }: { state: AdminReportDetailState }) {
  const [confirming, setConfirming] = useState(false);
  const name = personName(state.ownership?.assignedAdminDisplayName);
  const pending = state.busy === 'unassign';
  return (
    <>
      <div className={`${styles.banner} ${styles.isViolet}`}>
        <Lock aria-hidden="true" />
        <p>
          <b>{name}</b> đang xử lý báo cáo này từ {formatReportTime(state.ownership?.assignedAt)}.
          Chỉ người đang xử lý mới chọn được cách xử lý.
        </p>
      </div>
      <p className={styles.mutedText}>
        Cần hỗ trợ? Nhắn {name}, hoặc nhờ quản trị hệ thống gỡ người xử lý.
      </p>
      {state.isSystemAdmin && (
        <button
          type="button"
          className={`admin-button ${styles.fullButton}`}
          disabled={Boolean(state.busy)}
          onClick={() => setConfirming(true)}
        >
          <UserMinus aria-hidden="true" /> Gỡ người xử lý
        </button>
      )}
      {confirming && (
        <AdminDialog
          alert
          titleId="report-force-unassign-title"
          tone="warning"
          icon={<UserMinus aria-hidden="true" />}
          title="Gỡ người xử lý?"
          description={`${name} sẽ không còn giữ báo cáo này. Admin khác có thể nhận xử lý.`}
          busy={pending}
          onClose={() => setConfirming(false)}
          footer={
            <>
              <button
                type="button"
                className="admin-button"
                disabled={pending}
                onClick={() => setConfirming(false)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="admin-button is-primary"
                disabled={pending}
                onClick={async () => {
                  await state.unassign(true);
                  setConfirming(false);
                }}
              >
                {pending ? (
                  <>
                    <Spinner /> Đang gỡ…
                  </>
                ) : (
                  'Gỡ người xử lý'
                )}
              </button>
            </>
          }
        />
      )}
    </>
  );
}

function DecisionForm({ state }: { state: AdminReportDetailState }) {
  const report = state.report!;
  const fieldId = useId();
  const [choice, setChoice] = useState<ReportDecision | null>(null);
  const [note, setNote] = useState('');
  const [choiceError, setChoiceError] = useState<string>();
  const [noteError, setNoteError] = useState<string>();
  const [confirmingHide, setConfirmingHide] = useState(false);
  const firstRadioRef = useRef<HTMLInputElement>(null);
  const noteRef = useRef<HTMLTextAreaElement>(null);

  const type = getTargetType(report.targetType);
  const typeLabel = TARGET_TYPE_LABEL[type];
  const targetDeleted = getTargetState(report.targetStatus) === 'deleted';
  const noteRequired = choice === 'HIDE';
  const submitting = state.busy === 'resolve';
  const title = getTargetTitle(report);

  const options: Array<{
    value: ReportDecision;
    label: string;
    description: string;
    disabled?: boolean;
  }> = [
    {
      value: 'HIDE',
      label: 'Ẩn nội dung',
      description: targetDeleted
        ? 'Không cần: tác giả đã xóa nội dung này.'
        : `${typeLabel} bị ẩn khỏi Forum. Có thể khôi phục sau.`,
      disabled: targetDeleted,
    },
    {
      value: 'KEEP',
      label: 'Giữ nội dung',
      description: 'Không vi phạm. Đóng báo cáo, nội dung vẫn hiển thị.',
    },
    {
      value: 'DISMISS',
      label: 'Bỏ qua báo cáo',
      description: 'Báo cáo trùng, gửi nhầm hoặc không đủ thông tin.',
    },
  ];

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    if (!choice) {
      setChoiceError('Chọn một cách xử lý trước.');
      firstRadioRef.current?.focus();
      return;
    }
    if (choice === 'HIDE' && note.trim().length < HIDE_NOTE_MIN) {
      setNoteError('Ghi lý do ẩn nội dung để admin khác hiểu quyết định này.');
      noteRef.current?.focus();
      return;
    }
    if (choice === 'HIDE') {
      setConfirmingHide(true);
      return;
    }
    void state.resolve(choice, note);
  };

  return (
    <>
      <div className={`${styles.banner} ${styles.isInfo}`}>
        <Info aria-hidden="true" />
        <p>
          Bạn đang xử lý báo cáo này từ {formatReportTime(state.ownership?.assignedAt)}.{' '}
          <button
            type="button"
            className={styles.linkButton}
            disabled={Boolean(state.busy)}
            onClick={() => void state.unassign()}
          >
            {state.busy === 'unassign' ? 'Đang nhả…' : 'Nhả xử lý'}
          </button>
        </p>
      </div>

      <form className={styles.decisionForm} onSubmit={submit} noValidate>
        <fieldset
          className={styles.choices}
          aria-describedby={choiceError ? `${fieldId}-choice-error` : undefined}
        >
          <legend>Cách xử lý</legend>
          {options.map((option, index) => {
            const selected = choice === option.value;
            return (
              <label
                key={option.value}
                className={`${styles.choice} ${option.value === 'HIDE' ? styles.isDanger : ''} ${
                  selected ? styles.isSelected : ''
                } ${option.disabled ? styles.isDisabled : ''}`}
              >
                <input
                  ref={index === 0 ? firstRadioRef : undefined}
                  type="radio"
                  name={`${fieldId}-decision`}
                  value={option.value}
                  checked={selected}
                  disabled={option.disabled || submitting}
                  onChange={() => {
                    setChoice(option.value);
                    setChoiceError(undefined);
                    setNoteError(undefined);
                  }}
                />
                <span className={styles.choiceText}>
                  <span className={styles.choiceTitle}>
                    {option.value === 'HIDE' && <EyeOff aria-hidden="true" />}
                    {option.label}
                  </span>
                  <span className={styles.choiceDescription}>{option.description}</span>
                </span>
              </label>
            );
          })}
          {choiceError && (
            <p id={`${fieldId}-choice-error`} role="alert" className={styles.fieldError}>
              {choiceError}
            </p>
          )}
        </fieldset>

        <div className={styles.noteField}>
          <label htmlFor={`${fieldId}-note`}>
            Ghi chú xử lý{' '}
            {noteRequired ? (
              <span className={styles.required} aria-label="bắt buộc">
                *
              </span>
            ) : (
              <span className={styles.optional}>(không bắt buộc)</span>
            )}
          </label>
          <textarea
            ref={noteRef}
            id={`${fieldId}-note`}
            value={note}
            maxLength={REVIEW_NOTE_MAX}
            rows={4}
            disabled={submitting}
            aria-invalid={Boolean(noteError)}
            aria-required={noteRequired}
            aria-describedby={`${fieldId}-note-help${noteError ? ` ${fieldId}-note-error` : ''}`}
            onChange={(event) => {
              setNote(event.target.value);
              if (noteError) setNoteError(undefined);
            }}
          />
          <div className={styles.noteMeta}>
            <span id={`${fieldId}-note-help`}>Lưu vào hoạt động xử lý.</span>
            <span aria-live="polite">
              {note.length}/{REVIEW_NOTE_MAX}
            </span>
          </div>
          {noteError && (
            <p id={`${fieldId}-note-error`} role="alert" className={styles.fieldError}>
              {noteError}
            </p>
          )}
        </div>

        <button
          type="submit"
          className={`admin-button ${choice === 'HIDE' ? styles.dangerSolid : 'is-primary'} ${
            styles.submitButton
          }`}
          aria-disabled={submitting || undefined}
        >
          {submitting ? (
            <>
              <Spinner /> Đang xử lý…
            </>
          ) : choice ? (
            SUBMIT_LABEL[choice]
          ) : (
            'Chọn cách xử lý'
          )}
        </button>
      </form>

      {confirmingHide && (
        <AdminDialog
          alert
          titleId="report-hide-title"
          tone="danger"
          icon={<EyeOff aria-hidden="true" />}
          title={`Ẩn ${targetNoun(report.targetType)} này?`}
          description="Người dùng sẽ không còn thấy nội dung trên Forum và báo cáo được đóng. Bạn có thể khôi phục sau trong mục Đã xử lý."
          busy={submitting}
          onClose={() => setConfirmingHide(false)}
          footer={
            <>
              <button
                type="button"
                className="admin-button"
                disabled={submitting}
                onClick={() => setConfirmingHide(false)}
              >
                Hủy
              </button>
              <button
                type="button"
                className={`admin-button ${styles.dangerSolid}`}
                disabled={submitting}
                onClick={async () => {
                  await state.resolve('HIDE', note);
                  setConfirmingHide(false);
                }}
              >
                {submitting ? (
                  <>
                    <Spinner /> Đang xử lý…
                  </>
                ) : (
                  'Ẩn nội dung'
                )}
              </button>
            </>
          }
        >
          <div className={styles.recap}>
            <strong className={title.fallback ? styles.fallbackText : undefined}>
              {title.text}
            </strong>
            <span>Tác giả: {personName(report.targetAuthorFullName)}</span>
          </div>
        </AdminDialog>
      )}
    </>
  );
}

function ResolvedState({ state, locale }: { state: AdminReportDetailState; locale: string }) {
  const report = state.report!;
  const [confirmingRestore, setConfirmingRestore] = useState(false);
  const restoring = state.busy === 'restore';
  const listHref = `/${locale}/admin/reports`;

  const reviewedByMe =
    Boolean(state.currentUserId) && report.reviewedByUserId === state.currentUserId;
  // TODO(api): add reviewedByDisplayName to the report; the activity actor is used meanwhile.
  const reviewerName = reviewedByMe
    ? 'Bạn'
    : (state.activity.find(
        (item) => item.actorUserId && item.actorUserId === report.reviewedByUserId,
      )?.actorDisplayName ?? 'Quản trị viên');
  const hidden = getTargetState(report.targetStatus) === 'hidden';
  const typeLabel = TARGET_TYPE_LABEL[getTargetType(report.targetType)];

  return (
    <>
      <div className={`${styles.banner} ${styles.isSuccess}`}>
        <CircleCheck aria-hidden="true" />
        <p>
          <b>{getStatusUi(report.status).label}</b>
          <br />
          {reviewerName} đóng báo cáo lúc {formatReportTime(report.resolvedAt)}.
        </p>
      </div>
      <div className={styles.noteBlock}>
        <h3>Ghi chú xử lý</h3>
        {report.reviewNote?.trim() ? (
          <p className={styles.preLine}>{report.reviewNote}</p>
        ) : (
          <p className={styles.mutedText}>Không có ghi chú.</p>
        )}
      </div>
      {hidden && (
        <button
          type="button"
          className={`admin-button ${styles.fullButton}`}
          disabled={Boolean(state.busy)}
          onClick={() => setConfirmingRestore(true)}
        >
          <RotateCcw aria-hidden="true" /> Khôi phục nội dung
        </button>
      )}
      {state.justResolved && (
        <div className={styles.nextActions}>
          {state.nextReportId === undefined ? (
            <span className={styles.mutedText} role="status">
              <Spinner /> Đang tìm báo cáo tiếp theo…
            </span>
          ) : (
            state.nextReportId && (
              <Link
                className={`admin-button is-primary ${styles.fullButton}`}
                href={`/${locale}/admin/reports/${state.nextReportId}`}
              >
                Báo cáo tiếp theo
              </Link>
            )
          )}
          <Link className={`admin-button ${styles.fullButton}`} href={listHref}>
            Về danh sách
          </Link>
        </div>
      )}
      {confirmingRestore && (
        <AdminDialog
          alert
          titleId="report-restore-title"
          tone="info"
          icon={<RotateCcw aria-hidden="true" />}
          title="Khôi phục nội dung?"
          description={`${typeLabel} sẽ hiển thị lại trên Forum. Kết quả báo cáo vẫn được giữ trong lịch sử.`}
          busy={restoring}
          onClose={() => setConfirmingRestore(false)}
          footer={
            <>
              <button
                type="button"
                className="admin-button"
                disabled={restoring}
                onClick={() => setConfirmingRestore(false)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="admin-button is-primary"
                disabled={restoring}
                onClick={async () => {
                  await state.restore();
                  setConfirmingRestore(false);
                }}
              >
                {restoring ? (
                  <>
                    <Spinner /> Đang khôi phục…
                  </>
                ) : (
                  'Khôi phục'
                )}
              </button>
            </>
          }
        />
      )}
    </>
  );
}
