/**
 * @file MentorDashboardView.tsx
 * @description Bảng điều khiển dành cho Mentor.
 */

'use client';

import { BookingStatusBadge } from '@/components/ui/BookingStatusBadge';
import { Button } from '@/components/ui/Button';
import type { MentorBookingResponse, MentorReviewResponse } from '@/models/auth';
import { useAuth } from '@/providers/AuthProvider';
import {
  ArrowRight,
  Banknote,
  CalendarDays,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Hand,
  RefreshCw,
  Settings,
  Star,
  Users,
  Video,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { useMentorDashboard, type DailyIncome } from './useMentorDashboard';

type MetricTone = 'income' | 'booking' | 'rating' | 'mentee';

const numberFormatter = new Intl.NumberFormat('vi-VN');

function formatScoin(value: number) {
  return `${numberFormatter.format(value)} S-coins`;
}

function formatSessionTime(start: string, end: string) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime())) return start;
  const day = new Intl.DateTimeFormat('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  }).format(startDate);
  const time = new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const endLabel = Number.isNaN(endDate.getTime()) ? '' : ` – ${time.format(endDate)}`;
  return `${day}, ${time.format(startDate)}${endLabel}`;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function MentorDashboardView({ locale }: { locale: string }) {
  const { user } = useAuth();
  const { profile, wallet, reviews, stats, income, failedSections, isLoading, refresh } =
    useMentorDashboard();

  const displayName = profile?.displayName || user?.fullName || 'Mentor';
  const placeholder = isLoading ? '…' : '—';
  const bookingsHref = `/${locale}/mentor/bookings`;

  const quickActions = [
    {
      href: bookingsHref,
      icon: ClipboardCheck,
      label: 'Duyệt yêu cầu đặt lịch',
      count: stats.pendingRequestCount,
    },
    {
      href: `/${locale}/mentor/schedule-manage`,
      icon: Settings,
      label: 'Quản lý Dịch vụ & Lịch dạy',
    },
    { href: bookingsHref, icon: CalendarDays, label: 'Xem tất cả lịch đặt' },
    { href: `/${locale}/mentor/posts?create=1`, icon: FileText, label: 'Tạo bài đăng mới' },
    { href: `/${locale}/mentor/my-courses`, icon: GraduationCap, label: 'Thêm bài học khóa học' },
    { href: `/${locale}/mentor/wallet`, icon: Wallet, label: 'Rút S-coin về tài khoản' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <section className="bg-white p-6 sm:p-8 rounded-3xl border border-solid border-border-light shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-main flex items-center gap-2 m-0">
            Chào mừng trở lại, {displayName}{' '}
            <Hand aria-hidden="true" className="w-7 h-7 text-amber-500 animate-bounce" />
          </h1>
          <p className="text-sm text-text-secondary m-0">
            Dưới đây là tổng quan về hoạt động cố vấn của bạn trong tuần này.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void refresh()}
          disabled={isLoading}
          leftIcon={<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}
        >
          Làm mới
        </Button>
      </section>

      {failedSections.length > 0 && (
        <p
          className="p-4 rounded-2xl bg-danger-soft border border-solid border-red-200 text-danger text-xs font-medium m-0"
          role="alert"
        >
          Không thể tải dữ liệu {failedSections.join(', ')}. Vui lòng bấm &quot;Làm mới&quot; để thử
          lại.
        </p>
      )}

      <section
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        aria-label="Chỉ số hoạt động Mentor"
      >
        <MetricCard
          icon={<Banknote className="w-5 h-5 text-emerald-600" />}
          label="Thu nhập tháng này"
          caption={wallet ? `Số dư ${formatScoin(wallet.availableScoin)}` : 'S-coin'}
          value={wallet ? numberFormatter.format(income.monthTotal) : placeholder}
          tone="income"
        />
        <MetricCard
          icon={<CalendarDays className="w-5 h-5 text-sky-600" />}
          label="Các phiên họp sắp tới"
          caption={
            stats.pendingRequestCount > 0
              ? `${stats.pendingRequestCount} yêu cầu chờ duyệt`
              : 'Đã xác nhận'
          }
          value={isLoading ? placeholder : String(stats.upcomingCount)}
          tone="booking"
        />
        <MetricCard
          icon={<Star className="w-5 h-5 text-amber-500" />}
          label="Đánh giá trung bình"
          caption={`${profile?.reviewCount ?? 0} lượt đánh giá`}
          value={profile?.ratingAverage != null ? profile.ratingAverage.toFixed(1) : placeholder}
          tone="rating"
        />
        <MetricCard
          icon={<Users className="w-5 h-5 text-indigo-600" />}
          label="Tổng số người được hướng dẫn"
          caption={`${stats.completedSessions} buổi đã hoàn thành`}
          value={isLoading ? placeholder : String(stats.menteeCount)}
          tone="mentee"
        />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel
          id="upcoming-bookings-heading"
          title="Đặt chỗ sắp tới"
          action={
            <Link
              href={bookingsHref}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Xem tất cả
            </Link>
          }
        >
          {stats.upcoming.length > 0 ? (
            <ul className="flex flex-col gap-2.5 list-none p-0 m-0">
              {stats.upcoming.map((booking) => (
                <UpcomingBookingItem key={booking.bookingId} booking={booking} />
              ))}
            </ul>
          ) : (
            <EmptyPanel message={isLoading ? 'Đang tải dữ liệu...' : 'Chưa có lịch hẹn sắp tới.'} />
          )}
        </Panel>

        <Panel id="recent-reviews-heading" title="Đánh giá gần đây">
          {reviews.length > 0 ? (
            <ul className="flex flex-col gap-2.5 list-none p-0 m-0">
              {reviews.map((review) => (
                <ReviewItem key={review.reviewId} review={review} />
              ))}
            </ul>
          ) : (
            <EmptyPanel message={isLoading ? 'Đang tải dữ liệu...' : 'Chưa có đánh giá nào.'} />
          )}
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel id="quick-actions-heading" title="Hành động nhanh">
          <div className="grid grid-cols-1 gap-2.5">
            {quickActions.map(({ href, icon: Icon, label, count }) => (
              <Link
                key={label}
                href={href}
                className="flex items-center justify-between p-3.5 rounded-xl border border-solid border-border-color hover:border-primary-border hover:bg-primary-light/50 text-text-main hover:text-primary font-medium text-xs transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className="w-4 h-4 text-text-muted group-hover:text-primary shrink-0"
                    aria-hidden="true"
                  />
                  <span>{label}</span>
                  {!!count && (
                    <span className="min-w-5 h-5 px-1.5 rounded-full bg-primary text-white text-[11px] font-bold inline-flex items-center justify-center">
                      {count}
                    </span>
                  )}
                </div>
                <ArrowRight
                  className="w-4 h-4 text-text-muted group-hover:text-primary shrink-0"
                  aria-hidden="true"
                />
              </Link>
            ))}
          </div>
        </Panel>

        <Panel
          id="income-chart-heading"
          title="Thu nhập — 7 ngày gần nhất"
          action={
            wallet && (
              <span className="text-xs font-semibold text-text-secondary">
                {formatScoin(income.weekTotal)}
              </span>
            )
          }
        >
          {wallet && income.weekTotal > 0 ? (
            <IncomeChart days={income.days} />
          ) : (
            <EmptyPanel
              message={
                isLoading ? 'Đang tải dữ liệu...' : 'Chưa có thu nhập trong 7 ngày gần nhất.'
              }
            />
          )}
        </Panel>
      </div>
    </div>
  );
}

function Panel({
  id,
  title,
  action,
  children,
}: {
  id: string;
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      className="bg-white p-6 rounded-3xl border border-solid border-border-light shadow-xs flex flex-col gap-4"
      aria-labelledby={id}
    >
      <header className="flex items-center justify-between">
        <h2 className="text-base font-bold text-text-main m-0" id={id}>
          {title}
        </h2>
        {action}
      </header>
      {children}
    </section>
  );
}

function UpcomingBookingItem({ booking }: { booking: MentorBookingResponse }) {
  return (
    <li className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-solid border-border-color">
      <div className="flex flex-col gap-1 min-w-0">
        <strong className="text-sm font-bold text-text-main truncate">
          {booking.learningGoalTitle || booking.serviceTitle || 'Buổi tư vấn'}
        </strong>
        <span className="text-xs text-text-secondary truncate">
          {booking.menteeDisplayName} ·{' '}
          {formatSessionTime(booking.selectedStartTime, booking.selectedEndTime)}
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <BookingStatusBadge status={booking.bookingStatus || booking.displayState} />
        {booking.canJoin && booking.meetingLink && (
          <a
            href={booking.meetingLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:opacity-90"
          >
            <Video className="w-3.5 h-3.5" aria-hidden="true" />
            Tham gia
          </a>
        )}
      </div>
    </li>
  );
}

function ReviewItem({ review }: { review: MentorReviewResponse }) {
  return (
    <li className="flex flex-col gap-1.5 p-3.5 rounded-xl border border-solid border-border-color">
      <div className="flex items-center justify-between gap-2">
        <strong className="text-sm font-bold text-text-main truncate">
          {review.reviewerDisplayName}
        </strong>
        <span
          className="flex items-center gap-0.5 shrink-0"
          aria-label={`${review.rating} trên 5 sao`}
        >
          {Array.from({ length: 5 }, (_, index) => (
            <Star
              key={index}
              aria-hidden="true"
              className={`w-3.5 h-3.5 ${index < Math.round(review.rating) ? 'text-amber-500 fill-amber-500' : 'text-border-color'}`}
            />
          ))}
        </span>
      </div>
      {review.comment && (
        <p className="text-xs text-text-secondary m-0 line-clamp-2">{review.comment}</p>
      )}
      <small className="text-[11px] text-text-muted">{formatDate(review.createdAt)}</small>
    </li>
  );
}

function IncomeChart({ days }: { days: DailyIncome[] }) {
  const max = Math.max(...days.map((day) => day.amount), 1);
  return (
    <ul
      className="flex items-end justify-between gap-2 h-44 list-none p-0 m-0"
      aria-label="Biểu đồ thu nhập 7 ngày gần nhất"
    >
      {days.map((day) => (
        <li
          key={day.dateKey}
          className="flex-1 h-full flex flex-col items-center justify-end gap-1.5"
        >
          <span className="text-[10px] font-semibold text-text-secondary">
            {day.amount > 0 ? numberFormatter.format(day.amount) : ''}
          </span>
          <span
            className="w-full max-w-10 rounded-t-md bg-primary"
            style={{ height: `${Math.max((day.amount / max) * 100, day.amount > 0 ? 4 : 1)}%` }}
            title={`${day.label}: ${formatScoin(day.amount)}`}
          />
          <span className="text-[11px] text-text-muted">{day.label}</span>
        </li>
      ))}
    </ul>
  );
}

const toneStyles: Record<MetricTone, string> = {
  income: 'border-l-4 border-l-emerald-500',
  booking: 'border-l-4 border-l-sky-500',
  rating: 'border-l-4 border-l-amber-500',
  mentee: 'border-l-4 border-l-indigo-500',
};

function MetricCard({
  icon,
  label,
  caption,
  value,
  tone,
}: {
  icon: ReactNode;
  label: string;
  caption: string;
  value: string;
  tone: MetricTone;
}) {
  return (
    <article
      className={`p-5 rounded-2xl border border-solid border-border-light bg-white flex flex-col gap-2 shadow-xs ${toneStyles[tone]}`}
    >
      <div className="flex items-center justify-between">
        <i className="not-italic w-9 h-9 rounded-xl flex items-center justify-center bg-surface-subtle">
          {icon}
        </i>
        <small className="text-[11px] text-text-muted font-medium">{caption}</small>
      </div>
      <strong className="text-2xl font-black text-text-main">{value}</strong>
      <span className="text-xs font-semibold text-text-secondary">{label}</span>
    </article>
  );
}

function EmptyPanel({ message }: { message: string }) {
  return (
    <p className="p-8 text-center text-xs text-text-muted bg-surface-subtle rounded-2xl border border-dashed border-border-color m-0">
      {message}
    </p>
  );
}
