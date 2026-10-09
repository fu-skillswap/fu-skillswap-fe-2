/**
 * @file bookingColors.ts
 * @description Single source of truth for calendar colours: booking status → colour group + label.
 */

import type { CSSProperties } from 'react';
import type { MentorBookingResponse } from '@/models/auth';

export type BookingTone = 'upcoming' | 'payment' | 'pending' | 'action' | 'completed' | 'closed';

interface ToneStyle {
  /** Legend / filter label for the whole colour group. */
  label: string;
  background: string;
  color: string;
  border: string;
  /** Colour used for legend squares, checkboxes and dots. */
  swatch: string;
  dashed?: boolean;
  strike?: boolean;
}

// Solid fills are a shade darker than the brand colours so white text keeps a 4.5:1 contrast.
export const TONE_STYLES: Record<BookingTone, ToneStyle> = {
  upcoming: {
    label: 'Sắp diễn ra',
    background: '#0077CC',
    color: '#FFFFFF',
    border: '#0077CC',
    swatch: '#0095F6',
  },
  payment: {
    label: 'Chờ thanh toán',
    background: '#C2410C',
    color: '#FFFFFF',
    border: '#C2410C',
    swatch: '#F97316',
  },
  pending: {
    label: 'Chờ mentor nhận',
    background: '#FEF3C7',
    color: '#854D0E',
    border: '#D97706',
    swatch: '#D97706',
    dashed: true,
  },
  action: {
    label: 'Chờ bạn xác nhận',
    background: '#4F46E5',
    color: '#FFFFFF',
    border: '#4F46E5',
    swatch: '#6366F1',
  },
  completed: {
    label: 'Đã học',
    background: '#DCFCE7',
    color: '#166534',
    border: '#86EFAC',
    swatch: '#22C55E',
  },
  closed: {
    label: 'Đã hủy / quá hạn',
    background: '#F1F5F9',
    color: '#475569',
    border: '#CBD5E1',
    swatch: '#94A3B8',
    strike: true,
  },
};

export const TONE_ORDER: BookingTone[] = [
  'upcoming',
  'payment',
  'pending',
  'action',
  'completed',
  'closed',
];

export interface BookingToneInfo {
  tone: BookingTone;
  /** Status label for this exact booking (more specific than the group label). */
  label: string;
}

function closedLabel(status: string) {
  if (status === 'NO_SHOW') return 'Vắng mặt';
  if (['REJECTED', 'REJECTED_BY_MENTOR'].includes(status)) return 'Bị từ chối';
  if (['CANCELLED_BY_MENTEE', 'CANCELED_BY_MENTEE'].includes(status)) return 'Bạn đã hủy';
  if (['CANCELLED_BY_MENTOR', 'CANCELED_BY_MENTOR'].includes(status)) return 'Mentor đã hủy';
  if (status.includes('EXPIRED')) return 'Quá hạn';
  return 'Đã hủy';
}

const CLOSED_STATUSES = [
  'NO_SHOW',
  'REJECTED',
  'REJECTED_BY_MENTOR',
  'CANCELLED_BY_MENTEE',
  'CANCELED_BY_MENTEE',
  'CANCELLED_BY_MENTOR',
  'CANCELED_BY_MENTOR',
  'REQUEST_EXPIRED',
  'EXPIRED_PENDING_MENTOR',
  'EXPIRED_AWAITING_PAYMENT',
  'PAYMENT_EXPIRED',
];

/** Colour group by displayState, falling back to bookingStatus. */
export function getBookingTone(booking: MentorBookingResponse): BookingToneInfo {
  const status = String(booking.bookingStatus || '').toUpperCase();
  if (CLOSED_STATUSES.includes(status)) return { tone: 'closed', label: closedLabel(status) };

  switch (booking.displayState) {
    case 'UPCOMING':
      return { tone: 'upcoming', label: 'Sắp diễn ra' };
    case 'IN_SESSION':
      return { tone: 'upcoming', label: 'Đang diễn ra' };
    case 'MENTOR_ACTION_REQUIRED':
      return { tone: 'upcoming', label: 'Chờ mentor hoàn tất' };
    case 'PAYMENT_REQUIRED':
      return { tone: 'payment', label: 'Chờ thanh toán' };
    case 'PENDING_MENTOR_RESPONSE':
      return { tone: 'pending', label: 'Chờ mentor nhận' };
    case 'WAITING_CONFIRMATION':
      return { tone: 'action', label: 'Chờ bạn xác nhận' };
    case 'FEEDBACK_REQUIRED':
      return { tone: 'action', label: 'Chờ đánh giá' };
    case 'UNDER_REVIEW':
      return { tone: 'action', label: 'Đang xử lý sự cố' };
    case 'COMPLETED':
      return { tone: 'completed', label: 'Đã học' };
    case 'CANCELED_OR_EXPIRED':
      return { tone: 'closed', label: closedLabel(status) };
    default:
      break;
  }

  if (['PENDING', 'REQUESTED'].includes(status))
    return { tone: 'pending', label: 'Chờ mentor nhận' };
  if (['ACCEPTED_AWAITING_PAYMENT', 'WAITING_PAYMENT'].includes(status)) {
    return { tone: 'payment', label: 'Chờ thanh toán' };
  }
  if (status === 'AWAITING_MENTEE_CONFIRMATION')
    return { tone: 'action', label: 'Chờ bạn xác nhận' };
  if (status === 'UNDER_REVIEW') return { tone: 'action', label: 'Đang xử lý sự cố' };
  if (['COMPLETED', 'AUTO_CLOSED'].includes(status)) return { tone: 'completed', label: 'Đã học' };
  return { tone: 'upcoming', label: 'Sắp diễn ra' };
}

/** Inline style for an event block / chip of the given tone. */
export function toneStyle(tone: BookingTone): CSSProperties {
  const style = TONE_STYLES[tone];
  return {
    backgroundColor: style.background,
    color: style.color,
    border: `${style.dashed ? '1.5px dashed' : '1px solid'} ${style.border}`,
  };
}
