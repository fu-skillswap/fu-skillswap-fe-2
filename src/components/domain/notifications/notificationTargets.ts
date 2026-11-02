/**
 * @file notificationTargets.ts
 * @description The one place that decides where a notification leads: which nav section it belongs
 * to, the page + item it opens, and whether it still needs the user (action) or is news (info).
 * Types mirror the backend `NotificationType` enum; a new type is one line in NOTIFICATION_RULES.
 */

import type { Notification } from '@/models/notification';

/** Nav destinations that can carry a badge. */
export type NavSection =
  | 'home'
  | 'findMentor'
  | 'blog'
  | 'booking'
  | 'mentorBookings'
  | 'schedule'
  | 'courses'
  | 'wallet'
  | 'profile'
  | 'messages';

export type NotificationKind = 'action' | 'info';

export interface NotificationTarget {
  section: NavSection;
  href: string;
  /** Element id the target page highlights, when the notification names one item. */
  highlightId?: string;
  kind: NotificationKind;
  /** Shown as "Mở {destination}" in the notification list. */
  destination: string;
}

export interface NotificationContext {
  locale: string;
  /** Current user, needed for "my own mentor profile". */
  userId?: string;
  isMentor: boolean;
}

/** `?focus=` asks the page to scroll to and highlight one item. */
export const FOCUS_PARAM = 'focus';

/**
 * Which booking list holds the booking: the mentee's "Booking của tôi", the mentor's "Lịch đặt",
 * or `auto` when the backend sends the type to either side. `auto` opens the user's likely side;
 * a booking page that finds the booking belongs to the other side hands it over (see
 * useFocusedBooking), so the guess never leaves the user on the wrong list.
 */
type BookingSide = 'mentee' | 'mentor' | 'auto';

type Rule =
  | { to: 'booking'; side: BookingSide; kind: NotificationKind }
  | { to: 'review'; kind: NotificationKind }
  | { to: 'ownReviews'; kind: NotificationKind }
  | { to: 'forumPost'; kind: NotificationKind }
  | { to: 'blogPost'; kind: NotificationKind }
  | { to: 'mentorRegistration'; kind: NotificationKind }
  | { to: 'schedule'; kind: NotificationKind }
  | { to: 'messages'; kind: NotificationKind }
  | { to: 'home'; kind: NotificationKind };

const NOTIFICATION_RULES: Record<string, Rule> = {
  // Mentee's bookings
  BOOKING_ACCEPTED: { to: 'booking', side: 'mentee', kind: 'action' }, // pay to keep the slot
  BOOKING_PAYMENT_CONFIRMED: { to: 'booking', side: 'mentee', kind: 'info' },
  BOOKING_REJECTED: { to: 'booking', side: 'mentee', kind: 'info' },
  BOOKING_AUTO_REJECTED: { to: 'booking', side: 'mentee', kind: 'info' },
  BOOKING_CANCELLED_BY_MENTOR: { to: 'booking', side: 'mentee', kind: 'info' },
  MEETING_LINK_UPDATED: { to: 'booking', side: 'mentee', kind: 'info' },
  FEEDBACK_PROMPT: { to: 'review', kind: 'action' },
  // Mentor's "Lịch đặt"
  BOOKING_REQUEST_CREATED: { to: 'booking', side: 'mentor', kind: 'action' },
  BOOKING_CANCELLED_BY_MENTEE: { to: 'booking', side: 'mentor', kind: 'info' },
  BOOKING_PAYMENT_EXPIRED: { to: 'booking', side: 'mentor', kind: 'info' },
  FEEDBACK_RECEIVED: { to: 'ownReviews', kind: 'info' },
  // Sent to the mentee or the mentor depending on the event
  BOOKING_REQUEST_EXPIRED: { to: 'booking', side: 'auto', kind: 'info' },
  BOOKING_RESCHEDULE_REQUESTED: { to: 'booking', side: 'auto', kind: 'action' },
  BOOKING_RESCHEDULE_ACCEPTED: { to: 'booking', side: 'auto', kind: 'info' },
  BOOKING_RESCHEDULE_REJECTED: { to: 'booking', side: 'auto', kind: 'info' },
  BOOKING_RESCHEDULE_EXPIRED: { to: 'booking', side: 'auto', kind: 'info' },
  BOOKING_REMINDER: { to: 'booking', side: 'auto', kind: 'info' },
  SESSION_COMPLETED: { to: 'booking', side: 'auto', kind: 'info' },
  GOOGLE_CALENDAR_SYNC_NOTICE: { to: 'booking', side: 'auto', kind: 'info' },
  BOOKING_ISSUE_REPORTED: { to: 'booking', side: 'auto', kind: 'action' },
  BOOKING_ISSUE_RESPONSE_RECEIVED: { to: 'booking', side: 'auto', kind: 'info' },
  BOOKING_ISSUE_RESPONSE_REMINDER: { to: 'booking', side: 'auto', kind: 'action' },
  BOOKING_ISSUE_RESOLVED: { to: 'booking', side: 'auto', kind: 'info' },
  BOOKING_ISSUE_RESOLUTION_REVERSED: { to: 'booking', side: 'auto', kind: 'info' },
  BOOKING_ISSUE_ADMIN_REVIEW_REQUIRED: { to: 'booking', side: 'auto', kind: 'info' },
  ADMIN_DISPUTE_SLA_BREACH: { to: 'booking', side: 'auto', kind: 'info' },
  // Community
  FORUM_POST_COMMENTED: { to: 'forumPost', kind: 'info' },
  FORUM_COMMENT_REPLY: { to: 'forumPost', kind: 'info' },
  // TODO(api): hidden posts/comments are not readable by their author and FORUM_COMMENT_HIDDEN
  // carries only the comment id (no post id); both open the feed without a highlight.
  FORUM_POST_HIDDEN: { to: 'home', kind: 'info' },
  FORUM_COMMENT_HIDDEN: { to: 'home', kind: 'info' },
  BLOG_POST_PUBLISHED: { to: 'blogPost', kind: 'info' },
  // Mentor application
  MENTOR_VERIFICATION_NEEDS_REVISION: { to: 'mentorRegistration', kind: 'action' },
  MENTOR_VERIFICATION_REJECTED: { to: 'mentorRegistration', kind: 'info' },
  MENTOR_VERIFICATION_APPROVED: { to: 'schedule', kind: 'info' },
  // Other
  CHAT_UNREAD: { to: 'messages', kind: 'info' },
  ACCOUNT_UNLOCKED: { to: 'home', kind: 'info' },
  // TODO(route): there is no page for course announcements yet (deepLink /courses/{id}/announcements).
  COURSE_ANNOUNCEMENT: { to: 'home', kind: 'info' },
};

const BLOG_DEEP_LINK = /^\/blog\/posts\/([^/?#]+)/;

const withFocus = (path: string, id: string, query = '') =>
  `${path}?${query}${query ? '&' : ''}${FOCUS_PARAM}=${encodeURIComponent(id)}`;

/** Where a notification leads. Unknown types open the feed, never a dead link. */
export function getNotificationTarget(
  notification: Notification,
  { locale, userId, isMentor }: NotificationContext,
): NotificationTarget {
  const base = `/${locale}`;
  const home: NotificationTarget = {
    section: 'home',
    href: `${base}/dashboard`,
    kind: 'info',
    destination: 'Bảng tin',
  };
  const rule = NOTIFICATION_RULES[notification.type.toUpperCase()];
  const entityId = notification.relatedEntityId ?? undefined;
  if (!rule) return home;
  const { kind } = rule;

  switch (rule.to) {
    case 'booking': {
      const side: BookingSide = rule.side === 'auto' ? (isMentor ? 'mentor' : 'mentee') : rule.side;
      const isMentorList = side === 'mentor';
      const path = isMentorList ? `${base}/mentor/bookings` : `${base}/my-bookings`;
      const section: NavSection = isMentorList ? 'mentorBookings' : 'booking';
      const destination = isMentorList ? 'Lịch đặt' : 'Booking của tôi';
      // TODO(api): every booking notification should carry its bookingId; without it the list
      // opens without a highlight.
      if (!entityId) return { section, href: path, kind, destination };
      return {
        section,
        href: withFocus(path, entityId),
        highlightId: `booking-${entityId}`,
        kind,
        destination,
      };
    }
    case 'review':
      if (!entityId) return { ...home, section: 'booking', kind };
      return {
        section: 'booking',
        href: `${base}/my-bookings/${encodeURIComponent(entityId)}/review`,
        kind,
        destination: 'Đánh giá buổi học',
      };
    case 'ownReviews':
      // TODO(api): FEEDBACK_RECEIVED carries the booking id, not the review id, so the reviews tab
      // opens without highlighting one review.
      if (!userId) return { ...home, section: 'profile' };
      return {
        section: 'profile',
        href: withFocus(
          `${base}/mentor-booking`,
          'mentor-reviews',
          `mentorId=${encodeURIComponent(userId)}&tab=reviews`,
        ),
        highlightId: 'mentor-reviews',
        kind,
        destination: 'Đánh giá của bạn',
      };
    case 'forumPost':
      // TODO(api): forum notifications carry the post id only (no comment id), so the comments
      // section is highlighted instead of the exact comment.
      if (!entityId) return home;
      return {
        section: 'home',
        href: withFocus(`${base}/post-detail/${encodeURIComponent(entityId)}`, 'post-comments'),
        highlightId: 'post-comments',
        kind,
        destination: 'Bài viết',
      };
    case 'blogPost': {
      const slug = notification.deepLink?.match(BLOG_DEEP_LINK)?.[1];
      return {
        section: 'blog',
        href: slug ? `${base}/blog/${slug}` : `${base}/blog`,
        kind,
        destination: 'Blog',
      };
    }
    case 'mentorRegistration':
      // TODO(api): say which registration step needs fixing so the form can open on it.
      return {
        section: 'profile',
        href: `${base}/mentor-registration`,
        kind,
        destination: 'Hồ sơ mentor',
      };
    case 'schedule':
      return {
        section: 'schedule',
        href: `${base}/mentor/schedule-manage`,
        kind,
        destination: 'Dịch vụ & Lịch dạy',
      };
    case 'messages':
      return { section: 'messages', href: `${base}/messages`, kind, destination: 'Tin nhắn' };
    case 'home':
      return { ...home, kind };
  }
}

/** Nav section of the current page, used to mark its news as seen. */
export function sectionOfPath(pathname: string): NavSection | undefined {
  if (/\/my-bookings(\/|$)/.test(pathname)) return 'booking';
  if (pathname.includes('/mentor/bookings')) return 'mentorBookings';
  if (pathname.includes('/mentor/schedule-manage')) return 'schedule';
  if (pathname.includes('/mentor/my-courses')) return 'courses';
  if (pathname.includes('/mentor/wallet')) return 'wallet';
  if (pathname.includes('/mentor-registration')) return 'profile';
  if (pathname.includes('/messages')) return 'messages';
  if (/\/blog(\/|$)/.test(pathname)) return 'blog';
  if (pathname.endsWith('/dashboard') && !pathname.includes('/mentor/')) return 'home';
  if (pathname.includes('/post-detail/')) return 'home';
  return undefined;
}
