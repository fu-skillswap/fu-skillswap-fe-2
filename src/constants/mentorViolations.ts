/**
 * @file mentorViolations.ts
 * @description Vietnamese labels for the mentor violation enums of the backend.
 */

export const MENTOR_VIOLATION_TYPE_LABELS: Record<string, string> = {
  LATE_CANCELLATION: 'Hủy lịch sát giờ',
  COMPLETION_OVERDUE: 'Quá hạn xác nhận hoàn thành buổi học',
  MENTOR_NO_SHOW: 'Vắng mặt trong buổi học',
  BOOKING_POLICY_BREACH: 'Vi phạm quy chế đặt lịch',
  CHAT_POLICY_BREACH: 'Vi phạm quy định trò chuyện',
  FORUM_POLICY_BREACH: 'Vi phạm quy định diễn đàn',
  VERIFICATION_FRAUD: 'Gian lận hồ sơ xác minh',
  ADMIN_CONFIRMED_BREACH: 'Vi phạm do quản trị viên xác nhận',
};

export const MENTOR_VIOLATION_SEVERITY_LABELS: Record<string, string> = {
  LOW: 'Nhẹ',
  MEDIUM: 'Trung bình',
  HIGH: 'Nặng',
  CRITICAL: 'Nghiêm trọng',
};

export const MENTOR_VIOLATION_SOURCE_LABELS: Record<string, string> = {
  BOOKING: 'Lịch đặt',
  CHAT: 'Trò chuyện',
  FORUM: 'Diễn đàn',
  VERIFICATION: 'Xác minh hồ sơ',
  ADMIN: 'Quản trị viên',
};

export function toSelectOptions(labels: Record<string, string>) {
  return Object.entries(labels).map(([value, label]) => ({ value, label }));
}
