'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  CreditCard,
  Info,
  Lock,
  Search,
  LogIn,
  MessageCircle,
  Monitor,
  RotateCcw,
  Star,
  Video,
  Wallet,
} from 'lucide-react';
import { StarDisplay } from '@/components/ui/StarDisplay';
import type { MentorBookingResponse } from '@/models/auth';
import type { SessionFeedbackResponse } from '@/models/review';
import { bookingFeedbackQueryKey, reviewRepo } from '@/repositories/reviewRepo';
import { REVIEW_MAX_STARS, starAriaLabel } from '@/views/mentee/booking-review/review.constants';
import type { MenteeBookingMutation } from '../useMyBookings';
import {
  BOOKING_TONES,
  bookingReviewHref,
  canReviewBooking,
  formatDayMonth,
  formatTime,
  formatTimeRange,
  formatWeekday,
  getBookingActions,
  getBookingPrice,
  getBookingStateKey,
  getBookingStatusConfig,
  getMentorName,
  getPlatformLabel,
  isBookingPaid,
  isFinalizedBooking,
  toDate,
} from '../bookingStatusConfig';
import { BookingProgress, ExpiredBookingProgress } from './BookingProgress';
import { BookingStatusPill } from './BookingStatusPill';
import styles from '../MyBookingsView.module.css';

export type BookingFormAction = 'cancel' | 'confirm' | 'reportIssue' | 'respondIssue';

interface BookingCardProps {
  booking: MentorBookingResponse;
  locale: string;
  /** Mentor-expired request whose session is still ahead and was not dismissed. */
  isActionableExpiry?: boolean;
  onDismissExpiry?: () => void;
  onAction: (type: BookingFormAction, trigger?: HTMLElement | null) => void;
  onImmediate: (mutation: MenteeBookingMutation) => void;
  onMessage: () => void;
}

function mentorProfileHref(locale: string, booking: MentorBookingResponse) {
  return booking.mentorUserId
    ? `/${locale}/mentor-booking?mentorId=${encodeURIComponent(booking.mentorUserId)}`
    : undefined;
}

function DateTile({ value, muted = false }: { value: string; muted?: boolean }) {
  const date = toDate(value);
  if (!date) return <div className={styles.dateTile} aria-hidden="true" />;
  return (
    <div className={`${styles.dateTile} ${muted ? styles.dateTileMuted : ''}`}>
      {!muted && <span className={styles.dateWeekday}>{formatWeekday(date)}</span>}
      <span className={styles.dateDay}>{date.getDate()}</span>
      <span className={styles.dateMonth}>Tháng {date.getMonth() + 1}</span>
    </div>
  );
}

function MentorAvatar({ booking }: { booking: MentorBookingResponse }) {
  const name = getMentorName(booking);
  if (booking.mentorAvatarUrl) {
    return <img className={styles.avatar} src={booking.mentorAvatarUrl} alt="" />;
  }
  return (
    <span className={`${styles.avatar} ${styles.avatarInitial}`} aria-hidden="true">
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

const bookingAnchorId = (bookingId: string) => `booking-${bookingId}`;

/** "Chờ đánh giá": tap a star to open the review page with that rating prefilled. */
function ReviewPromptBox({ mentor, reviewHref }: { mentor: string; reviewHref: string }) {
  return (
    <div className={styles.reviewBox}>
      <p className={styles.reviewBoxText}>
        <strong>Buổi học với {mentor} thế nào?</strong>
        Chạm vào số sao để bắt đầu. Mất khoảng 1 phút, giúp bạn khác chọn đúng mentor.
      </p>
      <div className={styles.quickStars} role="group" aria-label="Chọn nhanh số sao">
        {Array.from({ length: REVIEW_MAX_STARS }, (_, index) => index + 1).map((rating) => (
          <Link
            key={rating}
            className={styles.quickStar}
            href={`${reviewHref}?rating=${rating}`}
            aria-label={starAriaLabel(rating)}
          >
            <Star aria-hidden="true" strokeWidth={1.75} />
          </Link>
        ))}
      </div>
    </div>
  );
}

/** The mentee's saved review on a finished booking. */
function MyReviewBox({ review }: { review: SessionFeedbackResponse }) {
  const created = toDate(review.createdAt);
  const comment = review.comment?.trim();
  return (
    <div className={styles.myReview}>
      <div className={styles.myReviewHead}>
        <StarDisplay rating={review.rating} label={`Bạn đã chấm ${review.rating} trên 5 sao`} />
        <span>Đánh giá của bạn{created ? ` · ${formatDayMonth(created)}` : ''}</span>
      </div>
      {comment && <p className={styles.myReviewComment}>{comment}</p>}
    </div>
  );
}

/** Date tile, title + status pill, mentor link and time / price / platform chips. */
function CardTop({ booking, locale }: { booking: MentorBookingResponse; locale: string }) {
  const mentor = getMentorName(booking);
  const profileHref = mentorProfileHref(locale, booking);
  const price = getBookingPrice(booking);
  const timeRange = formatTimeRange(booking);
  const platform = getPlatformLabel(booking);
  const mentorRow = (
    <>
      <MentorAvatar booking={booking} />
      <span className={styles.mentorName}>{mentor}</span>
      <span className={styles.mentorRole}>· Mentor</span>
    </>
  );

  return (
    <div className={styles.cardTop}>
      <DateTile value={booking.selectedStartTime} />
      <div style={{ minWidth: 0 }}>
        <div className={styles.cardHeading}>
          <h3 className={styles.cardTitle}>{booking.serviceTitle || 'Buổi mentoring'}</h3>
          <BookingStatusPill booking={booking} />
        </div>
        {profileHref ? (
          <Link
            className={styles.mentorLink}
            href={profileHref}
            aria-label={`Xem hồ sơ mentor ${mentor}`}
          >
            {mentorRow}
          </Link>
        ) : (
          <span className={styles.mentorLink}>{mentorRow}</span>
        )}
        <div className={styles.chips}>
          {timeRange && (
            <span className={styles.chip}>
              <Clock aria-hidden="true" />
              {timeRange}
            </span>
          )}
          <span className={styles.chip}>
            <Wallet aria-hidden="true" />
            {price > 0 ? `${price} S-coins` : 'Miễn phí'}
            {isBookingPaid(booking) ? ' · đã thanh toán' : ''}
          </span>
          {platform && (
            <span className={styles.chip}>
              <Monitor aria-hidden="true" />
              {platform}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Full card for a request the mentor let expire while the session is still ahead: explains what
 * happened and offers another mentor or a resend. Payment only happens after the mentor accepts,
 * so an expired request never charged the mentee.
 */
function ExpiredBookingCard({
  booking,
  locale,
  onDismiss,
}: {
  booking: MentorBookingResponse;
  locale: string;
  onDismiss?: () => void;
}) {
  const mentor = getMentorName(booking);
  const start = toDate(booking.selectedStartTime);
  const resendHref = mentorProfileHref(locale, booking);
  // TODO(api): the find-mentor page has no service-type / date / time filters yet; pass
  // ?serviceType, ?date and ?time here once GET /api/mentors supports them.
  const findMentorHref = `/${locale}/mentor-booking`;

  return (
    <article className={styles.card} id={bookingAnchorId(booking.bookingId)}>
      <CardTop booking={booking} locale={locale} />
      <ExpiredBookingProgress booking={booking} />

      <div className={styles.expiredBox}>
        <Info aria-hidden="true" />
        <p style={{ margin: 0 }}>
          {/* TODO(api): expiredAt / responseDeadline — say "chưa nhận lịch trước HH:mm, dd/MM". */}
          <strong>Yêu cầu đã tự hủy vì {mentor} chưa nhận lịch.</strong> Bạn không mất phí.
          {start &&
            ` Giờ học ${formatTime(start)} ${formatWeekday(start)} vẫn còn kịp: tìm một mentor khác, hoặc gửi lại cho ${mentor}.`}
        </p>
      </div>

      {/* TODO(api): endpoint listing mentors of the same service type who are free at this
          booking's slot (avatar, name, field, service + price, free range, serviceId/slotId) to
          render the "Mentor … còn trống lúc HH:mm" grid with "Đặt giờ này" deep links. Until then
          only the "Tìm mentor khác" link below is shown. */}

      <footer className={styles.footer}>
        <p className={styles.footerNote}>
          Buổi này sẽ chuyển sang mục &quot;Đã hủy&quot; sau giờ học, hoặc khi bạn bấm Bỏ qua.
        </p>
        <div className={styles.footerActions}>
          {onDismiss && (
            <button
              type="button"
              className={`${styles.btn} ${styles.btnGhostSlate}`}
              onClick={onDismiss}
            >
              Bỏ qua
            </button>
          )}
          <Link className={`${styles.btn} ${styles.btnOutline}`} href={findMentorHref}>
            <Search aria-hidden="true" />
            Tìm mentor khác
          </Link>
          {resendHref && (
            // TODO(api): preselect the same service (and slot) once the booking page accepts
            // ?serviceId; today it opens the mentor's profile to pick the service again.
            <Link className={`${styles.btn} ${styles.btnOutline}`} href={resendHref}>
              Gửi lại cho {mentor}
            </Link>
          )}
        </div>
      </footer>
    </article>
  );
}

/** Compact, greyed card for canceled / rejected / expired bookings. */
function EndedBookingCard({ booking, locale }: { booking: MentorBookingResponse; locale: string }) {
  const config = getBookingStatusConfig(booking);
  const reason = booking.cancelReason?.trim() || booking.rejectReason?.trim();
  const rebookHref = mentorProfileHref(locale, booking);
  // TODO(api): expose canceledAt/rejectedAt so the line can read "Bạn đã hủy lúc HH:mm, dd/MM".
  return (
    <article className={styles.compact} id={bookingAnchorId(booking.bookingId)}>
      <DateTile value={booking.selectedStartTime} muted />
      <div style={{ minWidth: 0 }}>
        <h3 className={styles.compactTitle}>
          {booking.serviceTitle || 'Buổi mentoring'}{' '}
          <span className={styles.compactWith}>với {getMentorName(booking)}</span>
        </h3>
        <p className={styles.compactMeta}>
          {config.label}
          {reason ? ` · Lý do: ${reason}` : ''}
        </p>
        {isFinalizedBooking(booking) && (
          <p className={styles.compactLock}>
            <Lock aria-hidden="true" />
            Đã chốt, không khôi phục được
          </p>
        )}
      </div>
      <div className={styles.compactRight}>
        <BookingStatusPill booking={booking} />
        {rebookHref && (
          <Link className={styles.link} href={rebookHref}>
            Đặt lịch mới
          </Link>
        )}
      </div>
    </article>
  );
}

export function BookingCard({
  booking,
  locale,
  isActionableExpiry = false,
  onDismissExpiry,
  onAction,
  onImmediate,
  onMessage,
}: BookingCardProps) {
  const config = getBookingStatusConfig(booking);
  const isDone = getBookingStateKey(booking) === 'DONE';
  // TODO(api): include the mentee's review (or a hasFeedback flag) in the booking list so finished
  // cards don't need one request each.
  const { data: myReview } = useQuery({
    queryKey: bookingFeedbackQueryKey(booking.bookingId),
    queryFn: () => reviewRepo.getByBooking(booking.bookingId),
    enabled: isDone,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  if (isActionableExpiry) {
    return <ExpiredBookingCard booking={booking} locale={locale} onDismiss={onDismissExpiry} />;
  }
  if (config.tone === 'ended') return <EndedBookingCard booking={booking} locale={locale} />;

  const tone = BOOKING_TONES[config.tone];
  const mentor = getMentorName(booking);
  const actions = getBookingActions(booking);
  const showNext =
    (config.tone === 'pending' || config.tone === 'payment' || config.tone === 'action') &&
    config.nextText;
  const next = showNext ? config.nextText?.(mentor) : undefined;
  const reviewHref = canReviewBooking(booking)
    ? bookingReviewHref(locale, booking.bookingId)
    : undefined;
  const rebookHref = myReview ? mentorProfileHref(locale, booking) : undefined;
  // Reviewing (or rebooking after a review) replaces any other primary action on this card.
  const showPrimary = Boolean(actions.primary) && !reviewHref && !rebookHref;

  const runPrimary = () => {
    const primary = actions.primary;
    if (!primary || ('disabled' in primary && primary.disabled)) return;
    if (primary.kind === 'pay') onImmediate({ type: 'pay' });
    if (primary.kind === 'checkIn') onImmediate({ type: 'checkIn' });
    if (primary.kind === 'confirm') onAction('confirm');
    if (primary.kind === 'join') {
      window.open(booking.meetingLink || '', '_blank', 'noopener,noreferrer');
    }
  };
  const primaryIcon = {
    pay: <CreditCard />,
    confirm: <CheckCircle2 />,
    join: <Video />,
    checkIn: <LogIn />,
  };

  return (
    <article className={styles.card} id={bookingAnchorId(booking.bookingId)}>
      <CardTop booking={booking} locale={locale} />

      <BookingProgress booking={booking} reviewHref={reviewHref} />

      {reviewHref ? (
        <ReviewPromptBox mentor={mentor} reviewHref={reviewHref} />
      ) : (
        next && (
          <div
            className={styles.nextBox}
            style={{ background: tone.bg, borderColor: tone.border ?? tone.bg, color: tone.text }}
          >
            <Info aria-hidden="true" />
            <p style={{ margin: 0 }}>
              <strong>{next.title}</strong> {next.detail}
            </p>
          </div>
        )
      )}

      {myReview && <MyReviewBox review={myReview} />}

      <footer className={styles.footer}>
        {/* No booking detail route/modal exists yet, so "Xem chi tiết" is intentionally omitted. */}
        <div className={styles.footerActions}>
          {actions.canCancel && (
            <button
              type="button"
              className={`${styles.btn} ${styles.btnGhostDanger}`}
              onClick={(event) => onAction('cancel', event.currentTarget)}
            >
              {actions.cancelLabel}
            </button>
          )}
          {actions.canRespondIssue && (
            <button
              type="button"
              className={`${styles.btn} ${styles.btnOutline}`}
              onClick={() => onAction('respondIssue')}
            >
              Phản hồi vấn đề
            </button>
          )}
          {actions.canReportIssue && (
            <button
              type="button"
              className={`${styles.btn} ${styles.btnOutline}`}
              onClick={() => onAction('reportIssue')}
            >
              <AlertTriangle aria-hidden="true" />
              Báo vấn đề
            </button>
          )}
          {actions.canCheckIn && (
            <button
              type="button"
              className={`${styles.btn} ${styles.btnOutline}`}
              onClick={() => onImmediate({ type: 'checkIn' })}
            >
              <LogIn aria-hidden="true" />
              Check-in
            </button>
          )}
          {actions.canMessage && (
            <button
              type="button"
              className={`${styles.btn} ${styles.btnOutline}`}
              onClick={onMessage}
            >
              <MessageCircle aria-hidden="true" />
              Nhắn mentor
            </button>
          )}
          {reviewHref && (
            <Link className={`${styles.btn} ${styles.btnPrimary}`} href={reviewHref}>
              <Star aria-hidden="true" />
              Đánh giá buổi học
            </Link>
          )}
          {rebookHref && (
            <Link className={`${styles.btn} ${styles.btnPrimary}`} href={rebookHref}>
              <RotateCcw aria-hidden="true" />
              Đặt lại với {mentor}
            </Link>
          )}
          {showPrimary && actions.primary && (
            <button
              type="button"
              className={`${styles.btn} ${styles.btnPrimary}`}
              disabled={'disabled' in actions.primary && actions.primary.disabled}
              onClick={runPrimary}
            >
              {primaryIcon[actions.primary.kind]}
              {actions.primary.label}
            </button>
          )}
        </div>
      </footer>
    </article>
  );
}
