/**
 * @file BookingStatusBadge.tsx
 * @description Component hiển thị Status Badge tiếng Việt cho từng trạng thái Booking.
 * Chuyển đổi mã trạng thái từ Backend Spring Boot sang nhãn tiếng Việt chỉ in hoa chữ cái đầu và gắn màu sắc CSS chuẩn.
 */

'use client';

import type { MentorBookingStatus } from '@/models/auth';
import {
  AlertCircle,
  Ban,
  CheckCircle2,
  Clock,
  CreditCard,
  HelpCircle,
  Hourglass,
  PlayCircle,
  ShieldAlert,
  UserX,
  XCircle,
} from 'lucide-react';
import type { ReactNode } from 'react';

export interface BookingStatusConfig {
  /** Nhãn hiển thị tiếng Việt (chỉ in hoa chữ cái đầu) */
  label: string;
  /** Class CSS Tailwind định dạng giao diện badge */
  badgeClass: string;
  /** Biểu tượng Lucide đi kèm */
  icon: ReactNode;
}

/** Bản đồ ánh xạ tất cả các trạng thái Booking từ Backend Spring Boot sang Tiếng Việt & CSS Badge */
export const BOOKING_STATUS_MAP: Record<string, BookingStatusConfig> = {
  PENDING: {
    label: 'Đang chờ mentor',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200/80',
    icon: <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
  },
  ACCEPTED_AWAITING_PAYMENT: {
    label: 'Chờ thanh toán',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200/80',
    icon: <CreditCard className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
  },
  REQUEST_EXPIRED: {
    label: 'Quá hạn phản hồi',
    badgeClass: 'bg-slate-100 text-slate-600 border-slate-200/80',
    icon: <Hourglass className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
  },
  EXPIRED_AWAITING_PAYMENT: {
    label: 'Quá hạn thanh toán',
    badgeClass: 'bg-slate-100 text-slate-600 border-slate-200/80',
    icon: <Hourglass className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
  },
  CANCELLED_BY_MENTEE: {
    label: 'Mentee đã hủy',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200/80',
    icon: <XCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
  },
  REJECTED: {
    label: 'Mentor từ chối',
    badgeClass: 'bg-red-50 text-red-700 border-red-200/80',
    icon: <Ban className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
  },
  PAID: {
    label: 'Đã xác nhận lịch',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    icon: <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
  },
  CANCELLED_BY_MENTOR: {
    label: 'Mentor đã hủy',
    badgeClass: 'bg-red-50 text-red-700 border-red-200/80',
    icon: <XCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
  },
  AWAITING_MENTOR_COMPLETION: {
    label: 'Đang diễn ra',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200/80',
    icon: <PlayCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
  },
  NO_SHOW: {
    label: 'Vắng mặt',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200/80',
    icon: <UserX className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
  },
  AWAITING_MENTEE_CONFIRMATION: {
    label: 'Chờ Mentee xác nhận',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
    icon: <HelpCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
  },
  UNDER_REVIEW: {
    label: 'Đang xem xét',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200/80',
    icon: <ShieldAlert className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
  },
  AUTO_CLOSED: {
    label: 'Tự động hoàn tất',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    icon: <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
  },
  COMPLETED: {
    label: 'Hoàn thành',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    icon: <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
  },
};

/** Lấy cấu hình hiển thị trạng thái Booking */
export function getBookingStatusConfig(status?: string): BookingStatusConfig {
  if (!status) {
    return BOOKING_STATUS_MAP.PENDING;
  }
  let upper = status.trim().toUpperCase();
  if (upper === 'CANCELED_BY_MENTEE') upper = 'CANCELLED_BY_MENTEE';
  if (upper === 'CANCELED_BY_MENTOR') upper = 'CANCELLED_BY_MENTOR';
  if (upper === 'REJECTED_BY_MENTOR') upper = 'REJECTED';
  if (BOOKING_STATUS_MAP[upper]) {
    return BOOKING_STATUS_MAP[upper];
  }

  // Fallback định dạng nếu trạng thái lạ
  const fallbackLabel = upper
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/^./, (char) => char.toUpperCase());

  return {
    label: fallbackLabel,
    badgeClass: 'bg-slate-100 text-slate-600 border-slate-200/80',
    icon: <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
  };
}

interface BookingStatusBadgeProps {
  status?: MentorBookingStatus | string;
  className?: string;
}

/**
 * Component hiển thị Status Badge tiếng Việt cho từng trạng thái Booking.
 */
export function BookingStatusBadge({ status, className = '' }: BookingStatusBadgeProps) {
  const config = getBookingStatusConfig(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold border ${config.badgeClass} ${className}`.trim()}
    >
      {config.icon}
      <span>{config.label}</span>
    </span>
  );
}
