/**
 * @file dashboard.helpers.ts
 * @description Pure helpers that turn the admin dashboard API payloads
 * (`/api/admin/dashboard/*`, `/api/admin/audit-logs`) into FE numbers, labels and routes.
 */

import type { AdminStatusBreakdown } from '@/models/admin';

/** Booking statuses that are still "in flight" (not finished, cancelled, rejected or expired). */
export const ACTIVE_BOOKING_STATUSES = [
  'PENDING',
  'ACCEPTED_AWAITING_PAYMENT',
  'PAID',
  'AWAITING_MENTOR_COMPLETION',
  'AWAITING_MENTEE_CONFIRMATION',
  'UNDER_REVIEW',
] as const;

/** Sums the given statuses of a raw status → count breakdown; `undefined` when the block is absent. */
export function sumStatuses(
  breakdown: AdminStatusBreakdown | null | undefined,
  statuses: readonly string[],
): number | undefined {
  if (!breakdown) return undefined;
  return statuses.reduce((total, status) => total + (Number(breakdown[status]) || 0), 0);
}

/**
 * Maps a backend API path (queue `targetPath`, case `detailPath`) to the matching admin FE route.
 * Returns `undefined` when the FE has no screen for that API family.
 */
export function apiPathToAdminRoute(locale: string, apiPath?: string | null): string | undefined {
  if (!apiPath) return undefined;
  const root = `/${locale}/admin`;
  const [pathname] = apiPath.split('?');
  const match = (prefix: string) => {
    if (!pathname.startsWith(prefix)) return undefined;
    const rest = pathname.slice(prefix.length).replace(/^\/+/, '').split('/')[0];
    return rest || '';
  };

  const verificationId = match('/api/admin/mentor-verification/requests');
  if (verificationId !== undefined) {
    return verificationId
      ? `${root}/mentor-verification/${verificationId}`
      : `${root}/mentor-verification`;
  }
  const reportId = match('/api/admin/forum/reports');
  if (reportId !== undefined) return reportId ? `${root}/reports/${reportId}` : `${root}/reports`;
  // No booking detail screen yet — always land on the bookings list.
  if (match('/api/admin/bookings') !== undefined) return `${root}/bookings`;
  const userId = match('/api/admin/users');
  if (userId !== undefined) return userId ? `${root}/users/${userId}` : `${root}/users`;
  const mentorId = match('/api/admin/mentors');
  if (mentorId !== undefined) return mentorId ? `${root}/mentors/${mentorId}` : `${root}/users`;
  return undefined;
}

/** Fallback route for a queue key when the backend does not send a usable `targetPath`. */
export function queueKeyToAdminRoute(locale: string, queueKey?: string): string | undefined {
  if (!queueKey) return undefined;
  const root = `/${locale}/admin`;
  const key = queueKey.toLowerCase();
  if (key.startsWith('mentor_verification')) return `${root}/mentor-verification`;
  if (key.startsWith('forum_report') || key.startsWith('chat_report')) return `${root}/reports`;
  if (key.startsWith('booking')) return `${root}/bookings`;
  return undefined;
}

const QUEUE_LABELS: Record<string, string> = {
  mentor_verification_pending_review: 'Hồ sơ mentor chờ duyệt',
  booking_under_review: 'Khiếu nại lịch hẹn',
  forum_report_open: 'Báo cáo diễn đàn đang mở',
  payout_request_requested: 'Yêu cầu rút tiền chờ duyệt',
  payment_order_failed: 'Thanh toán thất bại',
  email_outbox_dead_letter: 'Email gửi thất bại',
};

export function getQueueLabel(key: string, fallback?: string) {
  return QUEUE_LABELS[key.toLowerCase()] ?? fallback ?? key;
}

const ENTITY_LABELS: Record<string, string> = {
  USER: 'Người dùng',
  MENTOR: 'Mentor',
  MENTOR_PROFILE: 'Hồ sơ mentor',
  MENTOR_VERIFICATION: 'Hồ sơ xác minh',
  MENTOR_VERIFICATION_REQUEST: 'Hồ sơ xác minh',
  BOOKING: 'Lịch hẹn',
  FORUM_REPORT: 'Báo cáo diễn đàn',
  FORUM_POST: 'Bài viết diễn đàn',
  FORUM_COMMENT: 'Bình luận diễn đàn',
  CHAT_REPORT: 'Báo cáo tin nhắn',
  PAYOUT_REQUEST: 'Yêu cầu rút tiền',
  PAYMENT_ORDER: 'Đơn thanh toán',
  COUPON: 'Mã giảm giá',
  CAMPAIGN: 'Chiến dịch',
  BLOG_POST: 'Bài viết blog',
};

export function getEntityLabel(entityType: string) {
  return ENTITY_LABELS[entityType.toUpperCase()] ?? entityType;
}

const ACTION_LABELS: Record<string, string> = {
  CREATE: 'Tạo mới',
  UPDATE: 'Cập nhật',
  DELETE: 'Xóa',
  APPROVE: 'Duyệt',
  REJECT: 'Từ chối',
  REQUEST_REVISION: 'Yêu cầu bổ sung',
  BAN: 'Khóa tài khoản',
  UNBAN: 'Mở khóa tài khoản',
  RESOLVE: 'Xử lý',
  ASSIGN: 'Nhận xử lý',
  UNASSIGN: 'Bỏ nhận xử lý',
  RESTORE: 'Khôi phục',
  PUBLISH: 'Xuất bản',
  ARCHIVE: 'Lưu trữ',
  MARK_PAID: 'Đánh dấu đã chi trả',
};

export function getActionLabel(action: string) {
  return ACTION_LABELS[action.toUpperCase()] ?? action;
}

/** Admin FE route for an audit-log entity, when a screen exists for it. */
export function auditEntityToAdminRoute(
  locale: string,
  entityType: string,
  entityId?: string | null,
): string | undefined {
  const root = `/${locale}/admin`;
  switch (entityType.toUpperCase()) {
    case 'USER':
      return entityId ? `${root}/users/${entityId}` : `${root}/users`;
    case 'MENTOR':
    case 'MENTOR_PROFILE':
      return entityId ? `${root}/mentors/${entityId}` : `${root}/users`;
    case 'MENTOR_VERIFICATION':
    case 'MENTOR_VERIFICATION_REQUEST':
      return entityId ? `${root}/mentor-verification/${entityId}` : `${root}/mentor-verification`;
    case 'FORUM_REPORT':
      return entityId ? `${root}/reports/${entityId}` : `${root}/reports`;
    case 'CHAT_REPORT':
      return `${root}/reports`;
    case 'BOOKING':
      return `${root}/bookings`;
    case 'COUPON':
      return entityId ? `${root}/coupons/${entityId}` : `${root}/coupons`;
    default:
      return undefined;
  }
}

/** Relative time in Vietnamese ("5 phút trước"). */
export function formatRelativeTime(value?: string | null) {
  if (!value) return '—';
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return '—';
  const minutes = Math.max(1, Math.round((Date.now() - time) / 60000));
  if (minutes < 60) return `${minutes} phút trước`;
  if (minutes < 1440) return `${Math.round(minutes / 60)} giờ trước`;
  return `${Math.round(minutes / 1440)} ngày trước`;
}
