/**
 * @file BookingDetailModal.tsx
 * @description Mentee's booking detail dialog: status pill, time block, the meeting room while it
 * matters, a state box (confirm deadline / quick rating), details and the next action. Every action
 * reuses the list page's handlers (cancel dialog, confirm / report-issue modal, review page, chat).
 */

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { Clock, Copy, CreditCard, ExternalLink, MapPin, Star, Video } from 'lucide-react';
import {
  BookingDetailPill,
  BookingDetailShell,
  DETAIL_OUTLINE_BUTTON,
  DETAIL_PRIMARY_BUTTON,
  DetailDangerLink,
  type BookingDetailTone,
} from '@/components/domain/booking-detail/BookingDetailShell';
import {
  BookingDetailList,
  BookingDetailRow,
} from '@/components/domain/booking-detail/BookingDetailList';
import {
  BookingTimeBlock,
  formatZonedTime,
  formatZonedTimeDay,
} from '@/components/domain/booking-detail/BookingTimeBlock';
import { Button } from '@/components/ui/Button';
import { formatScoin } from '@/lib/coupon';
import type { MentorBookingResponse } from '@/models/auth';
import { showError, showSuccess } from '@/utils/toast';
import { REVIEW_MAX_STARS } from '@/views/mentee/booking-review/review.constants';
import {
  bookingReviewHref,
  canReviewBooking,
  getBookingActions,
  getBookingStatusConfig,
  getMentorName,
  mentorProfileHref,
  toDate,
  type BookingTone,
} from '../bookingStatusConfig';
import type { BookingFormAction } from './BookingCard';

const PLATFORM_NAMES: Record<string, string> = {
  GOOGLE_MEET: 'Google Meet',
  ZOOM: 'Zoom',
  MICROSOFT_TEAMS: 'Microsoft Teams',
  DISCORD: 'Discord',
  OFFLINE: 'Trực tiếp',
  OTHER: 'Khác',
};

/** Sessions whose room still matters. */
const LIVE_STATES = ['UPCOMING', 'IN_SESSION'];
/** The session is over (or never happens): grey time block, no room card. */
const PAST_STATES = [
  'WAITING_CONFIRMATION',
  'UNDER_REVIEW',
  'FEEDBACK_REQUIRED',
  'COMPLETED',
  'CANCELED_OR_EXPIRED',
];
/** Chat after these needs the post-session chat entitlement. */
const FINISHED_STATES = ['FEEDBACK_REQUIRED', 'COMPLETED', 'CANCELED_OR_EXPIRED'];

const TONE_OF_CONFIG: Record<BookingTone, BookingDetailTone> = {
  pending: 'amber',
  payment: 'amber',
  upcoming: 'blue',
  action: 'amber',
  done: 'green',
  ended: 'grey',
};

function getStatusPill(booking: MentorBookingResponse, now: number) {
  const display = String(booking.displayState || '').toUpperCase();
  if (display === 'UPCOMING') {
    const start = toDate(booking.selectedStartTime);
    const minutesLeft = start ? Math.ceil((start.getTime() - now) / 60_000) : Infinity;
    return {
      tone: 'blue' as const,
      label:
        minutesLeft > 0 && minutesLeft < 60
          ? `Sắp diễn ra · còn ${minutesLeft} phút`
          : 'Sắp diễn ra',
    };
  }
  if (display === 'IN_SESSION') return { tone: 'blue' as const, label: 'Đang diễn ra' };
  if (display === 'WAITING_CONFIRMATION')
    return { tone: 'amber' as const, label: 'Chờ bạn xác nhận' };
  if (display === 'FEEDBACK_REQUIRED' || display === 'COMPLETED') {
    return { tone: 'green' as const, label: 'Đã học' };
  }
  if (display === 'PAYMENT_REQUIRED') return { tone: 'amber' as const, label: 'Chờ thanh toán' };
  if (display === 'PENDING_MENTOR_RESPONSE') {
    return { tone: 'amber' as const, label: 'Chờ mentor nhận lịch' };
  }
  if (display === 'UNDER_REVIEW') return { tone: 'amber' as const, label: 'Đang xem xét sự cố' };
  const config = getBookingStatusConfig(booking);
  return {
    tone: display === 'CANCELED_OR_EXPIRED' ? ('grey' as const) : TONE_OF_CONFIG[config.tone],
    label: config.label,
  };
}

/** "16.500 S-coins · đã thanh toán", or undefined when the price is unknown. */
function getFeeText(booking: MentorBookingResponse) {
  if (booking.serviceIsFreeSnapshot) return 'Miễn phí';
  const price = booking.servicePriceWithSurchargeScoin ?? booking.servicePriceScoinSnapshot;
  if (price === null || price === undefined) return undefined;
  if (price <= 0) return 'Miễn phí';
  const payment = String(booking.paymentStatus || '').toUpperCase();
  const settlement = String(booking.settlementStatus || '').toUpperCase();
  let suffix = '';
  if (payment === 'REFUNDED' || settlement === 'REFUNDED') {
    suffix =
      booking.refundedScoin !== null && booking.refundedScoin !== undefined
        ? ` · đã hoàn ${formatScoin(booking.refundedScoin)} S-coins`
        : ' · đã hoàn tiền';
  } else if (
    payment === 'PAID' &&
    settlement === 'HELD' &&
    booking.displayState === 'WAITING_CONFIRMATION'
  ) {
    suffix = ' · đang giữ tới khi xác nhận';
  } else if (payment === 'PAID') {
    suffix = ' · đã thanh toán';
  }
  return `${formatScoin(price)} S-coins${suffix}`;
}

const withoutProtocol = (link: string) => link.replace(/^https?:\/\//i, '').replace(/\/$/, '');

function MentorCell({ booking, locale }: { booking: MentorBookingResponse; locale: string }) {
  const name = getMentorName(booking);
  const profileHref = mentorProfileHref(locale, booking);
  const initials =
    name
      .trim()
      .split(/\s+/)
      .slice(-2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || 'M';
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {booking.mentorAvatarUrl ? (
        <img
          src={booking.mentorAvatarUrl}
          alt=""
          className="h-8 w-8 shrink-0 rounded-full object-cover"
        />
      ) : (
        <span
          aria-hidden="true"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-light text-xs font-bold text-primary-text"
        >
          {initials}
        </span>
      )}
      <span className="font-semibold">{name}</span>
      {profileHref && (
        <Link
          href={profileHref}
          className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline-offset-4 hover:underline sm:min-h-0"
        >
          Xem hồ sơ
        </Link>
      )}
    </div>
  );
}

function RoomCard({ booking }: { booking: MentorBookingResponse }) {
  const platform = PLATFORM_NAMES[booking.meetingPlatform || ''] ?? 'Phòng học online';
  const link = booking.meetingLink?.trim();
  const opensAt = toDate(booking.joinAvailableAt);
  const closesAt = toDate(booking.joinClosesAt);

  if (booking.meetingPlatform === 'OFFLINE') {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-solid border-border-color p-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary-text">
          <MapPin className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <strong className="block text-sm font-semibold text-text-main">Trực tiếp</strong>
          <span className="block text-sm break-words text-text-secondary">
            {booking.location?.trim() || 'Mentor chưa gửi địa điểm.'}
          </span>
        </div>
      </div>
    );
  }

  if (!link) {
    return (
      <p className="m-0 text-sm text-text-secondary">
        Mentor chưa gửi link phòng học. Link sẽ hiện ở đây trước giờ học.
      </p>
    );
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      showSuccess('Đã sao chép link');
    } catch (error) {
      showError(error, { title: 'Không sao chép được link', description: link });
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3 rounded-2xl border border-solid border-border-color p-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary-text">
          <Video className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <strong className="block text-sm font-semibold text-text-main">{platform}</strong>
          <span className="block truncate text-sm text-text-secondary" title={link}>
            {withoutProtocol(link)}
          </span>
        </div>
        <button
          type="button"
          aria-label="Sao chép link phòng học"
          onClick={() => void copyLink()}
          className="inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-solid border-primary-border bg-white text-primary-text outline-none hover:bg-primary-light focus-visible:ring-4 focus-visible:ring-primary/25"
        >
          <Copy className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      {opensAt && closesAt && (
        <p className="m-0 text-sm text-text-secondary">
          Phòng mở từ {formatZonedTime(opensAt)} đến {formatZonedTime(closesAt)}.
        </p>
      )}
    </div>
  );
}

function ConfirmDeadlineBox({ booking }: { booking: MentorBookingResponse }) {
  const deadline = toDate(booking.actionDeadlineAt);
  return (
    <div className="flex gap-3 rounded-2xl border border-solid border-[#fde68a] bg-warning-soft p-4 text-sm leading-relaxed text-[#92400e]">
      <Clock className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <p className="m-0">
        Mentor đã báo buổi học kết thúc.
        {deadline && (
          <>
            {' '}
            Bạn xác nhận trước <b>{formatZonedTimeDay(deadline)}</b>; quá hạn, buổi sẽ tự được xác
            nhận.
          </>
        )}
      </p>
    </div>
  );
}

function RatingBox({ booking, locale }: { booking: MentorBookingResponse; locale: string }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-primary-light p-4">
      <strong className="text-[15px] font-semibold text-text-main">
        Buổi chia sẻ với {getMentorName(booking)} thế nào?
      </strong>
      <div className="flex gap-1" role="group" aria-label="Chấm điểm từ 1 đến 5 sao">
        {Array.from({ length: REVIEW_MAX_STARS }, (_, index) => index + 1).map((rating) => (
          <Link
            key={rating}
            href={bookingReviewHref(locale, booking.bookingId, rating)}
            aria-label={`${rating} sao`}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-[#f59e0b] outline-none hover:bg-white focus-visible:ring-4 focus-visible:ring-primary/25"
          >
            <Star className="h-7 w-7" strokeWidth={1.75} aria-hidden="true" />
          </Link>
        ))}
      </div>
      <p className="m-0 text-sm text-text-secondary">
        Đánh giá của bạn giúp các bạn sau chọn đúng mentor.
      </p>
    </div>
  );
}

interface BookingDetailModalProps {
  booking?: MentorBookingResponse;
  locale: string;
  onClose: () => void;
  /** Same handler as the card: cancel dialog, confirm / report / respond modal. */
  onAction: (type: BookingFormAction, trigger?: HTMLElement | null) => void;
  onMessage: () => void;
}

export function BookingDetailModal({
  booking,
  locale,
  onClose,
  onAction,
  onMessage,
}: BookingDetailModalProps) {
  const router = useRouter();
  if (!booking) return null;

  const now = Date.now();
  const display = String(booking.displayState || '').toUpperCase();
  const nextAction = String(booking.nextAction || 'NONE').toUpperCase();
  const pill = getStatusPill(booking, now);
  const start = toDate(booking.selectedStartTime);
  const end = toDate(booking.selectedEndTime);
  const closesAt = toDate(booking.joinClosesAt);
  const platform = PLATFORM_NAMES[booking.meetingPlatform || ''];
  const roomClosed = Boolean(closesAt && closesAt.getTime() <= now);
  const isPast = PAST_STATES.includes(display) || Boolean(end && end.getTime() <= now);
  const showRoom = LIVE_STATES.includes(display) && !roomClosed;
  const showClosedRoom =
    display !== 'CANCELED_OR_EXPIRED' &&
    (isPast || roomClosed) &&
    Boolean(booking.meetingLink || closesAt);
  const canRate = canReviewBooking(booking, now);
  const fee = getFeeText(booking);
  const goal = booking.learningGoalTitle?.trim();
  const goalDetail = booking.learningGoalDescription?.trim();
  const mentorNote = booking.mentorResponseNote?.trim();
  const actions = getBookingActions(booking);
  const canMessage =
    Boolean(booking.conversationId) &&
    (!FINISHED_STATES.includes(display) || Boolean(booking.maintainPostSessionChatSnapshot));

  // Footer: driven by nextAction and the capability flags, at most one primary.
  let primary: ReactNode = null;
  let dangerLink: ReactNode = null;
  const reportIssueLink = booking.canReportIssue ? (
    <DetailDangerLink onClick={(trigger) => onAction('reportIssue', trigger)}>
      Báo sự cố
    </DetailDangerLink>
  ) : null;

  if (nextAction === 'PAY_NOW' && booking.canPay) {
    primary = (
      <Button
        className={DETAIL_PRIMARY_BUTTON}
        leftIcon={<CreditCard className="h-4 w-4" aria-hidden="true" />}
        onClick={() => router.push(`/${locale}/my-bookings/${booking.bookingId}/checkout`)}
      >
        Thanh toán
      </Button>
    );
  } else if (nextAction === 'JOIN_SESSION' && booking.canJoin && booking.meetingLink) {
    const link = booking.meetingLink;
    primary = (
      <Button
        className={DETAIL_PRIMARY_BUTTON}
        rightIcon={<ExternalLink className="h-4 w-4" aria-hidden="true" />}
        onClick={() => window.open(link, '_blank', 'noopener,noreferrer')}
      >
        Vào {platform && booking.meetingPlatform !== 'OTHER' ? platform : 'phòng học'}
      </Button>
    );
  } else if (nextAction === 'CONFIRM_SESSION' && booking.canConfirmByMentee) {
    dangerLink = reportIssueLink;
    primary = (
      <Button
        className={DETAIL_PRIMARY_BUTTON}
        onClick={(event) => onAction('confirm', event.currentTarget)}
      >
        Xác nhận đã học
      </Button>
    );
  } else if ((nextAction === 'LEAVE_FEEDBACK' || display === 'FEEDBACK_REQUIRED') && canRate) {
    dangerLink = reportIssueLink;
    primary = (
      <Button
        className={DETAIL_PRIMARY_BUTTON}
        onClick={() => router.push(bookingReviewHref(locale, booking.bookingId))}
      >
        Đánh giá mentor
      </Button>
    );
  } else if (nextAction === 'VIEW_ISSUE' && booking.canRespondIssue) {
    // TODO(api): no issue detail screen/endpoint for the mentee yet; the respond modal is the only
    // place that shows the issue, so "Xem sự cố" opens it.
    primary = (
      <Button
        className={DETAIL_PRIMARY_BUTTON}
        onClick={(event) => onAction('respondIssue', event.currentTarget)}
      >
        Xem sự cố
      </Button>
    );
  }
  // Cancelling always goes through the list page's confirmation dialog.
  if (!dangerLink && actions.canCancel) {
    dangerLink = (
      <DetailDangerLink onClick={(trigger) => onAction('cancel', trigger)}>
        {actions.cancelLabel}
      </DetailDangerLink>
    );
  }

  const messageButton = canMessage ? (
    <Button variant="outline" className={DETAIL_OUTLINE_BUTTON} onClick={onMessage}>
      Nhắn mentor
    </Button>
  ) : null;

  return (
    <BookingDetailShell
      open
      onClose={onClose}
      status={<BookingDetailPill tone={pill.tone} label={pill.label} />}
      title={booking.serviceTitle?.trim() || 'Chi tiết buổi học'}
      footerStart={dangerLink}
      footerEnd={
        messageButton || primary ? (
          <>
            {messageButton}
            {primary}
          </>
        ) : null
      }
    >
      {start && (
        <BookingTimeBlock
          start={start}
          end={end}
          durationMinutes={booking.serviceDurationSnapshot}
          past={isPast}
          trailing={isPast ? platform : 'giờ Việt Nam'}
        />
      )}

      {showRoom && <RoomCard booking={booking} />}

      {display === 'WAITING_CONFIRMATION' && <ConfirmDeadlineBox booking={booking} />}
      {display === 'FEEDBACK_REQUIRED' && canRate && (
        <RatingBox booking={booking} locale={locale} />
      )}

      <BookingDetailList>
        <BookingDetailRow label="Mentor">
          <MentorCell booking={booking} locale={locale} />
        </BookingDetailRow>
        {fee && <BookingDetailRow label="Phí">{fee}</BookingDetailRow>}
        <BookingDetailRow label="Mục tiêu">
          {goal || goalDetail ? (
            <>
              {goal && <span className="block">{goal}</span>}
              {goalDetail && (
                <span className="mt-1 line-clamp-3 block text-sm whitespace-pre-line text-text-secondary">
                  {goalDetail}
                </span>
              )}
            </>
          ) : (
            <span className="text-text-secondary italic">Bạn chưa ghi mục tiêu cho buổi này.</span>
          )}
        </BookingDetailRow>
        {mentorNote && (
          <BookingDetailRow label="Lời nhắn">
            <span className="whitespace-pre-line">{mentorNote}</span>
          </BookingDetailRow>
        )}
        {showClosedRoom && (
          <BookingDetailRow label="Phòng học">
            {closesAt ? `Đã đóng lúc ${formatZonedTime(closesAt)}` : 'Đã đóng'}
          </BookingDetailRow>
        )}
      </BookingDetailList>
    </BookingDetailShell>
  );
}
