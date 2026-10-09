/**
 * @file bookingActions.ts
 * @description Capability rules for mentee booking actions, shared by the list card and the
 * calendar popover so both views always offer the same actions.
 */

import type { MentorBookingResponse } from '@/models/auth';

const MESSAGE_STATES = [
  'UPCOMING',
  'IN_SESSION',
  'WAITING_CONFIRMATION',
  'UNDER_REVIEW',
  'FEEDBACK_REQUIRED',
  'COMPLETED',
];

export interface BookingActions {
  canPay: boolean;
  canCheckIn: boolean;
  canJoin: boolean;
  canConfirm: boolean;
  canMessage: boolean;
  canReportIssue: boolean;
  canRespondIssue: boolean;
  canCancel: boolean;
}

export function getBookingActions(booking: MentorBookingResponse): BookingActions {
  const isPendingStatus =
    booking.bookingStatus === 'PENDING' ||
    booking.bookingStatus === 'REQUESTED' ||
    booking.displayState === 'PENDING_MENTOR_RESPONSE';

  return {
    canPay: Boolean(booking.canPay),
    canCheckIn: Boolean(booking.attendance?.canCheckIn && !booking.attendance.currentUserCheckedIn),
    canJoin: Boolean(booking.canJoin && booking.meetingLink),
    canConfirm: Boolean(booking.canConfirmByMentee),
    canMessage:
      Boolean(booking.conversationId || booking.mentorUserId) &&
      MESSAGE_STATES.includes(booking.displayState),
    canReportIssue: Boolean(booking.canReportIssue),
    canRespondIssue: Boolean(booking.canRespondIssue),
    canCancel: booking.canCancel && isPendingStatus,
  };
}

const PLATFORM_LABELS: Record<string, string> = {
  GOOGLE_MEET: 'Google Meet',
  ZOOM: 'Zoom',
  MICROSOFT_TEAMS: 'Microsoft Teams',
  DISCORD: 'Discord',
  OFFLINE: 'Trực tiếp',
  OTHER: 'phòng học',
};

export function platformLabel(booking: MentorBookingResponse) {
  return PLATFORM_LABELS[booking.meetingPlatform || 'OTHER'] ?? 'phòng học';
}
