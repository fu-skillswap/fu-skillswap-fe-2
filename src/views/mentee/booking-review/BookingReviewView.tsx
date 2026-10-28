/**
 * @file BookingReviewView.tsx
 * @description "Đánh giá buổi học" page for one booking: summary on the left, the review form (or
 * the saved review) on the right. Entry points: booking card, tracker step and notifications.
 */

'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { useMenteeShell } from '@/components/domain/mentee-shell/MenteeShell';
import { Button } from '@/components/ui/Button';
import {
  canReviewBooking,
  getBookingStatusConfig,
  getMentorName,
  toDate,
} from '@/views/mentee/my-bookings/bookingStatusConfig';
import { ReviewForm } from './components/ReviewForm';
import { ReviewSuccess } from './components/ReviewSuccess';
import { ReviewSummaryCard } from './components/ReviewSummaryCard';
import { useBookingReview } from './useBookingReview';

interface BookingReviewViewProps {
  locale: string;
  bookingId: string;
  /** Star count picked on the booking card (`?rating=`), 0 when none. */
  initialRating: number;
}

function Notice({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mx-auto flex max-w-xl flex-col items-center gap-2 rounded-3xl border border-solid border-border-color bg-white px-6 py-12 text-center">
      <img src="/images/Koko.png" alt="" aria-hidden="true" className="h-16 w-16 object-contain" />
      <h1 className="m-0 mt-2 text-lg font-bold text-text-main">{title}</h1>
      {children}
    </section>
  );
}

export function BookingReviewView({ locale, bookingId, initialRating }: BookingReviewViewProps) {
  const { setHeaderTitle } = useMenteeShell();
  const { booking, review, isLoading, isNotFound, loadError, retry, submit } =
    useBookingReview(bookingId);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const listHref = `/${locale}/my-bookings`;

  useEffect(() => {
    setHeaderTitle('Đánh giá buổi học');
    return () => setHeaderTitle(undefined);
  }, [setHeaderTitle]);

  const backLink = (
    <Link
      href={listHref}
      className="mt-3 inline-flex h-11 items-center rounded-xl bg-primary px-4 text-sm font-bold text-white no-underline hover:bg-primary-hover"
    >
      Về Booking của tôi
    </Link>
  );

  if (isLoading) {
    return (
      <div
        className="mx-auto grid max-w-5xl gap-5 min-[900px]:grid-cols-[minmax(0,360px)_minmax(0,1fr)]"
        aria-label="Đang tải buổi học"
      >
        <div className="h-80 animate-pulse rounded-[20px] bg-slate-100 motion-reduce:animate-none" />
        <div className="h-[28rem] animate-pulse rounded-[20px] bg-slate-100 motion-reduce:animate-none" />
      </div>
    );
  }

  if (isNotFound) {
    return (
      <Notice title="Không tìm thấy buổi học">
        <p className="m-0 max-w-sm text-sm text-text-secondary">
          Buổi học có thể không tồn tại hoặc không thuộc tài khoản của bạn.
        </p>
        {backLink}
      </Notice>
    );
  }

  if (!booking || loadError) {
    return (
      <Notice title="Chưa tải được buổi học">
        <p className="m-0 max-w-sm text-sm text-text-secondary">
          Kết nối có thể đang chập chờn. Bạn thử tải lại nhé.
        </p>
        <Button type="button" variant="outline" className="mt-3" onClick={retry}>
          Thử lại
        </Button>
      </Notice>
    );
  }

  const mentor = getMentorName(booking);
  const rebookHref = booking.mentorUserId
    ? `/${locale}/mentor-booking?mentorId=${encodeURIComponent(booking.mentorUserId)}`
    : undefined;
  const end = toDate(booking.selectedEndTime);
  const hasEnded = Boolean(end && end.getTime() <= Date.now());
  // Still running or waiting for a step (confirm, issue): reviewing opens up later. Finished
  // without a review window, or canceled / rejected / expired: never.
  const tone = getBookingStatusConfig(booking).tone;
  const canReviewLater = !hasEnded || (tone !== 'done' && tone !== 'ended');

  let content: ReactNode;
  if (review) {
    content = (
      <ReviewSuccess
        review={review}
        mentor={mentor}
        rebookHref={rebookHref}
        listHref={listHref}
        justSubmitted={justSubmitted}
      />
    );
  } else if (canReviewBooking(booking)) {
    content = (
      <ReviewForm
        booking={booking}
        locale={locale}
        initialRating={initialRating}
        isSubmitting={submit.isPending}
        submitError={submit.isError ? 'Chưa gửi được đánh giá. Thử lại sau.' : undefined}
        onSubmit={(submission) =>
          submit.mutate(submission, { onSuccess: () => setJustSubmitted(true) })
        }
      />
    );
  } else {
    content = (
      <section className="flex flex-col items-start gap-2 rounded-[20px] border border-solid border-border-color bg-white p-6 shadow-xs">
        <p className="m-0 text-sm font-semibold text-text-main">
          {canReviewLater
            ? 'Bạn có thể đánh giá sau khi buổi học kết thúc.'
            : 'Buổi học này không thể đánh giá.'}
        </p>
        <Link href={listHref} className="text-sm font-bold text-primary hover:text-primary-hover">
          Về Booking của tôi
        </Link>
      </section>
    );
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5">
      <nav aria-label="Breadcrumb">
        <ol className="m-0 flex list-none flex-wrap items-center gap-1.5 p-0 text-sm">
          <li>
            <Link href={listHref} className="font-semibold text-primary hover:text-primary-hover">
              Booking của tôi
            </Link>
          </li>
          <li aria-hidden="true" className="flex text-text-muted">
            <ChevronRight className="h-4 w-4" />
          </li>
          <li aria-current="page" className="font-semibold text-text-main">
            Đánh giá buổi học
          </li>
        </ol>
      </nav>
      <h1 className="sr-only">Đánh giá buổi học</h1>
      <div className="grid items-start gap-5 min-[900px]:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
        <ReviewSummaryCard booking={booking} isReviewed={Boolean(review)} />
        {content}
      </div>
    </div>
  );
}
