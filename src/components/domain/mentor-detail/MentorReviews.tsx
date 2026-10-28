/**
 * @file MentorReviews.tsx
 * @description "Đánh giá" tab of the mentor profile: rating summary from the public profile and the
 * paged list of mentee reviews.
 */

'use client';

import { useState } from 'react';
import { MessageSquareText } from 'lucide-react';
import { formatMentorRating } from '@/components/domain/mentor-card/MentorCard';
import { Button } from '@/components/ui/Button';
import { SelectField } from '@/components/ui/SelectField';
import { StarDisplay } from '@/components/ui/StarDisplay';
import type { MentorReviewResponse } from '@/models/auth';
import { useAuth } from '@/providers/AuthProvider';
import { useMentorReviews, type MentorReviewSort } from './useMentorReviews';

/** Comments longer than this start collapsed behind "Xem thêm". */
const LONG_COMMENT = 280;

const SORT_OPTIONS: Array<{ value: MentorReviewSort; label: string }> = [
  { value: 'new', label: 'Mới nhất trước' },
  { value: 'old', label: 'Cũ nhất trước' },
];

export interface MentorReputation {
  ratingAverage?: number | null;
  reviewCount?: number;
  completedSessions?: number;
}

interface MentorReviewsProps {
  mentorUserId?: string;
  mentorName: string;
  reputation?: MentorReputation;
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(-2)
    .join('')
    .toUpperCase();
}

function formatReviewDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ''
    : new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(date);
}

function ReviewItem({ review }: { review: MentorReviewResponse }) {
  const comment = review.comment?.trim();
  const isLong = Boolean(comment && comment.length > LONG_COMMENT);
  const [isExpanded, setIsExpanded] = useState(false);
  const commentId = `review-comment-${review.reviewId}`;

  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-solid border-slate-200/80 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {review.reviewerAvatarUrl ? (
            <img
              src={review.reviewerAvatarUrl}
              alt=""
              className="h-10 w-10 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span
              aria-hidden="true"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-light text-xs font-bold text-primary"
            >
              {initials(review.reviewerDisplayName || 'M')}
            </span>
          )}
          <div className="min-w-0">
            <strong className="block truncate text-sm font-bold text-text-main">
              {review.reviewerDisplayName || 'Mentee'}
            </strong>
            <time dateTime={review.createdAt} className="text-xs text-text-muted">
              {formatReviewDate(review.createdAt)}
            </time>
          </div>
        </div>
        <StarDisplay rating={review.rating} size={15} className="shrink-0 pt-1" />
      </div>
      {comment && (
        <div className="flex flex-col items-start gap-1">
          <p
            id={commentId}
            className={`m-0 text-sm leading-relaxed whitespace-pre-line text-text-secondary ${
              isLong && !isExpanded ? 'line-clamp-4' : ''
            }`}
          >
            {comment}
          </p>
          {isLong && (
            <button
              type="button"
              aria-expanded={isExpanded}
              aria-controls={commentId}
              onClick={() => setIsExpanded((value) => !value)}
              className="min-h-11 cursor-pointer border-0 bg-transparent p-0 text-sm font-semibold text-primary hover:text-primary-hover"
            >
              {isExpanded ? 'Thu gọn' : 'Xem thêm'}
            </button>
          )}
        </div>
      )}
    </li>
  );
}

/** Count per star, only when every review is loaded (there is no summary endpoint). */
function StarBreakdown({ reviews }: { reviews: MentorReviewResponse[] }) {
  const total = reviews.length;
  return (
    <ul
      className="m-0 flex w-full list-none flex-col gap-1.5 p-0 text-xs"
      aria-label="Phân bố số sao"
    >
      {[5, 4, 3, 2, 1].map((stars) => {
        const count = reviews.filter((review) => review.rating === stars).length;
        return (
          <li key={stars} className="grid grid-cols-[3rem_minmax(0,1fr)_2rem] items-center gap-2">
            <span className="text-text-secondary">{stars} sao</span>
            <span aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-slate-100">
              <span
                className="block h-full rounded-full bg-amber-500"
                style={{ width: `${total ? (count / total) * 100 : 0}%` }}
              />
            </span>
            <span className="text-right font-semibold text-text-main">{count}</span>
          </li>
        );
      })}
    </ul>
  );
}

export function MentorReviews({ mentorUserId, mentorName, reputation }: MentorReviewsProps) {
  const { showAuthRequiredModal } = useAuth();
  const [sort, setSort] = useState<MentorReviewSort>('new');
  const {
    reviews,
    total,
    isComplete,
    needsLogin,
    isLoading,
    isError,
    hasMore,
    isLoadingMore,
    loadMore,
    retry,
  } = useMentorReviews(mentorUserId, sort);

  const reviewCount = total ?? reputation?.reviewCount ?? 0;
  const average = reputation?.ratingAverage;
  const completed = reputation?.completedSessions;

  return (
    <section
      id="mentor-reviews"
      className="flex flex-col gap-4 rounded-2xl"
      aria-labelledby="mentor-reviews-title"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2
          id="mentor-reviews-title"
          className="m-0 text-xl font-extrabold tracking-tight text-text-main"
        >
          Đánh giá từ mentee
        </h2>
        {!needsLogin && reviewCount > 1 && (
          <div className="w-44">
            <SelectField
              placeholder="Sắp xếp đánh giá"
              triggerClassName="h-10 text-sm"
              value={sort}
              onValueChange={(value) => setSort(value as MentorReviewSort)}
              options={SORT_OPTIONS}
            />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-5 rounded-2xl border border-solid border-slate-200/80 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:p-6">
        <div className="flex shrink-0 flex-col items-start gap-1 sm:min-w-44">
          {average !== null && average !== undefined && reviewCount > 0 ? (
            <>
              <span className="text-4xl leading-none font-extrabold text-text-main">
                {formatMentorRating(average)}
                <span className="text-base font-semibold text-text-muted"> / 5</span>
              </span>
              <StarDisplay
                rating={Math.round(average)}
                size={18}
                label={`Trung bình ${formatMentorRating(average)} trên 5 sao`}
              />
              <span className="text-sm text-text-secondary">{reviewCount} đánh giá</span>
            </>
          ) : (
            <>
              <span className="text-base font-bold text-text-main">Chưa có đánh giá</span>
              <span className="text-sm text-text-secondary">
                {mentorName} chưa có đánh giá từ mentee.
              </span>
            </>
          )}
          {completed !== undefined && completed > 0 && (
            <span className="text-sm text-text-secondary">{completed} buổi đã hoàn thành</span>
          )}
        </div>
        {isComplete && reviews.length > 0 && (
          // TODO(api): a rating summary (count per star) on the mentor profile; until then the
          // breakdown only shows once every review is loaded, so it is never computed from a page.
          <div className="w-full border-0 border-solid border-slate-100 pt-4 sm:border-l sm:pt-0 sm:pl-6">
            <StarBreakdown reviews={reviews} />
          </div>
        )}
      </div>

      {needsLogin ? (
        reviewCount > 0 && (
          <div className="flex flex-col items-start gap-3 rounded-2xl border border-dashed border-primary-border bg-primary-light/50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="m-0 text-sm text-text-secondary">
              Đăng nhập để đọc chi tiết {reviewCount} đánh giá từ mentee.
            </p>
            <Button
              type="button"
              onClick={() =>
                showAuthRequiredModal('Bạn cần đăng nhập để xem chi tiết đánh giá của Mentor.')
              }
            >
              Đăng nhập
            </Button>
          </div>
        )
      ) : isLoading ? (
        <ul className="m-0 grid list-none gap-4 p-0 md:grid-cols-2" aria-label="Đang tải đánh giá">
          {[1, 2].map((item) => (
            <li
              key={item}
              className="h-32 animate-pulse rounded-2xl border border-solid border-slate-200/80 bg-white motion-reduce:animate-none"
            />
          ))}
        </ul>
      ) : isError ? (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-white p-5 text-sm text-text-secondary shadow-sm">
          Chưa tải được đánh giá.
          <Button type="button" variant="outline" size="sm" onClick={retry}>
            Thử lại
          </Button>
        </div>
      ) : reviews.length === 0 ? (
        reviewCount === 0 && (
          <div className="flex items-center gap-3 rounded-2xl border border-solid border-slate-200/80 bg-white p-5 text-sm text-text-secondary shadow-sm">
            <MessageSquareText className="h-5 w-5 shrink-0 text-text-muted" aria-hidden="true" />
            Sau mỗi buổi học, mentee có thể để lại đánh giá. Các đánh giá sẽ hiện ở đây.
          </div>
        )
      ) : (
        <>
          <ul className="m-0 grid list-none gap-4 p-0 md:grid-cols-2">
            {reviews.map((review) => (
              <ReviewItem key={review.reviewId} review={review} />
            ))}
          </ul>
          {hasMore && (
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="self-center"
              loading={isLoadingMore}
              onClick={loadMore}
            >
              Xem thêm đánh giá
            </Button>
          )}
        </>
      )}
    </section>
  );
}
