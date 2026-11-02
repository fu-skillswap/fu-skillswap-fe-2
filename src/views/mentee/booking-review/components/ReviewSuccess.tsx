/**
 * @file ReviewSuccess.tsx
 * @description Shown in place of the form once the review is saved, and read-only when the
 * booking was already reviewed.
 */

import Link from 'next/link';
import { RotateCcw } from 'lucide-react';
import { StarDisplay } from '@/components/ui/StarDisplay';
import type { SessionFeedbackResponse } from '@/models/review';
import styles from '../BookingReviewView.module.css';

interface ReviewSuccessProps {
  review: SessionFeedbackResponse;
  mentor: string;
  rebookHref?: string;
  listHref: string;
  /** Just submitted on this visit: play KooKoo's pop-in once. */
  justSubmitted: boolean;
}

const LINK_BUTTON =
  'inline-flex h-12 items-center justify-center gap-2.5 rounded-2xl border border-solid px-6 text-sm font-bold whitespace-nowrap no-underline transition-colors outline-none focus-visible:ring-4 focus-visible:ring-primary/20';

export function ReviewSuccess({
  review,
  mentor,
  rebookHref,
  listHref,
  justSubmitted,
}: ReviewSuccessProps) {
  const comment = review.comment?.trim();
  return (
    <section
      role="status"
      className="flex flex-col items-center gap-4 rounded-[20px] border border-solid border-border-color bg-white px-5 py-10 text-center shadow-xs sm:px-10"
    >
      <img
        src="/images/Koko.png"
        alt=""
        aria-hidden="true"
        className={`h-24 w-24 object-contain ${justSubmitted ? styles.popIn : ''}`}
      />
      <h2 className="m-0 text-xl font-bold text-text-main">Đã gửi đánh giá</h2>
      <StarDisplay
        rating={review.rating}
        size={28}
        label={`Bạn đã chấm ${review.rating} trên 5 sao`}
      />
      {comment && (
        <p className="m-0 max-w-md text-sm whitespace-pre-line text-text-secondary">{comment}</p>
      )}
      <p className="m-0 max-w-md text-sm leading-relaxed text-text-secondary">
        Cảm ơn bạn. Đánh giá đã hiện trên hồ sơ của {mentor} và buổi học chuyển sang &quot;Đã
        học&quot;.
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-2.5">
        {rebookHref && (
          <Link
            href={rebookHref}
            className={`${LINK_BUTTON} border-primary bg-primary text-white hover:bg-primary-hover`}
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Đặt lại với {mentor}
          </Link>
        )}
        <Link
          href={listHref}
          className={`${LINK_BUTTON} border-primary-border bg-white text-primary hover:bg-primary-light`}
        >
          Về Booking của tôi
        </Link>
      </div>
    </section>
  );
}
