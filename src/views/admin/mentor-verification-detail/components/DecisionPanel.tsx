/**
 * @file DecisionPanel.tsx
 * @description Bảng "Quyết định": trạng thái giữ hồ sơ, danh sách rà soát, ghi chú và các thao tác.
 */

'use client';

import type { MentorVerificationLock, MentorVerificationRequestDetail } from '@/models/admin';
import { Check, LockKeyhole } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import styles from '../MentorVerificationDetailView.module.css';
import {
  automaticChecklistLabels,
  formatClock,
  formatRemaining,
  getChecklistProgress,
  manualChecklist,
  type ManualCheckKey,
} from '../mentorVerificationDetail.constants';
import type { LockAction } from '../useMentorVerificationDetail';

type LockBoxProps = {
  lock?: MentorVerificationLock;
  lockReceivedAt: number;
  lockedByAnotherAdmin: boolean;
  isCurrentAdminLockOwner: boolean;
  processingAdmin: string | null;
  lockExpiresAt: string | null;
  isClaiming: boolean;
  canClaim: boolean;
  onClaim: () => void;
  onLockAction: (action: LockAction) => void;
  onLockExpired: () => void;
};

function LockBox({
  lock,
  lockReceivedAt,
  lockedByAnotherAdmin,
  isCurrentAdminLockOwner,
  processingAdmin,
  lockExpiresAt,
  isClaiming,
  canClaim,
  onClaim,
  onLockAction,
  onLockExpired,
}: LockBoxProps) {
  const [now, setNow] = useState(() => Date.now());
  const expiredNotified = useRef(false);

  useEffect(() => {
    if (!isCurrentAdminLockOwner) return;
    setNow(Date.now());
    const interval = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(interval);
  }, [isCurrentAdminLockOwner, lockReceivedAt]);

  const secondsRemaining = lock
    ? Math.max(0, lock.secondsRemaining - (now - lockReceivedAt) / 1000)
    : 0;

  // Re-arm only for a lock with time left, so an already-expired response can't loop reloads.
  useEffect(() => {
    if (lock && lock.secondsRemaining > 0) expiredNotified.current = false;
  }, [lock, lockReceivedAt]);

  useEffect(() => {
    if (isCurrentAdminLockOwner && secondsRemaining <= 0 && !expiredNotified.current) {
      expiredNotified.current = true;
      onLockExpired();
    }
  }, [isCurrentAdminLockOwner, secondsRemaining, onLockExpired]);

  if (isCurrentAdminLockOwner && lock) {
    const lockedAt = lock.lockedAt ? new Date(lock.lockedAt).getTime() : NaN;
    const expiresAt = lock.lockExpiresAt ? new Date(lock.lockExpiresAt).getTime() : NaN;
    const totalSeconds = (expiresAt - lockedAt) / 1000;
    const progress =
      Number.isFinite(totalSeconds) && totalSeconds > 0
        ? Math.min(100, (secondsRemaining / totalSeconds) * 100)
        : 100;

    return (
      <div className={styles.lockBox}>
        <div className={styles.lockBoxHeader}>
          <strong>Bạn đang giữ hồ sơ này</strong>
          <span>còn {formatRemaining(secondsRemaining)}</span>
        </div>
        <div
          className={styles.lockProgress}
          role="progressbar"
          aria-label="Thời gian giữ hồ sơ còn lại"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
        >
          <span style={{ width: `${progress}%` }} />
        </div>
        <p>Người khác không mở được hồ sơ khi bạn đang giữ.</p>
        <div className={styles.lockActions}>
          <button
            type="button"
            className={styles.textButton}
            onClick={() => onLockAction('refresh')}
          >
            Gia hạn
          </button>
          <button
            type="button"
            className={styles.textButton}
            onClick={() => onLockAction('release')}
          >
            Trả hồ sơ
          </button>
        </div>
      </div>
    );
  }

  if (lockedByAnotherAdmin) {
    const until = formatClock(lockExpiresAt);
    return (
      <div className={`${styles.lockBox} ${styles.isWarning}`} role="status">
        <LockKeyhole aria-hidden="true" className={styles.lockIcon} />
        <p>
          Hồ sơ đang được <strong>{processingAdmin ?? 'một quản trị viên khác'}</strong> xử lý
          {until ? ` đến ${until}` : ''}.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.lockBox}>
      <p>Chưa có quản trị viên nào nhận xử lý hồ sơ này.</p>
      <button
        type="button"
        className="admin-button is-primary"
        disabled={!canClaim || isClaiming}
        onClick={onClaim}
      >
        {isClaiming ? 'Đang nhận...' : 'Nhận xử lý'}
      </button>
    </div>
  );
}

type DecisionPanelProps = Omit<LockBoxProps, 'canClaim'> & {
  detail: MentorVerificationRequestDetail;
  canReview: boolean;
  manualChecks: Record<ManualCheckKey, boolean>;
  onToggleCheck: (key: ManualCheckKey) => void;
  /** Document types that have an uploaded file, so the "Mở" shortcut can be shown. */
  availableDocumentTypes: Set<string>;
  onOpenDocumentType: (documentType: string) => void;
  note: string;
  onNoteChange: (note: string) => void;
  onApprove: () => void;
  onRequestRevision: () => void;
  onReject: () => void;
};

export function DecisionPanel({
  detail,
  canReview,
  manualChecks,
  onToggleCheck,
  availableDocumentTypes,
  onOpenDocumentType,
  note,
  onNoteChange,
  onApprove,
  onRequestRevision,
  onReject,
  ...lockProps
}: DecisionPanelProps) {
  const { done, total, manualRemaining } = getChecklistProgress(detail.checklist, manualChecks);

  return (
    <aside className={styles.decisionPanel} aria-labelledby="decision-title">
      <h2 id="decision-title" className="admin-card-title">
        Quyết định
      </h2>
      <LockBox {...lockProps} canClaim={detail.canReview} />

      <section className={styles.checklist} aria-labelledby="checklist-title">
        <header className={styles.checklistHeader}>
          <h3 id="checklist-title">Rà soát</h3>
          <span>
            {done}/{total} đã kiểm
          </span>
        </header>
        <p className={styles.groupLabel}>Hệ thống đã kiểm</p>
        <ul className={styles.autoChecks}>
          {automaticChecklistLabels.map(([key, label]) => (
            <li key={key} className={detail.checklist[key] ? styles.isDone : undefined}>
              <span className={styles.checkMark} aria-hidden="true">
                {detail.checklist[key] && <Check />}
              </span>
              <span>{label}</span>
              <span className="sr-only">{detail.checklist[key] ? 'Đạt' : 'Chưa đạt'}</span>
            </li>
          ))}
        </ul>
        <p className={styles.groupLabel}>Bạn cần kiểm</p>
        {/* TODO(api): persist manual checklist — the backend does not store it yet. */}
        <ul className={styles.manualChecks}>
          {manualChecklist.map((item) => (
            <li key={item.key}>
              <label>
                <input
                  type="checkbox"
                  checked={manualChecks[item.key]}
                  disabled={!canReview}
                  onChange={() => onToggleCheck(item.key)}
                />
                <span>{item.label}</span>
              </label>
              {item.documentType && availableDocumentTypes.has(item.documentType) && (
                <button
                  type="button"
                  className={styles.textButton}
                  onClick={() => onOpenDocumentType(item.documentType!)}
                >
                  Mở
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>

      <label className={styles.noteField}>
        <span>Ghi chú cho ứng viên</span>
        <textarea
          rows={4}
          value={note}
          disabled={!canReview}
          placeholder="Bắt buộc khi từ chối hoặc yêu cầu bổ sung"
          onChange={(event) => onNoteChange(event.target.value)}
        />
      </label>

      <div className={styles.decisionActions}>
        <button
          type="button"
          className="admin-button is-primary"
          disabled={!canReview || manualRemaining > 0}
          aria-describedby={manualRemaining > 0 ? 'approve-hint' : undefined}
          onClick={onApprove}
        >
          Duyệt mentor
        </button>
        {canReview && manualRemaining > 0 && (
          <p id="approve-hint" className={styles.actionHint}>
            Kiểm {manualRemaining} mục còn lại để duyệt
          </p>
        )}
        <div className={styles.secondaryActions}>
          <button
            type="button"
            className="admin-button"
            disabled={!canReview}
            onClick={onRequestRevision}
          >
            Yêu cầu bổ sung
          </button>
          <button
            type="button"
            className={`admin-button ${styles.rejectButton}`}
            disabled={!canReview}
            onClick={onReject}
          >
            Từ chối
          </button>
        </div>
      </div>
    </aside>
  );
}
