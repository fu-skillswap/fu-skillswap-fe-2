/**
 * @file ReviewForm.tsx
 * @description Right column of the review page: stars, tag chips, comment, live preview and submit.
 * Submit is never disabled up front; a missing rating is explained and focused instead.
 */

'use client';

import { useRouter } from 'next/navigation';
import { AlertTriangle, Send } from 'lucide-react';
import { useId, useRef, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { StarDisplay } from '@/components/ui/StarDisplay';
import { TextArea } from '@/components/ui/TextArea';
import { CONTACT_EMAIL } from '@/constants/contact';
import type { MentorBookingResponse } from '@/models/auth';
import { getMentorName } from '@/views/mentee/my-bookings/bookingStatusConfig';
import {
  REVIEW_COMMENT_MAX_LENGTH,
  REVIEW_INCIDENT_MAX_RATING,
  REVIEW_TAG_GROUPS,
  tagGroupOf,
} from '../review.constants';
import type { ReviewSubmission } from '../useBookingReview';
import { RatingStars, type RatingStarsHandle } from './RatingStars';

const pad = (value: number) => String(value).padStart(2, '0');

interface ReviewFormProps {
  booking: MentorBookingResponse;
  locale: string;
  initialRating: number;
  isSubmitting: boolean;
  submitError?: string;
  onSubmit: (submission: ReviewSubmission) => void;
}

export function ReviewForm({
  booking,
  locale,
  initialRating,
  isSubmitting,
  submitError,
  onSubmit,
}: ReviewFormProps) {
  const router = useRouter();
  const ids = useId();
  const questionId = `${ids}-question`;
  const ratingErrorId = `${ids}-rating-error`;
  const starsRef = useRef<RatingStarsHandle>(null);
  const [rating, setRating] = useState(initialRating);
  const [tags, setTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [showRatingError, setShowRatingError] = useState(false);

  const mentor = getMentorName(booking);
  const listHref = `/${locale}/my-bookings`;
  const tagGroup = rating ? REVIEW_TAG_GROUPS[tagGroupOf(rating)] : undefined;
  // The card's "Báo vấn đề" is the existing incident flow; otherwise fall back to support mail.
  // TODO(api): link straight to the incident form once it has its own route.
  const incidentHref = booking.canReportIssue
    ? `${listHref}#booking-${encodeURIComponent(booking.bookingId)}`
    : `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`Báo sự cố buổi học ${booking.bookingId}`)}`;
  const now = new Date();

  const changeRating = (next: number) => {
    // Positive and negative tags never mix: switching group clears the picks.
    if (rating && tagGroupOf(rating) !== tagGroupOf(next)) setTags([]);
    setRating(next);
    setShowRatingError(false);
  };

  const toggleTag = (tag: string) =>
    setTags((current) =>
      current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag],
    );

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;
    if (!rating) {
      setShowRatingError(true);
      starsRef.current?.focus();
      return;
    }
    onSubmit({ rating, comment });
  };

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className="flex flex-col gap-6 rounded-[20px] border border-solid border-border-color bg-white p-5 shadow-xs sm:p-7"
    >
      <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
        <legend id={questionId} className="mb-2 p-0 text-lg font-bold text-text-main">
          Buổi học với {mentor} thế nào?
        </legend>
        <RatingStars
          ref={starsRef}
          value={rating}
          onChange={changeRating}
          labelledBy={questionId}
          describedBy={showRatingError ? ratingErrorId : undefined}
        />
        {showRatingError && (
          <p id={ratingErrorId} role="alert" className="m-0 text-sm font-semibold text-danger">
            Chọn số sao cho buổi học trước khi gửi.
          </p>
        )}
      </fieldset>

      {tagGroup && (
        <fieldset className="m-0 flex flex-col gap-2.5 border-0 p-0">
          <legend className="mb-2.5 p-0 text-sm font-bold text-text-main">
            {tagGroup.question}
          </legend>
          {/* TODO(api): tags are not stored by POST /feedback yet, so they are not sent. */}
          <div className="flex flex-wrap gap-2">
            {tagGroup.tags.map((tag) => {
              const pressed = tags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  aria-pressed={pressed}
                  onClick={() => toggleTag(tag)}
                  className={`min-h-11 cursor-pointer rounded-full border border-solid px-4 text-sm font-semibold transition-colors outline-none focus-visible:ring-4 focus-visible:ring-primary/25 ${
                    pressed
                      ? 'border-primary bg-primary text-white'
                      : 'border-[#cfe5fb] bg-primary-light text-text-main hover:border-primary'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <TextArea
        id={`${ids}-comment`}
        label={
          <>
            Viết vài dòng <span className="font-normal text-text-muted">(Không bắt buộc)</span>
          </>
        }
        value={comment}
        maxLength={REVIEW_COMMENT_MAX_LENGTH}
        onChange={(event) => setComment(event.target.value)}
        placeholder="Ví dụ: Anh giải thích JOIN rất dễ hiểu, cho mình bộ đề để luyện thêm."
        helperText={`${comment.length}/${REVIEW_COMMENT_MAX_LENGTH}`}
        className="text-sm"
        rows={4}
      />

      {/* TODO(api): "Hiện tên của tôi trong đánh giá" (off → "Mentee ẩn danh") needs an anonymity
          field on POST /feedback; the checkbox stays hidden until the backend keeps that choice. */}

      {rating > 0 && rating <= REVIEW_INCIDENT_MAX_RATING && (
        <p className="m-0 flex gap-2.5 rounded-2xl border border-solid border-orange-200 bg-orange-50 p-3.5 text-sm leading-relaxed text-orange-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            Mentor vào trễ, không vào buổi học hay gặp sự cố khác?{' '}
            <a href={incidentHref} className="font-bold text-orange-900 underline">
              Báo sự cố
            </a>{' '}
            để nhóm hỗ trợ xem xét hoàn S-coin. Đánh giá chỉ để chia sẻ trải nghiệm.
          </span>
        </p>
      )}

      {rating > 0 && (
        <section
          aria-label={`Xem trước trên hồ sơ của ${mentor}`}
          className="flex flex-col gap-2 rounded-2xl bg-surface-subtle p-4"
        >
          <h3 className="m-0 text-xs font-bold tracking-wide text-text-muted uppercase">
            Xem trước trên hồ sơ của {mentor}
          </h3>
          {/* Mirrors the public review list: reviewer name, stars, date and comment.
              TODO(api): the public review shows the full display name and no service or tags;
              show "Nhi T." / "Mentee ẩn danh", the service and tags once the API supports them. */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <b className="text-text-main">{booking.menteeDisplayName || 'Bạn'}</b>
            <StarDisplay rating={rating} size={14} />
            <span className="text-xs text-text-muted">
              tháng {pad(now.getMonth() + 1)}/{now.getFullYear()}
            </span>
          </div>
          {comment.trim() && (
            <p className="m-0 text-sm whitespace-pre-line text-text-secondary">{comment.trim()}</p>
          )}
        </section>
      )}

      {submitError && (
        <p
          role="alert"
          className="m-0 rounded-xl bg-danger-soft p-3 text-sm font-semibold text-danger"
        >
          {submitError}
        </p>
      )}

      <div className="flex flex-wrap justify-end gap-2.5 border-0 border-t border-solid border-border-light pt-5">
        <Button
          type="button"
          variant="outline"
          size="lg"
          disabled={isSubmitting}
          onClick={() => router.push(listHref)}
        >
          Để sau
        </Button>
        <Button
          type="submit"
          size="lg"
          loading={isSubmitting}
          leftIcon={<Send className="h-4 w-4" aria-hidden="true" />}
        >
          {isSubmitting ? 'Đang gửi…' : 'Gửi đánh giá'}
        </Button>
      </div>
    </form>
  );
}
