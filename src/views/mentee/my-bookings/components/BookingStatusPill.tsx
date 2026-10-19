'use client';

import type { MentorBookingResponse } from '@/models/auth';
import { BOOKING_TONES, getBookingStatusConfig } from '../bookingStatusConfig';
import styles from '../MyBookingsView.module.css';

/** Mentee booking status pill: 8px tone dot + Vietnamese label from the shared status config. */
export function BookingStatusPill({ booking }: { booking: MentorBookingResponse }) {
  const config = getBookingStatusConfig(booking);
  const tone = BOOKING_TONES[config.tone];
  return (
    <span
      className={styles.pill}
      style={{ background: tone.bg, color: tone.text, borderColor: tone.border ?? tone.bg }}
    >
      {tone.dot && (
        <span className={styles.pillDot} style={{ background: tone.dot }} aria-hidden="true" />
      )}
      {config.label}
    </span>
  );
}
