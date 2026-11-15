/**
 * @file ViolationPills.tsx
 * @description Small pills shared by the admin mentor-violation screens: violation state, severity
 * and the booking reference.
 */

import {
  MENTOR_VIOLATION_SEVERITY_LABELS,
  MENTOR_VIOLATION_TYPE_LABELS,
} from '@/constants/mentorViolations';
import {
  VIOLATION_STATE_LABELS,
  shortBookingId,
  type ViolationState,
} from './mentorViolations.helpers';

const PILL =
  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-solid px-2.5 py-0.5 text-xs font-bold';

const STATE_STYLES: Record<ViolationState, string> = {
  active: 'border-amber-200 bg-amber-50 text-amber-700',
  expired: 'border-slate-200 bg-slate-100 text-slate-600',
  reversed: 'border-slate-200 bg-slate-100 text-slate-600',
};

const SEVERITY_STYLES: Record<string, string> = {
  LOW: 'border-slate-200 bg-slate-100 text-slate-600',
  MEDIUM: 'border-amber-200 bg-amber-50 text-amber-700',
  HIGH: 'border-red-200 bg-red-50 text-red-700',
  CRITICAL: 'border-red-200 bg-red-50 text-red-700',
};

export function violationTypeLabel(type?: string | null) {
  return (type && MENTOR_VIOLATION_TYPE_LABELS[type]) || 'Vi phạm khác';
}

export function ViolationStatePill({ state }: { state: ViolationState }) {
  return <span className={`${PILL} ${STATE_STYLES[state]}`}>{VIOLATION_STATE_LABELS[state]}</span>;
}

export function SeverityPill({ severity }: { severity?: string | null }) {
  if (!severity) return <span className="text-slate-400">—</span>;
  return (
    <span className={`${PILL} ${SEVERITY_STYLES[severity] ?? SEVERITY_STYLES.LOW}`}>
      {MENTOR_VIOLATION_SEVERITY_LABELS[severity] ?? 'Chưa phân loại'}
    </span>
  );
}

export function BookingReference({ bookingId }: { bookingId?: string | null }) {
  if (!bookingId) return null;
  // TODO(api): link to the admin booking detail page once a route for a single booking exists.
  return (
    <span className="whitespace-nowrap text-xs font-medium text-slate-500" title={bookingId}>
      Booking #{shortBookingId(bookingId)}
    </span>
  );
}
