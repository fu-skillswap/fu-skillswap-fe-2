/**
 * @file reportModeration.constants.ts
 * @description Nhãn, màu và hàm định dạng dùng chung cho danh sách và chi tiết báo cáo cộng đồng.
 * Không bao giờ hiển thị mã enum thô cho người dùng.
 */

import type { AdminForumReport, ForumReportStatus } from '@/models/admin';

export const FORUM_REPORT_CASE_TYPE = 'FORUM_REPORT';

/* ------------------------------------------------------------------ */
/* Resolve actions                                                     */
/* ------------------------------------------------------------------ */

/**
 * `action` values for POST /api/admin/forum/reports/{reportId}/resolve.
 * TODO(api): confirm values with BE — Swagger only types `action` as a required string.
 */
export const REPORT_ACTIONS = {
  HIDE: 'HIDE_TARGET',
  KEEP: 'NO_ACTION',
  DISMISS: 'DISMISS',
} as const;

export type ReportDecision = keyof typeof REPORT_ACTIONS;

/** Status (and target status) the report should end up in after each choice. */
export const DECISION_RESULT: Record<
  ReportDecision,
  { status: ForumReportStatus; targetStatus?: 'HIDDEN' }
> = {
  HIDE: { status: 'RESOLVED_ACTION_TAKEN', targetStatus: 'HIDDEN' },
  KEEP: { status: 'RESOLVED_NO_ACTION' },
  DISMISS: { status: 'DISMISSED' },
};

export const REVIEW_NOTE_MAX = 500;
export const HIDE_NOTE_MIN = 3;

/* ------------------------------------------------------------------ */
/* Tones                                                               */
/* ------------------------------------------------------------------ */

export type PillTone = {
  color: string;
  background: string;
  border: string;
};

const TONES = {
  orange: { color: '#9a3412', background: '#fff7ed', border: '#fed7aa' },
  violet: { color: '#6d28d9', background: '#f5f3ff', border: '#ddd6fe' },
  red: { color: '#b91c1c', background: '#fef2f2', border: '#fecaca' },
  amber: { color: '#854d0e', background: '#fefce8', border: '#fde68a' },
  green: { color: '#047857', background: '#ecfdf5', border: '#a7f3d0' },
  grey: { color: '#475569', background: '#f1f5f9', border: '#e2e8f0' },
} satisfies Record<string, PillTone>;

export type LabelTone = { label: string; tone: PillTone };

/* ------------------------------------------------------------------ */
/* Reason                                                              */
/* ------------------------------------------------------------------ */

export const REASON_UI: Record<string, LabelTone> = {
  SPAM: { label: 'Spam', tone: TONES.orange },
  OFF_TOPIC: { label: 'Lạc đề', tone: TONES.violet },
  HARASSMENT: { label: 'Quấy rối', tone: TONES.red },
  MISLEADING: { label: 'Gây hiểu lầm', tone: TONES.amber },
  OTHER: { label: 'Khác', tone: TONES.grey },
};

export function getReasonUi(reasonType: string | null | undefined): LabelTone {
  return (reasonType && REASON_UI[reasonType]) || REASON_UI.OTHER;
}

/* ------------------------------------------------------------------ */
/* Report status                                                       */
/* ------------------------------------------------------------------ */

export const STATUS_UI: Record<ForumReportStatus, LabelTone> = {
  OPEN: { label: 'Đang mở', tone: TONES.amber },
  RESOLVED_ACTION_TAKEN: { label: 'Đã ẩn nội dung', tone: TONES.red },
  RESOLVED_NO_ACTION: { label: 'Giữ nội dung', tone: TONES.green },
  DISMISSED: { label: 'Đã bỏ qua', tone: TONES.grey },
};

export function getStatusUi(status: string): LabelTone {
  return STATUS_UI[status as ForumReportStatus] ?? { label: 'Không rõ', tone: TONES.grey };
}

/** Header chip on the detail page: only "open" vs "closed". */
export function getHeaderStatusUi(status: string): LabelTone {
  return status === 'OPEN'
    ? { label: 'Đang mở', tone: TONES.amber }
    : { label: 'Đã xử lý', tone: TONES.green };
}

/** Options of the "Kết quả" filter on the "Đã xử lý" tab (the API filters one status at a time). */
export const RESOLVED_FILTER_OPTIONS: Array<{ value: ForumReportStatus; label: string }> = [
  { value: 'RESOLVED_ACTION_TAKEN', label: STATUS_UI.RESOLVED_ACTION_TAKEN.label },
  { value: 'RESOLVED_NO_ACTION', label: STATUS_UI.RESOLVED_NO_ACTION.label },
  { value: 'DISMISSED', label: STATUS_UI.DISMISSED.label },
];

/* ------------------------------------------------------------------ */
/* Target (reported post / comment)                                    */
/* ------------------------------------------------------------------ */

export type TargetType = 'POST' | 'COMMENT';

export const TARGET_TYPE_LABEL: Record<TargetType, string> = {
  POST: 'Bài viết',
  COMMENT: 'Bình luận',
};

export const TARGET_TYPE_FILTER_OPTIONS: Array<{ value: '' | TargetType; label: string }> = [
  { value: '', label: 'Tất cả' },
  { value: 'POST', label: TARGET_TYPE_LABEL.POST },
  { value: 'COMMENT', label: TARGET_TYPE_LABEL.COMMENT },
];

export function getTargetType(value: string): TargetType {
  return value === 'COMMENT' ? 'COMMENT' : 'POST';
}

/** Lower-case noun for sentences: "bài viết" / "bình luận". */
export function targetNoun(value: string) {
  return TARGET_TYPE_LABEL[getTargetType(value)].toLocaleLowerCase('vi-VN');
}

export type TargetState = 'visible' | 'hidden' | 'deleted' | 'unknown';

// TODO(api): confirm the targetStatus values with BE (especially the one for author-deleted content).
const VISIBLE_STATUSES = new Set(['VISIBLE', 'ACTIVE', 'PUBLISHED']);
const HIDDEN_STATUSES = new Set(['HIDDEN']);
const DELETED_STATUSES = new Set(['DELETED', 'REMOVED']);

export function getTargetState(targetStatus: string | null | undefined): TargetState {
  const value = targetStatus?.toUpperCase();
  if (!value) return 'unknown';
  if (VISIBLE_STATUSES.has(value)) return 'visible';
  if (HIDDEN_STATUSES.has(value)) return 'hidden';
  if (DELETED_STATUSES.has(value)) return 'deleted';
  return 'unknown';
}

/** Pill for the target's state; unknown values keep the raw text in a neutral pill. */
export function getTargetStatusUi(targetStatus: string | null | undefined): LabelTone | null {
  const state = getTargetState(targetStatus);
  if (state === 'visible') return { label: 'Đang hiển thị', tone: TONES.green };
  if (state === 'hidden') return { label: 'Đã ẩn khỏi Forum', tone: TONES.red };
  if (state === 'deleted') return { label: 'Tác giả đã xóa', tone: TONES.grey };
  return targetStatus ? { label: targetStatus, tone: TONES.grey } : null;
}

export const NEUTRAL_TONE = TONES.grey;

export function getTargetTitle(report: Pick<AdminForumReport, 'targetType' | 'targetTitle'>) {
  const title = report.targetTitle?.trim();
  if (title) return { text: title, fallback: false };
  return {
    text:
      getTargetType(report.targetType) === 'COMMENT' ? 'Bình luận' : 'Bài viết không có tiêu đề',
    fallback: true,
  };
}

export function getTargetPreview(
  report: Pick<AdminForumReport, 'targetContentPreview' | 'targetStatus'>,
) {
  const preview = report.targetContentPreview?.trim();
  if (preview) return { text: preview, fallback: false };
  return {
    text:
      getTargetState(report.targetStatus) === 'deleted'
        ? 'Nội dung không còn trên Forum.'
        : 'Không tải được nội dung xem trước.',
    fallback: true,
  };
}

export function personName(name: string | null | undefined) {
  return name?.trim() || 'Không rõ';
}

/**
 * Public forum URL of the reported content, or null when it can't be built.
 * TODO(api): comments only carry their own id; add the parent postId to the report so the link can
 * open `/post-detail/{postId}#comment-{commentId}`.
 */
export function getForumHref(
  locale: string,
  report: Pick<AdminForumReport, 'targetType' | 'targetId'>,
) {
  if (getTargetType(report.targetType) !== 'POST' || !report.targetId) return null;
  return `/${locale}/post-detail/${encodeURIComponent(report.targetId)}`;
}

/* ------------------------------------------------------------------ */
/* Dates                                                               */
/* ------------------------------------------------------------------ */

const pad = (value: number) => String(value).padStart(2, '0');

/** "HH:mm dd/MM/yyyy" in the viewer's time zone; "—" when missing. */
export function formatReportTime(value: string | null | undefined) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${pad(date.getHours())}:${pad(date.getMinutes())} ${pad(date.getDate())}/${pad(
    date.getMonth() + 1,
  )}/${date.getFullYear()}`;
}

export const LONG_WAIT_HOURS = 48;

/** "40 phút" / "5 giờ" / "3 ngày" between `from` and `to` (default now). */
export function getWait(from: string | null | undefined, to?: string | null) {
  const start = from ? new Date(from).getTime() : Number.NaN;
  const end = to ? new Date(to).getTime() : Date.now();
  if (Number.isNaN(start) || Number.isNaN(end)) return { text: '—', long: false };
  const minutes = Math.max(0, Math.floor((end - start) / 60000));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const text =
    minutes < 60 ? `${Math.max(1, minutes)} phút` : hours < 24 ? `${hours} giờ` : `${days} ngày`;
  return { text, long: hours >= LONG_WAIT_HOURS };
}

/* ------------------------------------------------------------------ */
/* Misc                                                                */
/* ------------------------------------------------------------------ */

/** "01a203b9…dcca83c138c5" — first 8 and last 12 characters. */
export function shortenId(id: string) {
  return id.length > 24 ? `${id.slice(0, 8)}…${id.slice(-12)}` : id;
}

export function getInitial(name: string | null | undefined) {
  return name?.trim().charAt(0).toUpperCase() || '?';
}
