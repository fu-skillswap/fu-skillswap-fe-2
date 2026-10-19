'use client';

import { Check } from 'lucide-react';
import type { MentorBookingResponse } from '@/models/auth';
import {
  BOOKING_TONES,
  type BookingStepId,
  formatRelativeStamp,
  formatDayMonth,
  formatShortWeekday,
  formatTime,
  getBookingPrice,
  getBookingStatusConfig,
  toDate,
} from '../bookingStatusConfig';
import styles from '../MyBookingsView.module.css';

type TrackerStepId = Exclude<BookingStepId, 'complete'>;

interface TrackerStep {
  id: TrackerStepId;
  label: string;
  doneLabel?: string;
}

const BASE_STEPS: TrackerStep[] = [
  { id: 'request', label: 'Gửi yêu cầu' },
  { id: 'accept', label: 'Mentor nhận lịch', doneLabel: 'Mentor đã nhận' },
  { id: 'learn', label: 'Học 1:1' },
  { id: 'review', label: 'Đánh giá' },
];

const PAY_STEP: TrackerStep = { id: 'pay', label: 'Thanh toán', doneLabel: 'Đã thanh toán' };

function getSteps(booking: MentorBookingResponse) {
  if (getBookingPrice(booking) <= 0) return BASE_STEPS;
  return [...BASE_STEPS.slice(0, 2), PAY_STEP, ...BASE_STEPS.slice(2)];
}

function getSubLine(
  booking: MentorBookingResponse,
  step: TrackerStepId,
  state: 'done' | 'current' | 'future',
) {
  const start = toDate(booking.selectedStartTime);
  const sessionStamp = start
    ? `${formatShortWeekday(start)}, ${formatDayMonth(start)} · ${formatTime(start)}`
    : undefined;

  if (step === 'request') {
    const created = toDate(booking.createdAt);
    return created ? formatRelativeStamp(created) : undefined;
  }
  if (step === 'accept') {
    // TODO(api): expose acceptedAt on MentorBookingResponse to show when the mentor accepted.
    return state === 'current' ? 'Đang chờ phản hồi' : undefined;
  }
  if (step === 'pay') {
    if (state === 'current') return 'Chờ bạn thanh toán';
    return undefined;
  }
  if (step === 'learn') {
    const joinAt = toDate(booking.joinAvailableAt);
    if (state === 'current' && joinAt && joinAt.getTime() > Date.now()) {
      return `Phòng mở lúc ${formatTime(joinAt)}`;
    }
    return state === 'done' && start ? formatDayMonth(start) : sessionStamp;
  }
  return state === 'current' ? 'Chờ bạn đánh giá' : 'Sau buổi học';
}

/** Horizontal progress tracker for an active (non-ended) booking. */
export function BookingProgress({ booking }: { booking: MentorBookingResponse }) {
  const config = getBookingStatusConfig(booking);
  const tone = BOOKING_TONES[config.tone];
  const steps = getSteps(booking);
  const currentIndex =
    config.step === 'complete' ? steps.length : steps.findIndex((step) => step.id === config.step);

  return (
    <ol className={styles.tracker} aria-label="Tiến trình buổi học">
      {steps.map((step, index) => {
        const state = index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'future';
        const subLine = getSubLine(booking, step.id, state);
        const isLast = index === steps.length - 1;
        return (
          <li
            className={`${styles.step} ${state === 'current' ? styles.stepCurrent : ''}`}
            key={step.id}
            aria-current={state === 'current' ? 'step' : undefined}
          >
            {!isLast && (
              <span
                className={`${styles.stepConnector} ${state === 'done' ? styles.stepConnectorDone : ''}`}
                aria-hidden="true"
              />
            )}
            <span
              className={`${styles.stepMarker} ${state === 'done' ? styles.stepMarkerDone : ''} ${state === 'current' ? styles.stepMarkerCurrent : ''}`}
              style={state === 'current' ? { borderColor: tone.dot ?? tone.text } : undefined}
              aria-hidden="true"
            >
              {state === 'done' && <Check strokeWidth={3} />}
              {state === 'current' && (
                <span
                  className={styles.stepMarkerDot}
                  style={{ background: tone.dot ?? tone.text }}
                />
              )}
            </span>
            <span
              className={`${styles.stepLabel} ${state === 'future' ? styles.stepLabelFuture : ''}`}
              style={state === 'current' ? { color: tone.text } : undefined}
            >
              {state === 'done' && step.doneLabel ? step.doneLabel : step.label}
              <span className={styles.srOnly}>
                {state === 'done' ? ' (đã xong)' : state === 'current' ? ' (bước hiện tại)' : ''}
              </span>
            </span>
            {subLine && <span className={styles.stepSub}>{subLine}</span>}
          </li>
        );
      })}
    </ol>
  );
}
