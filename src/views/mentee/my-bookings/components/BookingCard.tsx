'use client';

import Link from 'next/link';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  CreditCard,
  Info,
  LogIn,
  MessageCircle,
  Monitor,
  Video,
  Wallet,
} from 'lucide-react';
import type { MentorBookingResponse } from '@/models/auth';
import type { MenteeBookingMutation } from '../useMyBookings';
import {
  BOOKING_TONES,
  formatDayMonth,
  formatTimeRange,
  formatWeekday,
  getBookingActions,
  getBookingPrice,
  getBookingStatusConfig,
  getMentorName,
  getPlatformLabel,
  isBookingPaid,
  toDate,
} from '../bookingStatusConfig';
import { BookingProgress } from './BookingProgress';
import { BookingStatusPill } from './BookingStatusPill';
import styles from '../MyBookingsView.module.css';

export type BookingFormAction = 'cancel' | 'confirm' | 'reportIssue' | 'respondIssue';

interface BookingCardProps {
  booking: MentorBookingResponse;
  locale: string;
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

/** Compact, greyed card for canceled / rejected / expired bookings. */
function EndedBookingCard({ booking, locale }: { booking: MentorBookingResponse; locale: string }) {
  const config = getBookingStatusConfig(booking);
  const reason = booking.cancelReason?.trim() || booking.rejectReason?.trim();
  const rebookHref = mentorProfileHref(locale, booking);
  // TODO(api): expose canceledAt/rejectedAt so the line can read "Bạn đã hủy lúc HH:mm, dd/MM".
  return (
    <article className={styles.compact}>
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
      </div>
      <div className={styles.compactRight}>
        <BookingStatusPill booking={booking} />
        {rebookHref && (
          <Link className={styles.link} href={rebookHref}>
            Đặt lại
          </Link>
        )}
      </div>
    </article>
  );
}

export function BookingCard({
  booking,
  locale,
  onAction,
  onImmediate,
  onMessage,
}: BookingCardProps) {
  const config = getBookingStatusConfig(booking);
  if (config.tone === 'ended') return <EndedBookingCard booking={booking} locale={locale} />;

  const tone = BOOKING_TONES[config.tone];
  const mentor = getMentorName(booking);
  const actions = getBookingActions(booking);
  const profileHref = mentorProfileHref(locale, booking);
  const price = getBookingPrice(booking);
  const timeRange = formatTimeRange(booking);
  const platform = getPlatformLabel(booking);
  const showNext =
    (config.tone === 'pending' || config.tone === 'payment' || config.tone === 'action') &&
    config.nextText;
  const next = showNext ? config.nextText?.(mentor) : undefined;

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

  const mentorRow = (
    <>
      <MentorAvatar booking={booking} />
      <span className={styles.mentorName}>{mentor}</span>
      <span className={styles.mentorRole}>· Mentor</span>
    </>
  );

  return (
    <article className={styles.card}>
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

      <BookingProgress booking={booking} />

      {next && (
        <div
          className={styles.nextBox}
          style={{ background: tone.bg, borderColor: tone.border ?? tone.bg, color: tone.text }}
        >
          <Info aria-hidden="true" />
          <p style={{ margin: 0 }}>
            <strong>{next.title}</strong> {next.detail}
          </p>
        </div>
      )}

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
          {actions.primary && (
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
