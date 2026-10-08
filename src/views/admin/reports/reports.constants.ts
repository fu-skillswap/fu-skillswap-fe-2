/**
 * @file reports.constants.ts
 * @description Nhãn và hàm định dạng cho trang báo cáo & nội dung gắn cờ.
 */

import type { AiModerationCategory, AiModerationSeverity, ForumReportStatus } from '@/models/admin';

export type ReportsTab = 'reports' | 'ai' | 'resolved';

const labels: Record<string, string> = {
  OPEN: 'Đang mở',
  RESOLVED_NO_ACTION: 'Không cần tác động',
  RESOLVED_ACTION_TAKEN: 'Đã xử lý',
  DISMISSED: 'Đã bỏ qua',
  POST: 'Bài viết',
  COMMENT: 'Bình luận',
};

export function labelOf(value: string) {
  return labels[value] ?? value.replaceAll('_', ' ').toLocaleLowerCase('vi-VN');
}

/** Results available on the "Đã xử lý" tab. The API filters by one status at a time. */
export const resolvedStatuses: Array<{ value: ForumReportStatus; label: string }> = [
  { value: 'RESOLVED_ACTION_TAKEN', label: 'Đã xử lý' },
  { value: 'RESOLVED_NO_ACTION', label: 'Không cần tác động' },
  { value: 'DISMISSED', label: 'Đã bỏ qua' },
];

export const categoryLabels: Record<AiModerationCategory, string> = {
  toxic: 'Xúc phạm',
  spam: 'Spam',
  political: 'Chính trị',
  hate: 'Thù ghét',
  sexual: 'Nhạy cảm',
};

export const categoryOptions = Object.entries(categoryLabels) as Array<
  [AiModerationCategory, string]
>;

export const severityOptions: Array<{ value: AiModerationSeverity; label: string }> = [
  { value: 3, label: 'Cao' },
  { value: 2, label: 'Trung bình' },
  { value: 1, label: 'Thấp' },
];

export function getSeverity(value: AiModerationSeverity) {
  if (value >= 3) return { label: 'Cao', tone: 'high' as const };
  if (value === 2) return { label: 'Trung bình', tone: 'medium' as const };
  return { label: 'Thấp', tone: 'low' as const };
}

/** "21:48, 07/10/2026" (24h). */
export function formatDateTime(value: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const time = new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
  const day = new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
  return `${time}, ${day}`;
}
