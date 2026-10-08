/**
 * @file mentorVerificationDetail.constants.ts
 * @description Nhãn, ánh xạ sự kiện và hàm định dạng dùng cho màn chi tiết xác minh mentor.
 */

import type {
  MentorVerificationDocument,
  MentorVerificationRequestDetail,
  MentorVerificationTimelineItem,
} from '@/models/admin';

export const AFFILIATION_DOCUMENT_TYPE = 'FPTU_AFFILIATION_PROOF';
export const EXPERTISE_DOCUMENT_TYPE = 'EXPERTISE_PROOF';

export const documentTypeLabels: Record<string, string> = {
  [AFFILIATION_DOCUMENT_TYPE]: 'Minh chứng sinh viên FPTU',
  [EXPERTISE_DOCUMENT_TYPE]: 'Minh chứng chuyên môn',
};

export const automaticChecklistLabels: Array<
  [keyof MentorVerificationRequestDetail['checklist'], string]
> = [
  ['academicProfileCompleted', 'Hồ sơ học thuật đã hoàn tất'],
  ['mentorProfileCompleted', 'Hồ sơ mentor đã hoàn tất'],
  ['hasAffiliationProof', 'Đã có minh chứng liên kết với trường'],
  ['hasExpertiseProof', 'Đã có minh chứng chuyên môn'],
  ['canSubmit', 'Đủ điều kiện gửi hồ sơ'],
];

export type ManualCheckKey = 'affiliationMatches' | 'expertiseValid' | 'bioClean';

export const manualChecklist: Array<{
  key: ManualCheckKey;
  label: string;
  /** Document type the "Mở" shortcut previews. */
  documentType?: string;
}> = [
  {
    key: 'affiliationMatches',
    label: 'Minh chứng sinh viên khớp họ tên và MSSV',
    documentType: AFFILIATION_DOCUMENT_TYPE,
  },
  {
    key: 'expertiseValid',
    label: 'Minh chứng chuyên môn hợp lệ, đúng lĩnh vực đăng ký',
    documentType: EXPERTISE_DOCUMENT_TYPE,
  },
  { key: 'bioClean', label: 'Phần giới thiệu không có nội dung vi phạm' },
];

const statusLabels: Record<string, string> = {
  DRAFT: 'Chờ duyệt',
  PENDING: 'Chờ duyệt',
  SUBMITTED: 'Chờ duyệt',
  PENDING_REVIEW: 'Chờ duyệt',
  UNDER_REVIEW: 'Đang xem xét',
  NEEDS_REVISION: 'Cần bổ sung',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  WITHDRAWN: 'Đã rút',
};

export function getStatusLabel(status: string) {
  return statusLabels[status] ?? status.replaceAll('_', ' ');
}

export function getStatusTone(status: string) {
  if (status === 'APPROVED') return 'approved';
  if (status === 'REJECTED') return 'rejected';
  return 'pending';
}

/** Statuses where the request is still waiting for an admin decision. */
export function isAwaitingDecision(status: string) {
  return ['PENDING', 'SUBMITTED', 'PENDING_REVIEW', 'UNDER_REVIEW'].includes(status);
}

export function getDocumentTypeLabel(documentType: string) {
  return documentTypeLabels[documentType] ?? documentType.replaceAll('_', ' ');
}

export function formatDateTime(value: string | null) {
  if (!value) return 'Chưa có';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const time = new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(
    date,
  );
  const day = new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
  return `${time}, ${day}`;
}

export function formatClock(value: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(date);
}

/** "1 ngày 2 giờ", "3 giờ 5 phút", "12 phút". */
export function formatElapsed(fromIso: string, now: number) {
  const minutes = Math.max(0, Math.floor((now - new Date(fromIso).getTime()) / 60000));
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  if (days) return hours ? `${days} ngày ${hours} giờ` : `${days} ngày`;
  if (hours) return minutes % 60 ? `${hours} giờ ${minutes % 60} phút` : `${hours} giờ`;
  return `${Math.max(1, minutes)} phút`;
}

/** H:MM from a number of seconds. */
export function formatRemaining(seconds: number) {
  const totalMinutes = Math.max(0, Math.ceil(seconds / 60));
  return `${Math.floor(totalMinutes / 60)}:${String(totalMinutes % 60).padStart(2, '0')}`;
}

export function formatFileSize(value: number) {
  if (value >= 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(value / 1024))} KB`;
}

export function getFileKind(
  document: Pick<MentorVerificationDocument, 'contentType' | 'originalFilename'>,
) {
  const known: Record<string, string> = {
    'application/pdf': 'PDF',
    'image/png': 'PNG',
    'image/jpeg': 'JPG',
    'image/webp': 'WEBP',
  };
  if (known[document.contentType]) return known[document.contentType];
  const extension = document.originalFilename.split('.').pop();
  return extension && extension !== document.originalFilename ? extension.toUpperCase() : 'Tệp';
}

/** Keeps the start and the end (extension included) of a long string. */
export function truncateMiddle(value: string, head = 16, tail = 10) {
  return value.length <= head + tail + 1 ? value : `${value.slice(0, head)}…${value.slice(-tail)}`;
}

export function describeTimelineEvent(event: MentorVerificationTimelineItem) {
  const actor = event.actorFullName || event.actorEmail || 'Quản trị viên';
  const code = event.eventType.toUpperCase();
  const sentences: Record<string, string> = {
    REQUEST_CREATED: 'Hệ thống tạo yêu cầu xác minh',
    CREATED: 'Hệ thống tạo yêu cầu xác minh',
    SUBMITTED: `${actor} gửi hồ sơ xác minh`,
    RESUBMITTED: `${actor} gửi lại hồ sơ xác minh`,
    LOCKED: `${actor} nhận xử lý hồ sơ`,
    LOCK_ACQUIRED: `${actor} nhận xử lý hồ sơ`,
    ASSIGNED: `${actor} nhận xử lý hồ sơ`,
    LOCK_RELEASED: `${actor} trả hồ sơ`,
    UNLOCKED: `${actor} trả hồ sơ`,
    REVISION_REQUESTED: `${actor} yêu cầu bổ sung`,
    APPROVED: `${actor} duyệt hồ sơ`,
    REJECTED: `${actor} từ chối hồ sơ`,
    WITHDRAWN: `${actor} rút hồ sơ`,
  };
  return sentences[code] ?? 'Cập nhật hồ sơ';
}

export const OTHER_REASON = 'Khác';

export const rejectReasons = [
  'Minh chứng sinh viên không hợp lệ',
  'Thông tin không khớp minh chứng',
  'Chưa đủ điều kiện làm mentor',
  'Nội dung vi phạm quy định',
  OTHER_REASON,
];

export const revisionReasons = [
  'Minh chứng sinh viên chưa rõ hoặc thiếu',
  'Minh chứng chuyên môn chưa đủ',
  'Thông tin không khớp minh chứng',
  'Phần giới thiệu cần chỉnh sửa',
  OTHER_REASON,
];

/** Note sent to the API: "<reason>: <message>", or just the message for "Khác". */
export function composeDecisionNote(reason: string, message: string) {
  const trimmed = message.trim();
  return reason === OTHER_REASON ? trimmed : `${reason}: ${trimmed}`;
}

export function getChecklistProgress(
  checklist: MentorVerificationRequestDetail['checklist'],
  manualChecks: Record<ManualCheckKey, boolean>,
) {
  const automaticDone = automaticChecklistLabels.filter(([key]) => checklist[key]).length;
  const manualDone = manualChecklist.filter((item) => manualChecks[item.key]).length;
  return {
    done: automaticDone + manualDone,
    total: automaticChecklistLabels.length + manualChecklist.length,
    manualRemaining: manualChecklist.length - manualDone,
  };
}

/** "1 giờ 42 phút", "42 phút". */
export function formatDuration(seconds: number) {
  const totalMinutes = Math.max(0, Math.ceil(seconds / 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (!hours) return `${minutes} phút`;
  return minutes ? `${hours} giờ ${minutes} phút` : `${hours} giờ`;
}

/** "23:26 hôm nay", "00:26 ngày mai", "23:26, 12/10/2026". */
export function formatExpiry(value: string | Date) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const clock = new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
  const dayDiff = Math.round(
    (new Date(date).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86400000,
  );
  if (dayDiff === 0) return `${clock} hôm nay`;
  if (dayDiff === 1) return `${clock} ngày mai`;
  return formatDateTime(date.toISOString());
}
