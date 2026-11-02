/**
 * @file ReviewSummaryCard.tsx
 * @description Left column of the review page: what session is being reviewed, plus KooKoo's note.
 */

import type { MentorBookingResponse } from '@/models/auth';
import {
  BOOKING_TONES,
  formatFullDate,
  formatTimeRange,
  getBookingPrice,
  getBookingStatusConfig,
  getMentorName,
  getPlatformLabel,
  toDate,
} from '@/views/mentee/my-bookings/bookingStatusConfig';

interface ReviewSummaryCardProps {
  booking: MentorBookingResponse;
  /** The review is saved: show "Đã học" even before the booking itself is refetched. */
  isReviewed: boolean;
}

export function ReviewSummaryCard({ booking, isReviewed }: ReviewSummaryCardProps) {
  const config = getBookingStatusConfig(booking);
  const tone = BOOKING_TONES[isReviewed ? 'done' : config.tone];
  const label = isReviewed ? 'Đã học' : config.label;
  const mentor = getMentorName(booking);
  const start = toDate(booking.selectedStartTime);
  const price = getBookingPrice(booking);
  const details = [
    { term: 'Ngày học', value: start ? formatFullDate(start) : undefined },
    { term: 'Giờ', value: formatTimeRange(booking) },
    { term: 'Nền tảng', value: getPlatformLabel(booking) },
    { term: 'Chi phí', value: price > 0 ? `${price} S-coins` : 'Miễn phí' },
  ].filter((item): item is { term: string; value: string } => Boolean(item.value));

  return (
    <div className="flex flex-col gap-4">
      <section
        aria-label="Thông tin buổi học"
        className="flex flex-col gap-4 rounded-[20px] border border-solid border-border-color bg-white p-5 shadow-xs"
      >
        <span
          className="inline-flex items-center gap-1.5 self-start rounded-full px-2.5 py-1 text-xs font-bold"
          style={{ background: tone.bg, color: tone.text }}
        >
          {tone.dot && (
            <span
              aria-hidden="true"
              className="h-2 w-2 rounded-full"
              style={{ background: tone.dot }}
            />
          )}
          {label}
        </span>
        <h2 className="m-0 text-lg font-bold text-text-main">
          {booking.serviceTitle || 'Buổi mentoring'}
        </h2>
        <div className="flex items-center gap-3">
          {booking.mentorAvatarUrl ? (
            <img
              src={booking.mentorAvatarUrl}
              alt=""
              className="h-11 w-11 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span
              aria-hidden="true"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-light font-bold text-primary"
            >
              {mentor.charAt(0).toUpperCase()}
            </span>
          )}
          <span className="min-w-0">
            <b className="block truncate text-sm text-text-main">{mentor}</b>
            <span className="text-xs text-text-muted">Mentor</span>
          </span>
        </div>
        <dl className="m-0 grid gap-2.5 border-0 border-t border-solid border-border-light pt-4 text-sm">
          {details.map(({ term, value }) => (
            <div key={term} className="flex justify-between gap-4">
              <dt className="text-text-muted">{term}</dt>
              <dd className="m-0 text-right font-semibold text-text-main">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="flex items-end gap-2">
        <img
          src="/images/Koko.png"
          alt=""
          aria-hidden="true"
          className="h-16 w-16 shrink-0 object-contain"
        />
        <p className="m-0 mb-2 rounded-2xl rounded-bl-sm border border-solid border-[#cfe5fb] bg-white px-3.5 py-2.5 text-[13px] leading-5 text-text-secondary">
          Đánh giá thật giúp bạn khác chọn đúng người, và giúp mentor biết cần làm tốt hơn ở đâu.
        </p>
      </div>
    </div>
  );
}
