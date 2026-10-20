/**
 * @file MentorBookingsView.tsx
 * @description Mentor "Lịch đặt" inbox: new requests first (accept / reject on the card), then
 * upcoming sessions grouped by day, then recently ended bookings with the reason they ended.
 */

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Bell,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Filter,
  LogIn,
  MapPin,
  MessageSquare,
  RefreshCw,
  Square,
  Target,
  UserRound,
  Video,
  Wallet,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useMenteeShell } from '@/components/domain/mentee-shell/MenteeShell';
import { BookingStatusBadge } from '@/components/ui/BookingStatusBadge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { SelectField } from '@/components/ui/SelectField';
import { ApiClientError } from '@/models/apiClient';
import type { MentorBookingResponse } from '@/models/auth';
import { BOOKING_TONES } from '@/views/mentee/my-bookings/bookingStatusConfig';
import { getUserFriendlyErrorMessage, showError, showSuccess } from '@/utils/toast';
import {
  INBOX_TABS,
  type InboxGroup,
  type InboxTab,
  acceptedPatch,
  byStartAsc,
  dayHeader,
  dayKey,
  durationMinutes,
  endedExplanation,
  formatTime,
  getPlatformLabel,
  inboxGroupOf,
  isBookingPaid,
  isExpired,
  mentorStatusPill,
  priceLabel,
  sentLabel,
  sessionLabel,
  shortStamp,
  timeRange,
  toDate,
} from './mentorInbox';
import { AcceptBookingModal, menteeFirstName } from './AcceptBookingModal';
import { type MentorBookingMutation, useMentorBookings } from './useMentorBookings';

type BookingAction = 'complete' | 'cancel';
const FOCUS_RING = 'outline-none focus-visible:ring-4 focus-visible:ring-primary/20';
const RECENT_LIMIT = 5;
const LIST_STEP = 10;
const REJECT_NOTE_MAX = 300;
const REJECT_REASONS = [
  'Bận đột xuất giờ này',
  'Không đúng chuyên môn của mình',
  'Mentee cần dịch vụ khác',
  'Lý do khác',
] as const;
const OTHER_REASON = 'Lý do khác';

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

/** Same friendly messages the page used before for accept / complete / cancel failures. */
function actionErrorMessage(reason: unknown, type: MentorBookingMutation['type']) {
  if (reason instanceof ApiClientError) {
    const validation = reason.data
      ?.map((item) => item.message)
      .filter(Boolean)
      .join(' ');
    if (validation) return validation;
    if (reason.code === 'SYS_0002' || reason.message === 'IDEMPOTENCY_KEY_REQUIRED') {
      return 'Yêu cầu chưa có mã xác nhận an toàn. Vui lòng thử lại; hệ thống đã tự bổ sung mã cho thao tác này.';
    }
    if (
      type === 'complete' &&
      reason.status === 400 &&
      /invalid|validation|bad request|không hợp lệ|chưa hợp lệ/i.test(reason.message)
    ) {
      return 'Hệ thống chưa cho phép kết thúc booking ở trạng thái hiện tại. Dữ liệu booking sẽ được tải lại để bạn kiểm tra.';
    }
  }
  return getUserFriendlyErrorMessage(reason, 'Không thể cập nhật booking. Vui lòng thử lại.');
}

const canMessage = (booking: MentorBookingResponse) =>
  Boolean(booking.menteeUserId) &&
  [
    'UPCOMING',
    'IN_SESSION',
    'WAITING_CONFIRMATION',
    'UNDER_REVIEW',
    'FEEDBACK_REQUIRED',
    'COMPLETED',
  ].includes(booking.displayState);

/* ----------------------------------- View ---------------------------------- */

export function MentorBookingsView() {
  const { setHeaderTitle } = useMenteeShell();
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const locale = params.locale || 'vi';
  const {
    bookings,
    error,
    googleCalendarStatus,
    isLoading,
    isSaving,
    loadDetail,
    mutate,
    refresh,
    selectedDate,
    serviceFilter,
    serviceOptions,
    setSelectedDate,
    setServiceFilter,
  } = useMentorBookings();
  const [activeTab, setActiveTab] = useState<InboxTab>('ALL');
  const [showFilters, setShowFilters] = useState(false);
  const [detail, setDetail] = useState<MentorBookingResponse>();
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [action, setAction] = useState<{ type: BookingAction; booking: MentorBookingResponse }>();
  const [acceptTarget, setAcceptTarget] = useState<MentorBookingResponse>();
  const [rejectingId, setRejectingId] = useState<string>();
  const [acceptingIds, setAcceptingIds] = useState<ReadonlySet<string>>(() => new Set());
  const [justAcceptedIds, setJustAcceptedIds] = useState<ReadonlySet<string>>(() => new Set());
  const [cardErrors, setCardErrors] = useState<Record<string, string | undefined>>({});
  const [listLimit, setListLimit] = useState(LIST_STEP);

  const canAutoGenerateGoogleMeet = Boolean(
    googleCalendarStatus?.connected && !googleCalendarStatus.needsReconnect,
  );

  useEffect(() => {
    setHeaderTitle('Lịch đặt');
    return () => setHeaderTitle(undefined);
  }, [setHeaderTitle]);

  useEffect(() => setListLimit(LIST_STEP), [activeTab, selectedDate, serviceFilter]);

  const grouped = useMemo(() => {
    const result: Record<InboxGroup, MentorBookingResponse[]> = {
      PENDING: [],
      UPCOMING: [],
      CONFIRM: [],
      ENDED: [],
      CANCELED: [],
    };
    bookings.forEach((booking) => result[inboxGroupOf(booking)].push(booking));
    // TODO(api): responseDeadline — sort requests by it (soonest first) once exposed.
    result.PENDING.sort(byStartAsc);
    result.UPCOMING.sort(byStartAsc);
    result.CONFIRM.sort(byStartAsc);
    result.ENDED.sort((a, b) => byStartAsc(b, a));
    result.CANCELED.sort((a, b) => byStartAsc(b, a));
    return result;
  }, [bookings]);

  const counts: Record<InboxTab, number> = {
    ALL: bookings.length,
    PENDING: grouped.PENDING.length,
    UPCOMING: grouped.UPCOMING.length,
    CONFIRM: grouped.CONFIRM.length,
    ENDED: grouped.ENDED.length,
    CANCELED: grouped.CANCELED.length,
  };
  const recent = useMemo(
    () => [...grouped.ENDED, ...grouped.CANCELED].sort((a, b) => byStartAsc(b, a)),
    [grouped],
  );
  const hasExpired = bookings.some(isExpired);

  const messageHref = (booking: MentorBookingResponse) =>
    `/${locale}/messages?participantId=${encodeURIComponent(booking.menteeUserId)}`;
  const openMessages = (booking: MentorBookingResponse) => router.push(messageHref(booking));

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

  const setCardError = (bookingId: string, message?: string) =>
    setCardErrors((current) => ({ ...current, [bookingId]: message }));
  const toggleId = (setter: typeof setAcceptingIds) => (bookingId: string, present: boolean) =>
    setter((current) => {
      const next = new Set(current);
      if (present) next.add(bookingId);
      else next.delete(bookingId);
      return next;
    });
  const markAccepting = toggleId(setAcceptingIds);
  const markJustAccepted = toggleId(setJustAcceptedIds);

  /** Accept optimistically: the card moves to "Sắp tới" at once and comes back on failure. */
  const acceptBooking = async (
    booking: MentorBookingResponse,
    data: Extract<MentorBookingMutation, { type: 'accept' }>['data'],
  ) => {
    const mentee = menteeFirstName(booking.menteeDisplayName);
    setCardError(booking.bookingId, undefined);
    markAccepting(booking.bookingId, true);
    markJustAccepted(booking.bookingId, true);
    setAction(undefined);
    setDetail(undefined);
    try {
      await mutate(booking.bookingId, { type: 'accept', data }, acceptedPatch(booking));
      showSuccess(`Đã nhận lịch. ${mentee} đã được thông báo.`);
    } catch (reason) {
      markJustAccepted(booking.bookingId, false);
      setCardError(booking.bookingId, actionErrorMessage(reason, 'accept'));
    } finally {
      markAccepting(booking.bookingId, false);
    }
  };

  /** One tap when Google Calendar can create the Meet link; otherwise the accept modal opens. */
  const handleAccept = (booking: MentorBookingResponse) => {
    if (canAutoGenerateGoogleMeet) {
      void acceptBooking(booking, { meetingPlatform: 'GOOGLE_MEET' });
      return;
    }
    setDetail(undefined);
    setAcceptTarget(booking);
  };

  /** Accept from the modal: it stays open while saving and shows API errors inline. */
  const acceptFromModal = async (
    booking: MentorBookingResponse,
    data: Extract<MentorBookingMutation, { type: 'accept' }>['data'],
  ) => {
    setCardError(booking.bookingId, undefined);
    await mutate(booking.bookingId, { type: 'accept', data }, acceptedPatch(booking));
    markJustAccepted(booking.bookingId, true);
    setAcceptTarget(undefined);
    showSuccess(`Đã nhận lịch. ${menteeFirstName(booking.menteeDisplayName)} đã được thông báo.`);
  };

  const startReject = (booking: MentorBookingResponse) => {
    setDetail(undefined);
    setCardError(booking.bookingId, undefined);
    setRejectingId(booking.bookingId);
    if (inboxGroupOf(booking) === 'PENDING' && activeTab !== 'ALL' && activeTab !== 'PENDING') {
      setActiveTab('PENDING');
    }
  };

  const submitReject = async (booking: MentorBookingResponse, rejectReason: string) => {
    await mutate(booking.bookingId, { type: 'reject', data: { rejectReason } });
    setRejectingId(undefined);
    // TODO(api): no "suggest another mentor" flow is built on the mentee side for rejections.
    showSuccess(`Đã từ chối yêu cầu của ${booking.menteeDisplayName || 'mentee'}.`);
  };

  const executeAction = async (mutation: MentorBookingMutation) => {
    if (!action || mutation.type === 'accept') return;
    try {
      await mutate(action.booking.bookingId, mutation);
      showSuccess(
        mutation.type === 'cancel'
          ? { title: 'Đã hủy lịch', description: 'Buổi mentoring đã được hủy.' }
          : {
              title: 'Đã hoàn thành buổi mentoring',
              description: 'Trạng thái buổi mentoring đã được cập nhật.',
            },
      );
      setAction(undefined);
      setDetail(undefined);
    } catch (reason) {
      showError(actionErrorMessage(reason, mutation.type), {
        title:
          mutation.type === 'complete'
            ? 'Chưa thể kết thúc buổi mentoring'
            : 'Không thể cập nhật booking',
      });
      void refresh(true);
    }
  };

  const checkIn = async (booking: MentorBookingResponse) => {
    try {
      await mutate(booking.bookingId, { type: 'checkIn' });
      showSuccess({ title: 'Đã check-in', description: 'Hệ thống đã ghi nhận bạn có mặt.' });
    } catch (reason) {
      showError(reason, { title: 'Không thể check-in' });
    }
  };

  const renderRequests = (items: MentorBookingResponse[]) =>
    items.length === 0 ? (
      <div className="flex items-center gap-3 rounded-[20px] border border-solid border-border-color/70 bg-white px-5 py-4 text-sm font-medium text-text-secondary shadow-xs">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-success" aria-hidden="true" />
        Không còn yêu cầu nào cần phản hồi.
      </div>
    ) : (
      <div className="grid gap-3">
        {items.map((booking) => (
          <RequestCard
            key={booking.bookingId}
            booking={booking}
            error={cardErrors[booking.bookingId]}
            isAccepting={acceptingIds.has(booking.bookingId)}
            isRejecting={rejectingId === booking.bookingId}
            onAccept={() => handleAccept(booking)}
            onDetail={() => void openDetail(booking)}
            onStartReject={() => startReject(booking)}
            onCancelReject={() => setRejectingId(undefined)}
            onSubmitReject={(reason) => submitReject(booking, reason)}
          />
        ))}
      </div>
    );

  const renderSessions = (items: MentorBookingResponse[], emptyText: string) => {
    if (items.length === 0) {
      return <p className="m-0 text-sm text-text-muted">{emptyText}</p>;
    }
    const days: Array<{ key: string; label: string; items: MentorBookingResponse[] }> = [];
    items.forEach((booking) => {
      const start = toDate(booking.selectedStartTime);
      const key = start ? dayKey(start) : 'unknown';
      const last = days[days.length - 1];
      if (last?.key === key) last.items.push(booking);
      else days.push({ key, label: start ? dayHeader(start) : 'Chưa xác định', items: [booking] });
    });
    return (
      <div className="grid gap-4">
        {days.map((day) => (
          <div key={day.key} className="grid gap-2">
            <h3 className="m-0 text-xs font-semibold text-text-secondary">{day.label}</h3>
            {day.items.map((booking) => (
              <SessionRow
                key={booking.bookingId}
                booking={booking}
                justAccepted={justAcceptedIds.has(booking.bookingId)}
                onDetail={() => void openDetail(booking)}
                onMessage={() => openMessages(booking)}
                onCheckIn={() => void checkIn(booking)}
                onComplete={() => setAction({ type: 'complete', booking })}
              />
            ))}
          </div>
        ))}
      </div>
    );
  };

  const renderEnded = (items: MentorBookingResponse[], emptyText: string, limit?: number) => {
    if (items.length === 0) return <p className="m-0 text-sm text-text-muted">{emptyText}</p>;
    const visible = items.slice(0, limit ?? listLimit);
    return (
      <div className="grid gap-2">
        {visible.map((booking) => (
          <EndedRow
            key={booking.bookingId}
            booking={booking}
            messageHref={messageHref(booking)}
            onDetail={() => void openDetail(booking)}
          />
        ))}
        {limit === undefined && items.length > visible.length && (
          <Button
            variant="outline"
            className="h-11 w-fit justify-self-center"
            onClick={() => setListLimit((value) => value + LIST_STEP)}
          >
            Xem thêm
          </Button>
        )}
      </div>
    );
  };

  const expiryTip = hasExpired && (
    <p className="m-0 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-muted">
      <Bell className="h-4 w-4 shrink-0" aria-hidden="true" />
      Để không lỡ yêu cầu, hãy bật email nhắc khi có mentee đặt lịch.
      <Link
        href={`/${locale}/settings?section=settings&tab=notifications`}
        className={`rounded font-semibold text-primary hover:underline ${FOCUS_RING}`}
      >
        Cài đặt thông báo
      </Link>
    </p>
  );

  const sectionHeading = (title: string, count?: number, urgent = false) => (
    <h2 className="m-0 flex items-center gap-2 text-base font-semibold text-text-main">
      {title}
      {count !== undefined && count > 0 && (
        <span
          className={`min-w-5 rounded-full px-1.5 py-0.5 text-center text-xs font-bold ${urgent ? 'text-white' : 'bg-primary-light text-primary'}`}
          style={urgent ? { background: BOOKING_TONES.payment.dot } : undefined}
        >
          {count}
        </span>
      )}
    </h2>
  );

  const content = (() => {
    if (activeTab === 'PENDING') return renderRequests(grouped.PENDING);
    if (activeTab === 'UPCOMING') {
      return renderSessions(grouped.UPCOMING, 'Chưa có buổi nào sắp tới.');
    }
    if (activeTab === 'CONFIRM') {
      return renderSessions(grouped.CONFIRM, 'Không có buổi nào đang chờ xác nhận.');
    }
    if (activeTab === 'ENDED') return renderEnded(grouped.ENDED, 'Chưa có buổi nào kết thúc.');
    if (activeTab === 'CANCELED') {
      return (
        <div className="grid gap-3">
          {renderEnded(grouped.CANCELED, 'Không có lịch nào bị hủy hoặc quá hạn.')}
          {expiryTip}
        </div>
      );
    }
    return (
      <div className="grid gap-7">
        <section className="grid gap-3" aria-label="Cần bạn phản hồi">
          {sectionHeading('Cần bạn phản hồi', grouped.PENDING.length, true)}
          {renderRequests(grouped.PENDING)}
        </section>
        <section className="grid gap-3" aria-label="Sắp tới">
          {sectionHeading('Sắp tới')}
          {renderSessions(grouped.UPCOMING, 'Chưa có buổi nào sắp tới.')}
        </section>
        {/* Not in the three-section brief, but these still need a follow-up so they stay visible. */}
        {grouped.CONFIRM.length > 0 && (
          <section className="grid gap-3" aria-label="Chờ xác nhận">
            {sectionHeading('Chờ xác nhận', grouped.CONFIRM.length)}
            {renderSessions(grouped.CONFIRM, '')}
          </section>
        )}
        {recent.length > 0 && (
          <section className="grid gap-3" aria-label="Gần đây">
            {sectionHeading('Gần đây')}
            {renderEnded(recent, '', RECENT_LIMIT)}
            {expiryTip}
          </section>
        )}
      </div>
    );
  })();

  const filterCount = (selectedDate ? 1 : 0) + (serviceFilter ? 1 : 0);
  const toolButton = `inline-flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-[10px] border border-solid bg-white px-2.5 text-sm font-semibold text-text-secondary transition-colors hover:border-primary-border hover:text-primary lg:px-3 ${FOCUS_RING}`;

  return (
    <section className="mx-auto max-w-5xl space-y-5 [font-family:inherit]">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="m-0 text-3xl font-bold tracking-tight text-text-main">Lịch đặt</h1>
          <p className="m-0 text-sm text-text-muted">
            Nhận yêu cầu mới và theo dõi các buổi sắp tới.
          </p>
        </div>
        <Link
          href={`/${locale}/mentor/schedule-manage`}
          className={`inline-flex min-h-11 items-center gap-2 rounded-xl border border-solid border-primary-border bg-white px-4 text-sm font-bold text-primary transition-colors hover:bg-primary-light ${FOCUS_RING}`}
        >
          <CalendarRange className="h-4 w-4" aria-hidden="true" />
          Lịch rảnh của bạn
        </Link>
      </header>

      <div className="flex items-center gap-1 rounded-2xl bg-white p-1.5 shadow-xs">
        <div
          role="tablist"
          aria-label="Lọc lịch đặt"
          className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {INBOX_TABS.map((tab) => {
            const selected = activeTab === tab.value;
            const count = counts[tab.value];
            const urgent = tab.value === 'PENDING' && count > 0;
            return (
              <button
                key={tab.value}
                type="button"
                role="tab"
                id={`mentor-booking-tab-${tab.value}`}
                aria-selected={selected}
                aria-controls="mentor-booking-panel"
                onClick={() => setActiveTab(tab.value)}
                className={`inline-flex h-10 shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-[10px] border-none px-3 text-sm font-semibold transition-colors ${FOCUS_RING} ${selected ? 'bg-primary text-white' : `bg-transparent hover:bg-primary-light hover:text-primary ${count === 0 ? 'text-text-muted' : 'text-text-main'}`}`}
              >
                {tab.label}
                <span
                  className={`min-w-5 rounded-full px-1.5 text-center text-xs font-bold leading-5 ${urgent ? 'text-white' : selected ? 'bg-white/25 text-white' : count === 0 ? 'bg-surface-subtle text-text-muted' : 'bg-primary-light text-primary'}`}
                  style={urgent ? { background: BOOKING_TONES.payment.dot } : undefined}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-1.5 border-l border-solid border-border-light pl-2.5">
          <label
            className={`${toolButton} relative focus-within:ring-4 focus-within:ring-primary/20 ${selectedDate ? 'border-primary-border text-primary' : 'border-border-color'}`}
          >
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            <span className="hidden lg:inline">
              {selectedDate ? selectedDate.split('-').reverse().slice(0, 2).join('/') : 'Chọn ngày'}
            </span>
            <input
              type="date"
              className="absolute inset-0 cursor-pointer opacity-0"
              value={selectedDate}
              aria-label="Chọn ngày"
              onChange={(event) => setSelectedDate(event.target.value)}
              onClick={(event) => {
                try {
                  event.currentTarget.showPicker?.();
                } catch {
                  // Older browsers: the native field still opens on its own.
                }
              }}
            />
          </label>
          <button
            type="button"
            aria-label="Bộ lọc"
            aria-expanded={showFilters}
            aria-controls="mentor-booking-filters"
            onClick={() => setShowFilters((value) => !value)}
            className={`${toolButton} ${filterCount ? 'border-primary-border text-primary' : 'border-border-color'}`}
          >
            <Filter className="h-4 w-4" aria-hidden="true" />
            <span className="hidden lg:inline">Bộ lọc</span>
            {filterCount > 0 && (
              <span className="min-w-5 rounded-full bg-primary-light px-1.5 text-center text-xs font-bold leading-5 text-primary">
                {filterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {showFilters && (
        <div
          id="mentor-booking-filters"
          className="flex flex-wrap items-end gap-3 rounded-2xl border border-solid border-primary-border/50 bg-primary-light/50 p-4"
        >
          <div className="w-full sm:w-72">
            <SelectField
              label="Dịch vụ"
              placeholder="Tất cả dịch vụ"
              value={serviceFilter || 'ALL'}
              onValueChange={(value) => setServiceFilter(value === 'ALL' ? '' : value)}
              options={[
                { value: 'ALL', label: 'Tất cả dịch vụ' },
                ...serviceOptions.map((title) => ({ value: title, label: title })),
              ]}
            />
          </div>
          <span className="min-h-11 flex-1 content-center text-sm text-text-secondary">
            {selectedDate
              ? `Đang xem ngày ${selectedDate.split('-').reverse().join('/')}`
              : 'Chưa lọc theo ngày.'}
          </span>
          <Button
            variant="outline"
            className="h-11"
            disabled={!filterCount}
            onClick={() => {
              setSelectedDate('');
              setServiceFilter('');
            }}
          >
            Xóa bộ lọc
          </Button>
        </div>
      )}

      {error && (
        <div
          className="flex items-center justify-between gap-3 rounded-xl border border-solid border-red-200 bg-danger-soft p-4 text-sm text-danger"
          role="alert"
        >
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={() => void refresh()}>
            Thử lại
          </Button>
        </div>
      )}

      <div
        id="mentor-booking-panel"
        role="tabpanel"
        aria-labelledby={`mentor-booking-tab-${activeTab}`}
      >
        {isLoading ? (
          <div className="grid gap-3" aria-label="Đang tải lịch đặt">
            {[1, 2, 3].map((item) => (
              <div className="h-28 animate-pulse rounded-[20px] bg-white shadow-xs" key={item} />
            ))}
          </div>
        ) : (
          content
        )}
      </div>

      <BookingDetailModal
        booking={detail}
        isLoading={isDetailLoading}
        onAccept={() => detail && handleAccept(detail)}
        onReject={() => detail && startReject(detail)}
        onAction={(type) => detail && setAction({ type, booking: detail })}
        onClose={() => setDetail(undefined)}
      />
      <AcceptBookingModal
        booking={acceptTarget}
        googleCalendarStatus={googleCalendarStatus}
        onClose={() => setAcceptTarget(undefined)}
        onAccept={acceptFromModal}
        errorMessage={(reason) => actionErrorMessage(reason, 'accept')}
      />
      <BookingActionModal
        action={action}
        isSaving={isSaving}
        onClose={() => setAction(undefined)}
        onSubmit={(mutation) => void executeAction(mutation)}
      />
    </section>
  );
}

/* ------------------------------- Request card ------------------------------ */

function MenteeAvatar({ booking }: { booking: MentorBookingResponse }) {
  const name = booking.menteeDisplayName || 'Mentee';
  return booking.menteeAvatarUrl ? (
    <img
      className="h-10 w-10 shrink-0 rounded-full object-cover"
      src={booking.menteeAvatarUrl}
      alt=""
    />
  ) : (
    <span
      className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-light text-sm font-bold text-primary"
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}

function MetaChip({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-subtle px-2.5 py-1 text-xs font-medium text-text-secondary [&_svg]:h-3.5 [&_svg]:w-3.5">
      {icon}
      {children}
    </span>
  );
}

function RequestCard({
  booking,
  error,
  isAccepting,
  isRejecting,
  onAccept,
  onDetail,
  onStartReject,
  onCancelReject,
  onSubmitReject,
}: {
  booking: MentorBookingResponse;
  error?: string;
  isAccepting: boolean;
  isRejecting: boolean;
  onAccept: () => void;
  onDetail: () => void;
  onStartReject: () => void;
  onCancelReject: () => void;
  onSubmitReject: (reason: string) => Promise<void>;
}) {
  const mentee = booking.menteeDisplayName || 'Mentee';
  const service = booking.serviceTitle || 'buổi mentoring';
  const sent = sentLabel(booking);
  const minutes = durationMinutes(booking);
  const platform = getPlatformLabel(booking);
  const message = booking.learningGoalDescription?.trim();
  const goal = booking.learningGoalTitle?.trim();
  const rejectButtonRef = useRef<HTMLButtonElement>(null);
  const wasRejecting = useRef(false);

  // Return focus to "Từ chối" when the inline form closes via "Quay lại".
  useEffect(() => {
    if (wasRejecting.current && !isRejecting) rejectButtonRef.current?.focus();
    wasRejecting.current = isRejecting;
  }, [isRejecting]);

  // TODO(api): responseDeadline — show the "Hết hạn sau {X}" pill, the urgent #FBD5B5 border
  // and "Không phản hồi trước HH:mm … thì yêu cầu tự hủy." once the backend exposes it.
  return (
    <article
      id={`booking-${booking.bookingId}`}
      className="grid gap-4 rounded-[20px] border border-solid border-border-color/70 bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="flex items-start gap-3">
        <MenteeAvatar booking={booking} />
        <div className="min-w-0 flex-1">
          <h3 className="m-0 text-base font-semibold leading-snug text-text-main">
            <button
              type="button"
              onClick={onDetail}
              className={`cursor-pointer rounded border-none bg-transparent p-0 text-left font-semibold text-inherit hover:text-primary ${FOCUS_RING}`}
            >
              {mentee} muốn đặt {service}
            </button>
          </h3>
          {/* No mentor-facing mentee profile route exists yet, so "Xem hồ sơ mentee" is omitted. */}
          {sent && <p className="m-0 mt-0.5 text-xs text-text-muted">{sent}</p>}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <MetaChip icon={<CalendarDays />}>{sessionLabel(booking)}</MetaChip>
        {minutes > 0 && <MetaChip>{minutes} phút</MetaChip>}
        <MetaChip icon={<Wallet />}>{priceLabel(booking)}</MetaChip>
        {platform && <MetaChip icon={<Video />}>{platform}</MetaChip>}
      </div>

      {(message || goal) && (
        <div className="rounded-xl bg-primary-light/60 px-4 py-3">
          <span className="block text-xs font-medium text-text-muted">Lời nhắn của mentee</span>
          {goal && <strong className="mt-1 block text-sm text-text-main">{goal}</strong>}
          {message && (
            <p className="m-0 mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-text-main">
              {message}
            </p>
          )}
        </div>
      )}

      {error && (
        <p
          className="m-0 rounded-xl border border-solid border-red-200 bg-danger-soft px-4 py-2.5 text-sm text-danger"
          role="alert"
        >
          {error}
        </p>
      )}

      {isRejecting ? (
        <RejectReasonForm mentee={mentee} onCancel={onCancelReject} onSubmit={onSubmitReject} />
      ) : (
        <footer className="flex flex-col gap-3 border-t border-solid border-border-light pt-4 md:flex-row md:items-center md:justify-between">
          <p className="m-0 text-xs leading-5 text-text-secondary">
            Giờ này nằm trong lịch rảnh bạn đã mở.
          </p>
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            {booking.canAccept && (
              <Button
                className="order-first h-11 w-full text-sm md:order-last md:w-auto"
                loading={isAccepting}
                onClick={onAccept}
              >
                Nhận lịch
              </Button>
            )}
            {booking.canReject && (
              <button
                ref={rejectButtonRef}
                type="button"
                disabled={isAccepting}
                onClick={onStartReject}
                className={`h-11 cursor-pointer rounded-xl border-none bg-transparent px-4 text-sm font-bold text-[#C4320A] transition-colors hover:bg-danger-soft disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS_RING}`}
              >
                Từ chối
              </button>
            )}
          </div>
        </footer>
      )}
    </article>
  );
}

function RejectReasonForm({
  mentee,
  onCancel,
  onSubmit,
}: {
  mentee: string;
  onCancel: () => void;
  onSubmit: (reason: string) => Promise<void>;
}) {
  const [choice, setChoice] = useState<string>();
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const fieldsetRef = useRef<HTMLFieldSetElement>(null);
  const isOther = choice === OTHER_REASON;
  const reason = isOther ? note.trim() : choice;

  useEffect(() => fieldsetRef.current?.focus(), []);

  const submit = async () => {
    if (!reason || isSubmitting) return;
    setIsSubmitting(true);
    setError(undefined);
    try {
      await onSubmit(reason);
    } catch (failure) {
      setError(
        getUserFriendlyErrorMessage(failure, 'Không thể từ chối yêu cầu. Vui lòng thử lại.'),
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid gap-4 border-t border-solid border-border-light pt-4">
      <fieldset
        ref={fieldsetRef}
        tabIndex={-1}
        className="m-0 grid gap-3 rounded-xl border-none p-0 outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
      >
        <legend className="mb-3 p-0 text-sm font-semibold text-text-main">
          Vì sao bạn từ chối?
        </legend>
        <div className="flex flex-wrap gap-2">
          {REJECT_REASONS.map((option) => {
            const checked = choice === option;
            return (
              <label
                key={option}
                className={`inline-flex min-h-11 cursor-pointer items-center rounded-full border border-solid px-4 text-sm font-semibold transition-colors focus-within:ring-4 focus-within:ring-primary/20 ${checked ? 'border-primary bg-primary text-white' : 'border-border-color bg-white text-text-secondary hover:border-primary-border hover:text-primary'}`}
              >
                <input
                  type="radio"
                  name="reject-reason"
                  value={option}
                  checked={checked}
                  onChange={() => setChoice(option)}
                  className="sr-only"
                />
                {option}
              </label>
            );
          })}
        </div>
        {isOther && (
          <label className="grid gap-1.5 text-xs font-medium text-text-secondary">
            Lý do của bạn
            <textarea
              required
              rows={3}
              maxLength={REJECT_NOTE_MAX}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Nhập lý do để mentee hiểu"
              className={`w-full resize-y rounded-xl border border-solid border-border-color bg-white px-3 py-2.5 text-sm text-text-main ${FOCUS_RING}`}
            />
            <span className="justify-self-end text-text-muted">
              {note.length}/{REJECT_NOTE_MAX}
            </span>
          </label>
        )}
        {/* The mentee-side "suggest another mentor" list is not built, so that half is dropped. */}
        <p className="m-0 text-xs text-text-muted">{mentee} sẽ thấy lý do này.</p>
      </fieldset>
      {error && (
        <p className="m-0 text-sm text-danger" role="alert">
          {error}
        </p>
      )}
      <div className="flex flex-col gap-2 md:flex-row md:justify-end">
        <button
          type="button"
          disabled={!reason || isSubmitting}
          onClick={() => void submit()}
          className={`order-first inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border-none bg-[#C4320A] px-5 text-sm font-bold text-white transition-colors hover:bg-[#a92a08] disabled:cursor-not-allowed disabled:opacity-50 md:order-last ${FOCUS_RING}`}
        >
          {isSubmitting && (
            <span
              className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
              aria-hidden="true"
            />
          )}
          Từ chối yêu cầu
        </button>
        <Button
          variant="outline"
          className="h-11 text-sm"
          disabled={isSubmitting}
          onClick={onCancel}
        >
          Quay lại
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------- Session rows ------------------------------ */

function SessionRow({
  booking,
  justAccepted,
  onDetail,
  onMessage,
  onCheckIn,
  onComplete,
}: {
  booking: MentorBookingResponse;
  justAccepted: boolean;
  onDetail: () => void;
  onMessage: () => void;
  onCheckIn: () => void;
  onComplete: () => void;
}) {
  const platform = getPlatformLabel(booking);
  const joinLabel = meetingPlatformLabel(booking.meetingPlatform);
  const joinAt = toDate(booking.joinAvailableAt);
  const pill = mentorStatusPill(booking);
  const canCheckIn = Boolean(
    booking.attendance?.canCheckIn && !booking.attendance.currentUserCheckedIn,
  );
  const details = [
    booking.menteeDisplayName || 'Mentee',
    `${priceLabel(booking)}${isBookingPaid(booking) ? ', đã thanh toán' : ''}`,
    platform,
  ]
    .filter(Boolean)
    .join(' · ');

  const join =
    booking.meetingLink && booking.meetingPlatform !== 'OFFLINE'
      ? booking.canJoin
        ? { label: `Vào ${joinLabel ?? 'phòng học'}`, disabled: false }
        : joinAt && joinAt.getTime() > Date.now()
          ? {
              label: `Vào ${joinLabel ?? 'phòng học'} · mở lúc ${formatTime(joinAt)}`,
              disabled: true,
            }
          : undefined
      : undefined;

  return (
    <article
      id={`booking-${booking.bookingId}`}
      className="grid gap-3 rounded-2xl border border-solid border-border-color/70 bg-white px-5 py-4 shadow-xs md:grid-cols-[110px_minmax(0,1fr)_auto] md:items-center"
    >
      <strong className="text-base font-bold text-text-main">{timeRange(booking)}</strong>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onDetail}
            className={`cursor-pointer truncate rounded border-none bg-transparent p-0 text-left text-sm font-semibold text-text-main hover:text-primary ${FOCUS_RING}`}
          >
            {booking.serviceTitle || 'Buổi mentoring'}
          </button>
          {justAccepted && (
            <span
              className="rounded-full px-2 py-0.5 text-xs font-bold"
              style={{ background: BOOKING_TONES.done.bg, color: BOOKING_TONES.done.text }}
            >
              Vừa nhận
            </span>
          )}
          {pill && (
            <span
              className="rounded-full px-2 py-0.5 text-xs font-semibold"
              style={{ background: pill.tone.bg, color: pill.tone.text }}
            >
              {pill.label}
            </span>
          )}
        </div>
        <p className="m-0 mt-0.5 truncate text-xs text-text-muted">{details}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2 md:justify-end">
        {canMessage(booking) && (
          <Button
            variant="outline"
            className="h-11 text-sm"
            leftIcon={<MessageSquare className="h-4 w-4" />}
            onClick={onMessage}
          >
            Nhắn
          </Button>
        )}
        {canCheckIn && (
          <Button
            variant="outline"
            className="h-11 text-sm"
            leftIcon={<LogIn className="h-4 w-4" />}
            onClick={onCheckIn}
          >
            Check-in
          </Button>
        )}
        {booking.canCompleteByMentor && (
          <Button className="h-11 text-sm" leftIcon={<Square />} onClick={onComplete}>
            Kết thúc
          </Button>
        )}
        {join && (
          <Button
            className="h-11 text-sm"
            variant={join.disabled ? 'secondary' : 'primary'}
            disabled={join.disabled}
            leftIcon={<Video />}
            onClick={() => window.open(booking.meetingLink ?? '', '_blank', 'noopener,noreferrer')}
          >
            {join.label}
          </Button>
        )}
      </div>
    </article>
  );
}

function EndedRow({
  booking,
  messageHref,
  onDetail,
}: {
  booking: MentorBookingResponse;
  messageHref: string;
  onDetail: () => void;
}) {
  const pill = mentorStatusPill(booking);
  const mentee = booking.menteeDisplayName || 'Mentee';
  return (
    <article
      id={`booking-${booking.bookingId}`}
      className="grid gap-2 rounded-2xl bg-white px-5 py-3.5 shadow-xs md:grid-cols-[90px_minmax(0,1fr)_auto] md:items-center"
    >
      <span className="text-xs text-text-muted">{shortStamp(booking)}</span>
      <div className="min-w-0">
        <button
          type="button"
          onClick={onDetail}
          className={`cursor-pointer rounded border-none bg-transparent p-0 text-left text-sm font-semibold text-text-secondary hover:text-primary ${FOCUS_RING}`}
        >
          {booking.serviceTitle || 'Buổi mentoring'} · {mentee}
        </button>
        <p className="m-0 mt-0.5 text-xs text-text-muted">{endedExplanation(booking)}</p>
      </div>
      <div className="flex flex-wrap items-center gap-3 md:justify-end">
        {pill && (
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
            style={{ background: pill.tone.bg, color: pill.tone.text }}
          >
            {isExpired(booking) && <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />}
            {pill.label}
          </span>
        )}
        {booking.menteeUserId && (
          <Link
            href={messageHref}
            className={`inline-flex min-h-11 items-center rounded text-sm font-semibold text-primary hover:underline ${FOCUS_RING}`}
          >
            Nhắn {mentee}
          </Link>
        )}
      </div>
    </article>
  );
}

/* ------------------------------ Detail / action ----------------------------- */

function BookingDetailModal({
  booking,
  isLoading,
  onAccept,
  onReject,
  onAction,
  onClose,
}: {
  booking?: MentorBookingResponse;
  isLoading: boolean;
  onAccept: () => void;
  onReject: () => void;
  onAction: (type: BookingAction) => void;
  onClose: () => void;
}) {
  if (!booking) return null;
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
          <BookingStatusBadge status={booking.bookingStatus || booking.displayState} />
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
        {booking.mentorResponseNote?.trim() && (
          <div className="mt-3">
            <Info
              icon={<MessageSquare />}
              label="Ghi chú của bạn"
              value={booking.mentorResponseNote.trim()}
            />
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
            <Button variant="destructive" className="h-10" onClick={onReject}>
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
              onClick={onAccept}
            >
              Nhận lịch
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
  isSaving,
  onClose,
  onSubmit,
}: {
  action?: { type: BookingAction; booking: MentorBookingResponse };
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (mutation: MentorBookingMutation) => void;
}) {
  const [note, setNote] = useState('');
  useEffect(() => {
    setNote('');
  }, [action]);

  if (!action) return null;
  const title = {
    complete: 'Kết thúc buổi mentoring',
    cancel: 'Hủy lịch đặt',
  }[action.type];
  const requiresReason = action.type === 'cancel';

  const submit = () => {
    const trimmedNote = note.trim();
    if (requiresReason && !trimmedNote) return;
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
          disabled={requiresReason && !note.trim()}
          onClick={submit}
        >
          Xác nhận
        </Button>
      </footer>
    </Modal>
  );
}
