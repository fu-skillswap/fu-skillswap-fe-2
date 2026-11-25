/**
 * @file ReportListCells.tsx
 * @description Các ô của bảng báo cáo cộng đồng: nội dung, lý do, người xử lý, thời gian chờ.
 */

import type { AdminCaseOwnership, AdminForumReport } from '@/models/admin';
import { Clock } from 'lucide-react';
import styles from '../ReportModeration.module.css';
import {
  formatReportTime,
  getInitial,
  getTargetPreview,
  getTargetState,
  getTargetTitle,
  getWait,
  NEUTRAL_TONE,
  personName,
} from '../reportModeration.constants';
import { ReasonPill, TargetTypeChip, TonePill } from './ReportPills';

export function ReportContentCell({ report }: { report: AdminForumReport }) {
  const title = getTargetTitle(report);
  const preview = getTargetPreview(report);
  const deleted = getTargetState(report.targetStatus) === 'deleted';
  return (
    <div className={styles.contentCell}>
      <div className={styles.chips}>
        <TargetTypeChip targetType={report.targetType} />
        {deleted && <TonePill ui={{ label: 'Tác giả đã xóa', tone: NEUTRAL_TONE }} />}
      </div>
      <strong className={title.fallback ? styles.fallbackText : undefined} title={title.text}>
        {title.text}
      </strong>
      <p className={preview.fallback ? styles.fallbackText : undefined} title={preview.text}>
        {preview.text}
      </p>
      <span className={styles.metaLine}>Tác giả: {personName(report.targetAuthorFullName)}</span>
    </div>
  );
}

export function ReasonCell({ report }: { report: AdminForumReport }) {
  return (
    <div className={styles.stackCell}>
      <ReasonPill reasonType={report.reasonType} />
      {report.description?.trim() && <span className={styles.metaLine}>Có mô tả thêm</span>}
    </div>
  );
}

export type OwnershipEntry = AdminCaseOwnership | 'loading' | 'error';

export function OwnerCell({
  entry,
  currentUserId,
}: {
  entry: OwnershipEntry | undefined;
  currentUserId: string | undefined;
}) {
  if (!entry || entry === 'loading') {
    return (
      <span className={styles.ownerSkeleton} aria-label="Đang tải người xử lý">
        <span className="admin-skeleton is-circle" />
        <span className="admin-skeleton" />
      </span>
    );
  }
  if (entry === 'error') return <span className={styles.metaLine}>Không tải được</span>;
  if (!entry.assigned) return <span className={styles.metaLine}>Chưa ai nhận</span>;
  const mine = Boolean(currentUserId) && entry.assignedAdminUserId === currentUserId;
  const name = personName(entry.assignedAdminDisplayName);
  return (
    <span className={styles.owner}>
      <span className={`${styles.ownerAvatar} ${mine ? styles.isMine : ''}`} aria-hidden="true">
        {getInitial(mine ? 'Bạn' : name)}
      </span>
      {mine ? <b>Bạn</b> : <span title={name}>{name}</span>}
    </span>
  );
}

/** Relative wait (≥48h highlighted with a clock) above the exact time. */
export function WaitCell({ from, to }: { from: string; to?: string | null }) {
  const wait = getWait(from, to);
  return (
    <div className={styles.stackCell}>
      <span className={`${styles.wait} ${wait.long ? styles.isLong : ''}`}>
        {wait.long && <Clock aria-hidden="true" />}
        {wait.text}
      </span>
      <span className={styles.metaLine}>{formatReportTime(from)}</span>
    </div>
  );
}
