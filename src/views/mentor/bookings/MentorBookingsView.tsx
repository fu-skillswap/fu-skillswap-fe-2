/**
 * @file MentorBookingsView.tsx
 * @description Trang quản lý booking theo góc nhìn Mentor.
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowDownUp,
  CalendarDays,
  CalendarX,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  EllipsisVertical,
  ExternalLink,
  PlayCircle,
  Eye,
  Filter,
  Mail,
  MessageSquare,
  LogIn,
  MapPin,
  RefreshCw,
  Square,
  Target,
  UserRound,
  Video,
  XCircle,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useMenteeShell } from '@/components/domain/mentee-shell/MenteeShell';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ApiClientError } from '@/models/apiClient';
import type { GoogleCalendarStatusResponse, MentorBookingResponse } from '@/models/auth';
import { showError, showSuccess } from '@/utils/toast';
import {
  bookingFilterOf,
  type MentorBookingFilter,
  type MentorBookingMutation,
  useMentorBookings,
} from './useMentorBookings';

const FILTERS: Array<{
  value: MentorBookingFilter;
  label: string;
  icon: typeof Mail;
}> = [
  { value: 'ALL', label: 'Tất cả', icon: Filter },
  { value: 'REQUESTED', label: 'Chờ xác nhận', icon: Mail },
  { value: 'WAITING_PAYMENT', label: 'Chờ thanh toán', icon: Clock3 },
  { value: 'CONFIRMED', label: 'Đã xác nhận', icon: CalendarDays },
  { value: 'UNDER_REVIEW', label: 'Đang xem xét', icon: Eye },
  { value: 'COMPLETED', label: 'Hoàn thành', icon: CheckCircle2 },
  { value: 'CLOSED', label: 'Đã đóng', icon: XCircle },
];

type BookingAction = 'accept' | 'reject' | 'complete' | 'cancel';
type MeetingPlatform = NonNullable<MentorBookingResponse['meetingPlatform']>;

const MEETING_PLATFORMS: MeetingPlatform[] = [
  'GOOGLE_MEET',
  'ZOOM',
  'MICROSOFT_TEAMS',
  'DISCORD',
  'OFFLINE',
  'OTHER',
];

function meetingPlatformOf(value: string): MeetingPlatform | undefined {
  return MEETING_PLATFORMS.find((platform) => platform === value);
}

function meetingPlatformLabel(platform: MentorBookingResponse['meetingPlatform']) {
  if (platform === 'GOOGLE_MEET') return 'Google Meet';
  if (platform === 'MICROSOFT_TEAMS') return 'Microsoft Teams';
  if (platform === 'ZOOM') return 'Zoom';
  if (platform === 'DISCORD') return 'Discord';
  if (platform === 'OFFLINE') return 'Trực tiếp';
  if (platform === 'OTHER') return 'Khác';
  return undefined;
}

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(-2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || 'MT'
  );
}

function formatSchedule(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const weekday = new Intl.DateTimeFormat('vi-VN', { weekday: 'short' }).format(date);
  const day = new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
  const time = new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
  return `${weekday}, ${day} · ${time}`;
}

function formatScheduleParts(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: value || 'Chưa xác định', time: '' };
  return {
    date: new Intl.DateTimeFormat('vi-VN', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date),
    time: new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date),
  };
}

function statusPresentation(booking: MentorBookingResponse) {
  const group = bookingFilterOf(booking);
  if (group === 'REQUESTED') {
    return { label: 'Chờ Mentor xác nhận', variant: 'info' as const };
  }
  if (group === 'WAITING_PAYMENT') {
    return { label: 'Chờ thanh toán', variant: 'warning' as const };
  }
  if (group === 'CONFIRMED') {
    const label = booking.actualSessionStatus === 'IN_PROGRESS' ? 'Đang diễn ra' : 'Đã xác nhận';
    return { label, variant: 'info' as const };
  }
  if (group === 'UNDER_REVIEW') {
    return { label: 'Đang xem xét', variant: 'neutral' as const };
  }
  if (group === 'COMPLETED') {
    return { label: 'Hoàn thành', variant: 'success' as const };
  }
  const closedLabels: Partial<Record<MentorBookingResponse['bookingStatus'], string>> = {
    REJECTED_BY_MENTOR: 'Mentor đã từ chối',
    CANCELED_BY_MENTEE: 'Mentee đã hủy',
    CANCELED_BY_MENTOR: 'Mentor đã hủy',
    REQUEST_EXPIRED: 'Yêu cầu đã hết hạn',
    PAYMENT_EXPIRED: 'Thanh toán đã hết hạn',
  };
  return {
    label: closedLabels[booking.bookingStatus] || 'Đã đóng',
    variant: 'danger' as const,
  };
}

function emptyText(filter: MentorBookingFilter) {
  if (filter === 'REQUESTED') {
    return ['Hiện chưa có booking mới.', 'Các yêu cầu đặt lịch mới sẽ xuất hiện tại đây.'];
  }
  const label = FILTERS.find((item) => item.value === filter)?.label.toLowerCase() ?? 'phù hợp';
  return [`Không có booking ${label}.`, 'Hãy chọn bộ lọc khác để xem các lịch đặt của bạn.'];
}

export function MentorBookingsView() {
  const { setHeaderTitle } = useMenteeShell();
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const {
    activeFilter,
    bookings,
    counts,
    currentPage,
    error,
    googleCalendarStatus,
    isLoading,
    isSaving,
    loadDetail,
    mutate,
    refresh,
    selectedDate,
    setActiveFilter,
    setCurrentPage,
    setSelectedDate,
    setSortDirection,
    sortDirection,
    totalPages,
  } = useMentorBookings();
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [detail, setDetail] = useState<MentorBookingResponse>();
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [action, setAction] = useState<{
    type: BookingAction;
    booking: MentorBookingResponse;
  }>();

  useEffect(() => {
    setHeaderTitle('Lịch đặt');
    return () => setHeaderTitle(undefined);
  }, [setHeaderTitle]);

  const empty = useMemo(() => emptyText(activeFilter), [activeFilter]);

  const openDetail = async (booking: MentorBookingResponse) => {
    setDetail(booking);
    setIsDetailLoading(true);
    try {
      setDetail(await loadDetail(booking.bookingId));
    } catch {
      showError('Không thể tải chi tiết booking.');
    } finally {
      setIsDetailLoading(false);
    }
  };

  const executeAction = async (mutation: MentorBookingMutation) => {
    if (!action) return;
    try {
      const success = await mutate(action.booking.bookingId, mutation);
      if (success) {
        const successContent = {
          accept: {
            title: 'Đã xác nhận booking',
            description: 'Buổi mentoring đã được xác nhận.',
          },
          reject: {
            title: 'Đã từ chối booking',
            description: 'Yêu cầu đặt lịch đã được cập nhật.',
          },
          complete: {
            title: 'Đã hoàn thành buổi mentoring',
            description: 'Trạng thái buổi mentoring đã được cập nhật.',
          },
          cancel: { title: 'Đã hủy lịch', description: 'Buổi mentoring đã được hủy.' },
        }[mutation.type === 'checkIn' ? 'complete' : mutation.type];
        showSuccess(successContent);
        setAction(undefined);
        setDetail(undefined);
      }
    } catch (reason) {
      if (reason instanceof ApiClientError) {
        const validationMessage = reason.data
          ?.map((item) => item.message)
          .filter(Boolean)
          .join(' ');
        const isMissingIdempotencyKey =
          reason.code === 'SYS_0002' || reason.message === 'IDEMPOTENCY_KEY_REQUIRED';
        const isGenericValidationMessage =
          reason.status === 400 &&
          /invalid|validation|bad request|không hợp lệ|chưa hợp lệ/i.test(reason.message);
        showError(
          validationMessage ||
            (isMissingIdempotencyKey
              ? 'Yêu cầu chưa có mã xác nhận an toàn. Vui lòng thử lại; hệ thống đã tự bổ sung mã cho thao tác này.'
              : mutation.type === 'complete' && isGenericValidationMessage
                ? 'Hệ thống chưa cho phép kết thúc booking ở trạng thái hiện tại. Dữ liệu booking sẽ được tải lại để bạn kiểm tra.'
                : reason.message),
          {
            title:
              mutation.type === 'complete'
                ? 'Chưa thể kết thúc buổi mentoring'
                : 'Không thể cập nhật booking',
          },
        );
        await refresh();
      } else {
        showError(reason, { title: 'Không thể cập nhật booking' });
      }
    }
  };

  return (
    <section className="mx-auto max-w-7xl space-y-5 [font-family:inherit]">
      <header className="space-y-1 pb-2">
        <h1 className="m-0 text-3xl font-bold tracking-tight text-text-main">Lịch đặt</h1>
        <p className="m-0 text-sm font-normal text-text-muted">
          Quản lý và theo dõi các lịch mentoring của bạn.
        </p>
      </header>

      <div
        className="flex max-w-full gap-2 overflow-x-auto pb-1"
        role="tablist"
        aria-label="Lọc lịch đặt"
      >
        {FILTERS.map((filter) => {
          const Icon = filter.icon;
          return (
            <button
              type="button"
              role="tab"
              aria-selected={activeFilter === filter.value}
              className={`inline-flex h-12 shrink-0 items-center gap-2 rounded-xl border px-4 text-sm font-semibold outline-none transition-colors focus-visible:ring-3 focus-visible:ring-primary/20 ${activeFilter === filter.value ? 'border-primary bg-primary text-white' : 'border-border-color bg-white text-text-secondary hover:border-primary-border hover:bg-primary-light hover:text-primary'}`}
              key={filter.value}
              onClick={() => setActiveFilter(filter.value)}
            >
              <Icon className="h-4.5 w-4.5" aria-hidden="true" />
              {filter.label} ({counts[filter.value]})
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-border-color/80 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-3">
          <label className="relative inline-flex h-11 min-w-44 items-center gap-2 rounded-xl border border-border-color bg-white px-4 text-sm font-medium text-text-secondary transition-colors hover:border-primary-border hover:bg-primary-light/40">
            <CalendarDays className="h-5 w-5 text-primary" aria-hidden="true" />
            <span>{selectedDate || 'Chọn ngày'}</span>
            <input
              type="date"
              className="absolute inset-0 cursor-pointer opacity-0"
              value={selectedDate}
              aria-label="Chọn ngày booking"
              onChange={(event) => setSelectedDate(event.target.value)}
            />
          </label>
          <button
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-border-color bg-white px-4 text-sm font-medium text-text-secondary outline-none transition-colors hover:border-primary-border hover:bg-primary-light/40 hover:text-primary focus-visible:ring-3 focus-visible:ring-primary/20"
            type="button"
            aria-expanded={showAdvancedFilter}
            onClick={() => setShowAdvancedFilter((value) => !value)}
          >
            <Filter className="h-5 w-5" aria-hidden="true" />
            Bộ lọc
            <ChevronDown
              className={`h-4 w-4 transition-transform ${showAdvancedFilter ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
          </button>
        </div>
        <div className="relative inline-flex h-11 items-center gap-2 rounded-xl border border-border-color bg-white px-4 text-sm font-medium text-text-secondary transition-colors hover:border-primary-border hover:bg-primary-light/40">
          <ArrowDownUp className="h-5 w-5 text-primary" aria-hidden="true" />
          <span>Sắp xếp:</span>
          <strong className="font-semibold text-text-main">
            {sortDirection === 'DESC' ? 'Xa nhất' : 'Gần nhất'}
          </strong>
          <ChevronDown className="h-4 w-4" aria-hidden="true" />
          <select
            className="absolute inset-0 cursor-pointer opacity-0"
            value={sortDirection}
            aria-label="Sắp xếp booking theo thời gian"
            onChange={(event) => setSortDirection(event.target.value as 'ASC' | 'DESC')}
          >
            <option value="ASC">Gần nhất trước</option>
            <option value="DESC">Xa nhất trước</option>
          </select>
        </div>
      </div>

      {showAdvancedFilter && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary-border/50 bg-primary-light/50 px-4 py-3">
          <span className="text-sm text-text-secondary">
            {selectedDate ? `Đang lọc booking ngày ${selectedDate}` : 'Chưa áp dụng bộ lọc ngày.'}
          </span>
          <button
            type="button"
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-primary-border bg-white px-3 text-sm font-semibold text-primary outline-none hover:bg-primary-light focus-visible:ring-3 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => setSelectedDate('')}
            disabled={!selectedDate}
          >
            <CalendarX aria-hidden="true" />
            Xóa ngày đã chọn
          </button>
        </div>
      )}

      {error && (
        <div
          className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-danger-soft p-4 text-sm text-danger"
          role="alert"
        >
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={() => void refresh()}>
            Thử lại
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-3" aria-label="Đang tải lịch đặt">
          {[1, 2, 3, 4].map((item) => (
            <div
              className="h-28 animate-pulse rounded-2xl border border-border-light bg-white shadow-xs"
              key={item}
            />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="flex min-h-48 flex-col items-center justify-center gap-2 rounded-2xl border border-border-color/80 bg-white p-8 text-center text-sm text-text-muted shadow-xs">
          <CalendarDays className="h-9 w-9 text-text-disabled" aria-hidden="true" />
          <strong className="text-base font-semibold text-text-main">{empty[0]}</strong>
          <span>{empty[1]}</span>
        </div>
      ) : (
        <div className="grid gap-3">
          {bookings.map((booking) => (
            <BookingRow
              booking={booking}
              key={booking.bookingId}
              onAction={(type) => setAction({ type, booking })}
              onDetail={() => void openDetail(booking)}
              onMessage={() =>
                router.push(
                  `/${params.locale || 'vi'}/messages?participantId=${encodeURIComponent(booking.menteeUserId)}`,
                )
              }
              onCheckIn={() => void executeDirectAction(booking, { type: 'checkIn' })}
            />
          ))}
        </div>
      )}

      {!isLoading && bookings.length > 0 && totalPages > 1 && (
        <BookingPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      <BookingDetailModal
        booking={detail}
        isLoading={isDetailLoading}
        onAction={(type) => detail && setAction({ type, booking: detail })}
        onClose={() => setDetail(undefined)}
      />
      <BookingActionModal
        action={action}
        googleCalendarStatus={googleCalendarStatus}
        isSaving={isSaving}
        onClose={() => setAction(undefined)}
        onSubmit={(mutation) => void executeAction(mutation)}
      />
    </section>
  );

  async function executeDirectAction(
    booking: MentorBookingResponse,
    mutation: MentorBookingMutation,
  ) {
    try {
      await mutate(booking.bookingId, mutation);
      showSuccess({ title: 'Đã check-in', description: 'Hệ thống đã ghi nhận bạn có mặt.' });
    } catch (reason) {
      showError(reason, { title: 'Không thể check-in' });
    }
  }
}

function BookingPagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const firstPage = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
  const visiblePages = Array.from(
    { length: Math.min(5, totalPages) },
    (_, index) => firstPage + index,
  );

  return (
    <nav
      className="flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-border-color/70 bg-white p-4 shadow-xs"
      aria-label="Phân trang booking"
    >
      <button
        type="button"
        className="inline-flex h-10 items-center gap-1 rounded-lg px-3 text-sm font-semibold text-primary outline-none hover:bg-primary-light focus-visible:ring-3 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:text-text-disabled disabled:hover:bg-transparent"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        Trước
      </button>
      {visiblePages.map((page) => (
        <button
          type="button"
          className={`h-10 min-w-10 rounded-lg border px-3 text-sm font-semibold outline-none transition-colors focus-visible:ring-3 focus-visible:ring-primary/20 ${page === currentPage ? 'border-primary bg-primary text-white' : 'border-primary-border bg-white text-primary hover:border-primary hover:bg-primary-light'}`}
          aria-current={page === currentPage ? 'page' : undefined}
          key={page}
          onClick={() => onPageChange(page)}
        >
          {page}
        </button>
      ))}
      <button
        type="button"
        className="inline-flex h-10 items-center gap-1 rounded-lg px-3 text-sm font-semibold text-primary outline-none hover:bg-primary-light focus-visible:ring-3 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:text-text-disabled disabled:hover:bg-transparent"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Sau
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </nav>
  );
}

function BookingRow({
  booking,
  onAction,
  onDetail,
  onMessage,
  onCheckIn,
}: {
  booking: MentorBookingResponse;
  onAction: (type: BookingAction) => void;
  onDetail: () => void;
  onMessage: () => void;
  onCheckIn: () => void;
}) {
  const status = statusPresentation(booking);
  const bookingGroup = bookingFilterOf(booking);
  const schedule = formatScheduleParts(booking.selectedStartTime);
  const meetingLabel = meetingPlatformLabel(booking.meetingPlatform);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const hasConfirmedBooking = ['CONFIRMED', 'UNDER_REVIEW', 'COMPLETED'].includes(
    booking.bookingStatus,
  );
  const canOpenMessages =
    hasConfirmedBooking && ['CONFIRMED', 'UNDER_REVIEW', 'COMPLETED'].includes(bookingGroup);
  const canCheckIn = Boolean(
    booking.attendance?.canCheckIn && !booking.attendance.currentUserCheckedIn,
  );
  const primaryAction = booking.canAccept
    ? { label: 'Xác nhận', icon: <Check />, action: () => onAction('accept') }
    : booking.canCompleteByMentor
      ? { label: 'Kết thúc', icon: <Square />, action: () => onAction('complete') }
      : booking.canJoin && booking.meetingLink
        ? {
            label: 'Bắt đầu',
            icon: <PlayCircle />,
            action: () => window.open(booking.meetingLink ?? '', '_blank', 'noopener,noreferrer'),
          }
        : undefined;

  return (
    <article className="grid min-h-32 w-full grid-cols-2 items-center gap-4 rounded-2xl border border-border-color/70 bg-white px-4 py-4 shadow-xs transition-all duration-200 hover:border-primary-border/70 hover:shadow-md sm:px-5 md:grid-cols-[minmax(0,1fr)_minmax(220px,.75fr)] md:gap-x-6 md:gap-y-5 xl:min-h-36 xl:grid-cols-[minmax(280px,1.35fr)_minmax(190px,.8fr)_minmax(150px,.6fr)_minmax(224px,auto)]">
      <div className="col-span-2 flex min-w-0 items-center gap-3 sm:gap-4 md:col-span-1">
        {booking.menteeAvatarUrl ? (
          <img
            className="h-14 w-14 shrink-0 rounded-full object-cover"
            src={booking.menteeAvatarUrl}
            alt={`Ảnh đại diện của ${booking.menteeDisplayName}`}
          />
        ) : (
          <span
            className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-primary-light font-bold text-primary"
            aria-hidden="true"
          >
            {initials(booking.menteeDisplayName)}
          </span>
        )}
        <div className="min-w-0">
          <strong className="block truncate text-base font-semibold text-text-main">
            {booking.serviceTitle || 'Dịch vụ mentoring'}
          </strong>
          <span className="mt-0.5 block truncate text-sm text-text-secondary">
            với {booking.menteeDisplayName || 'Mentee'}
          </span>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-text-muted">
            <span className="font-semibold text-primary">Mentee</span>
            {booking.serviceDurationSnapshot ? (
              <>
                <span aria-hidden="true">•</span>
                <span>{booking.serviceDurationSnapshot} phút</span>
              </>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex min-h-18 min-w-0 items-start gap-2.5 text-sm text-text-secondary md:justify-self-end xl:min-h-0 xl:justify-self-start">
        <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
        <div className="min-w-0">
          <strong className="block truncate font-medium text-text-secondary">
            {schedule.date}
          </strong>
          {schedule.time && <span className="mt-0.5 block">{schedule.time}</span>}
          {meetingLabel && (
            <span className="mt-2 inline-flex rounded-md bg-primary-light px-2 py-0.5 text-xs font-medium text-primary">
              {meetingLabel}
            </span>
          )}
        </div>
      </div>

      <div className="flex min-w-0 justify-self-end md:justify-self-start xl:justify-self-auto xl:justify-center">
        <Badge
          variant={status.variant}
          className="max-w-full px-3 py-1.5 text-xs font-medium [&>span:last-child]:truncate"
        >
          {status.label}
        </Badge>
      </div>

      <div className="col-span-2 flex w-full min-w-0 flex-wrap items-center gap-2 border-t border-slate-100 pt-3 md:col-span-1 md:justify-end md:border-t-0 md:pt-0 xl:flex-nowrap">
        {primaryAction && (
          <Button
            className="min-w-24 flex-1 sm:flex-none"
            leftIcon={primaryAction.icon}
            onClick={primaryAction.action}
          >
            {primaryAction.label}
          </Button>
        )}
        <Button className="min-w-24 flex-1 sm:flex-none" variant="outline" onClick={onDetail}>
          Chi tiết
        </Button>
        {canOpenMessages || canCheckIn ? (
          <div className="relative">
            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-xl border border-transparent bg-transparent text-text-secondary outline-none transition-colors hover:border-border-color hover:bg-surface-subtle hover:text-primary focus-visible:ring-3 focus-visible:ring-primary/20"
              aria-label="Mở thêm tùy chọn"
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen((value) => !value)}
            >
              <EllipsisVertical className="h-5 w-5" aria-hidden="true" />
            </button>
            {isMenuOpen && (
              <div
                className="absolute right-0 top-full z-20 mt-1 min-w-40 rounded-xl border border-border-color bg-white p-1.5 shadow-md"
                role="menu"
              >
                {canOpenMessages && (
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-text-secondary hover:bg-primary-light hover:text-primary"
                    role="menuitem"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onMessage();
                    }}
                  >
                    <MessageSquare className="h-4 w-4" aria-hidden="true" />
                    Nhắn tin
                  </button>
                )}
                {canCheckIn && (
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-text-secondary hover:bg-primary-light hover:text-primary"
                    role="menuitem"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onCheckIn();
                    }}
                  >
                    <LogIn className="h-4 w-4" aria-hidden="true" />
                    Check-in
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <span className="hidden h-10 w-10 shrink-0 xl:block" aria-hidden="true" />
        )}
      </div>
    </article>
  );
}

function BookingDetailModal({
  booking,
  isLoading,
  onAction,
  onClose,
}: {
  booking?: MentorBookingResponse;
  isLoading: boolean;
  onAction: (type: BookingAction) => void;
  onClose: () => void;
}) {
  if (!booking) return null;
  const status = statusPresentation(booking);
  const meetingLabel = meetingPlatformLabel(booking.meetingPlatform) || 'Chưa thiết lập';
  return (
    <Modal open onClose={onClose} title="Chi tiết lịch đặt" className="max-w-2xl">
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/70 backdrop-blur-[1px]">
            <RefreshCw className="h-6 w-6 animate-spin text-[#119CF7]" aria-label="Đang tải" />
          </div>
        )}

        <div className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-sky-100 bg-sky-50/70 p-4">
          <div className="min-w-0">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Dịch vụ mentoring
            </span>
            <h3 className="mt-1 truncate text-lg font-extrabold tracking-tight text-slate-900">
              {booking.serviceTitle || 'Dịch vụ mentoring'}
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              với{' '}
              <strong className="font-semibold text-slate-800">{booking.menteeDisplayName}</strong>
            </p>
          </div>
          <Badge variant={status.variant} className="px-3 py-1.5 text-xs">
            {status.label}
          </Badge>
        </div>

        <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
          <Info
            icon={<CalendarDays />}
            label="Thời gian bắt đầu"
            value={formatSchedule(booking.selectedStartTime)}
          />
          <Info
            icon={<Clock3 />}
            label="Thời gian kết thúc"
            value={formatSchedule(booking.selectedEndTime)}
          />
          <Info icon={<UserRound />} label="Mentee" value={booking.menteeDisplayName} />
          <Info icon={<Video />} label="Nền tảng" value={meetingLabel} />
          {booking.googleCalendarManaged && (
            <Info
              icon={<CalendarDays />}
              label="Google Calendar"
              value={booking.calendarSyncStatus || 'Đang đồng bộ'}
            />
          )}
          {booking.googleMeetAutoGenerated && (
            <Info icon={<Video />} label="Google Meet" value="Được tạo tự động" />
          )}
        </div>

        <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-[#119CF7]">
              <Target className="h-4.5 w-4.5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                Mục tiêu buổi mentoring
              </span>
              <strong className="mt-1 block break-words text-sm text-slate-900">
                {booking.learningGoalTitle || 'Không có mục tiêu cụ thể'}
              </strong>
              {booking.learningGoalDescription && (
                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
                  {booking.learningGoalDescription}
                </p>
              )}
            </div>
          </div>
        </section>

        {booking.meetingLink && (
          <a
            className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#119CF7] px-4 text-sm font-bold text-white outline-none transition hover:bg-[#0789dc] focus-visible:ring-4 focus-visible:ring-[#119CF7]/25"
            href={booking.meetingLink}
            target="_blank"
            rel="noreferrer"
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            Mở liên kết buổi mentoring
          </a>
        )}
        {booking.location && (
          <div className="mt-3">
            <Info icon={<MapPin />} label="Địa điểm" value={booking.location} />
          </div>
        )}
        {booking.calendarSyncErrorMessage && (
          <div
            className="mt-3 rounded-xl border border-amber-200 bg-warning-soft p-3 text-sm text-amber-700"
            role="status"
          >
            Đồng bộ Google Calendar chưa thành công: {booking.calendarSyncErrorMessage}
          </div>
        )}
      </div>
      <footer className="mt-5 flex flex-col-reverse gap-2 border-t border-border-light pt-4 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="outline" className="h-10 sm:min-w-24" onClick={onClose}>
          Đóng
        </Button>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          {booking.canReject && (
            <Button variant="destructive" className="h-10" onClick={() => onAction('reject')}>
              Từ chối
            </Button>
          )}
          {booking.canCancel && !booking.canReject && (
            <Button variant="destructive" className="h-10" onClick={() => onAction('cancel')}>
              Hủy lịch
            </Button>
          )}
          {booking.canAccept && (
            <Button
              className="h-10 border-[#119CF7] bg-[#119CF7] hover:bg-[#0789dc]"
              onClick={() => onAction('accept')}
            >
              Xác nhận
            </Button>
          )}
          {booking.canCompleteByMentor && (
            <Button
              className="h-10 border-[#119CF7] bg-[#119CF7] hover:bg-[#0789dc]"
              onClick={() => onAction('complete')}
            >
              Kết thúc
            </Button>
          )}
        </div>
      </footer>
    </Modal>
  );
}

function Info({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#119CF7] shadow-xs [&_svg]:h-4 [&_svg]:w-4"
        aria-hidden="true"
      >
        {icon}
      </span>
      <div className="min-w-0">
        <small className="block text-xs text-slate-500">{label}</small>
        <strong className="mt-1 block break-words text-sm leading-5 text-slate-900">{value}</strong>
      </div>
    </div>
  );
}

function BookingActionModal({
  action,
  googleCalendarStatus,
  isSaving,
  onClose,
  onSubmit,
}: {
  action?: { type: BookingAction; booking: MentorBookingResponse };
  googleCalendarStatus?: GoogleCalendarStatusResponse;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (mutation: MentorBookingMutation) => void;
}) {
  const [note, setNote] = useState('');
  const [meetingPlatform, setMeetingPlatform] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [location, setLocation] = useState('');
  const canAutoGenerateGoogleMeet = Boolean(
    googleCalendarStatus?.connected && !googleCalendarStatus.needsReconnect,
  );
  const shouldAutoGenerateGoogleMeet =
    meetingPlatform === 'GOOGLE_MEET' && canAutoGenerateGoogleMeet;
  const requiresMeetingLink = Boolean(
    meetingPlatform && meetingPlatform !== 'OFFLINE' && !shouldAutoGenerateGoogleMeet,
  );
  const requiresLocation = meetingPlatform === 'OFFLINE';
  const isAcceptFormValid = Boolean(
    meetingPlatform &&
    (!requiresMeetingLink || meetingLink.trim()) &&
    (!requiresLocation || location.trim()),
  );

  useEffect(() => {
    setNote('');
    setMeetingPlatform(canAutoGenerateGoogleMeet ? 'GOOGLE_MEET' : '');
    setMeetingLink('');
    setLocation('');
  }, [action, canAutoGenerateGoogleMeet]);

  if (!action) return null;
  const title = {
    accept: 'Xác nhận booking',
    reject: 'Từ chối booking',
    complete: 'Kết thúc buổi mentoring',
    cancel: 'Hủy lịch đặt',
  }[action.type];
  const requiresReason = action.type === 'reject' || action.type === 'cancel';

  const submit = () => {
    const trimmedNote = note.trim();
    if (requiresReason && !trimmedNote) return;
    if (action.type === 'accept') {
      if (!isAcceptFormValid) return;
      onSubmit({
        type: 'accept',
        data: {
          mentorResponseNote: trimmedNote || undefined,
          meetingPlatform: meetingPlatformOf(meetingPlatform),
          meetingLink: requiresMeetingLink ? meetingLink.trim() : undefined,
          location: requiresLocation ? location.trim() : undefined,
        },
      });
    }
    if (action.type === 'reject') {
      onSubmit({ type: 'reject', data: { rejectReason: trimmedNote } });
    }
    if (action.type === 'complete') {
      onSubmit({ type: 'complete', data: { completionNote: trimmedNote || undefined } });
    }
    if (action.type === 'cancel') {
      onSubmit({ type: 'cancel', data: { cancelReason: trimmedNote } });
    }
  };

  return (
    <Modal open onClose={onClose} title={title}>
      <div className="grid gap-4 [&_input]:h-11 [&_input]:rounded-xl [&_input]:border [&_input]:border-border-color [&_input]:px-3 [&_label]:grid [&_label]:gap-2 [&_label]:text-sm [&_select]:h-11 [&_select]:rounded-xl [&_select]:border [&_select]:border-border-color [&_select]:bg-white [&_select]:px-3 [&_textarea]:min-h-28 [&_textarea]:rounded-xl [&_textarea]:border [&_textarea]:border-border-color [&_textarea]:p-3">
        {action.type === 'accept' && (
          <>
            <label>
              <span>
                Nền tảng buổi mentoring <span className="text-danger">*</span>
              </span>
              <select
                required
                value={meetingPlatform}
                onChange={(event) => setMeetingPlatform(event.target.value)}
              >
                <option value="">Chọn nền tảng</option>
                <option value="GOOGLE_MEET">Google Meet</option>
                <option value="ZOOM">Zoom</option>
                <option value="MICROSOFT_TEAMS">Microsoft Teams</option>
                <option value="DISCORD">Discord</option>
                <option value="OFFLINE">Trực tiếp</option>
                <option value="OTHER">Khác</option>
              </select>
            </label>
            {shouldAutoGenerateGoogleMeet ? (
              <div className="flex gap-3 rounded-xl border border-primary-border bg-primary-light p-3 text-sm text-primary">
                <CalendarDays aria-hidden="true" />
                <div>
                  <strong>Google Meet sẽ được tạo tự động</strong>
                  <span>
                    Booking sẽ được đồng bộ với {googleCalendarStatus?.email || 'Google Calendar'}.
                    Link tham gia do hệ thống tạo và không cần nhập thủ công.
                  </span>
                </div>
              </div>
            ) : googleCalendarStatus?.needsReconnect && meetingPlatform === 'GOOGLE_MEET' ? (
              <div className="rounded-xl border border-amber-200 bg-warning-soft p-3 text-sm text-amber-700">
                Kết nối Google Calendar cần được xác thực lại. Vui lòng kết nối lại trong Cài đặt
                lịch để tự động tạo Google Meet.
              </div>
            ) : null}
            {requiresMeetingLink && (
              <label>
                <span>
                  Liên kết cuộc họp <span className="text-danger">*</span>
                </span>
                <input
                  required
                  type="url"
                  value={meetingLink}
                  onChange={(event) => setMeetingLink(event.target.value)}
                  placeholder="https://..."
                />
              </label>
            )}
            {requiresLocation && (
              <label>
                <span>
                  Địa điểm <span className="text-danger">*</span>
                </span>
                <input
                  required
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder="Nhập địa điểm gặp"
                />
              </label>
            )}
          </>
        )}
        <label>
          {requiresReason ? 'Lý do' : 'Ghi chú (không bắt buộc)'}
          <textarea
            value={note}
            required={requiresReason}
            maxLength={action.type === 'complete' ? 2000 : undefined}
            onChange={(event) => setNote(event.target.value)}
            placeholder={requiresReason ? 'Nhập lý do để người học biết...' : 'Nhập ghi chú...'}
          />
        </label>
      </div>
      <footer className="mt-6 flex flex-wrap justify-end gap-2 border-t border-border-light pt-4">
        <Button variant="outline" onClick={onClose} disabled={isSaving}>
          Đóng
        </Button>
        <Button
          loading={isSaving}
          variant={requiresReason ? 'destructive' : 'primary'}
          disabled={
            (requiresReason && !note.trim()) || (action.type === 'accept' && !isAcceptFormValid)
          }
          onClick={submit}
        >
          Xác nhận
        </Button>
      </footer>
    </Modal>
  );
}
