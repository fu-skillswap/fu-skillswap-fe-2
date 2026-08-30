/**
 * @file MentorBookingsView.tsx
 * @description Trang quản lý booking theo góc nhìn Mentor.
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownUp,
  CalendarDays,
  CalendarX,
  Check,
  CheckCircle2,
  ChevronDown,
  PlayCircle,
  Eye,
  Filter,
  Mail,
  RefreshCw,
  Square,
  XCircle,
} from 'lucide-react';
import { useMenteeShell } from '@/components/domain/mentee-shell/MenteeShell';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import type { MentorBookingResponse } from '@/models/auth';
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
  { value: 'NEW', label: 'Booking mới', icon: Mail },
  { value: 'UPCOMING', label: 'Sắp tới', icon: CalendarDays },
  { value: 'IN_PROGRESS', label: 'Đang diễn ra', icon: PlayCircle },
  { value: 'COMPLETED', label: 'Hoàn thành', icon: CheckCircle2 },
  { value: 'CANCELLED', label: 'Đã hủy', icon: XCircle },
  { value: 'ALL', label: 'Tất cả', icon: Filter },
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

function statusPresentation(booking: MentorBookingResponse) {
  const group = bookingFilterOf(booking);
  if (group === 'NEW') return { label: 'Booking mới', variant: 'info' as const, icon: <Mail /> };
  if (group === 'UPCOMING') {
    return { label: 'Sắp tới', variant: 'info' as const, icon: <CalendarDays /> };
  }
  if (group === 'IN_PROGRESS') {
    return { label: 'Đang diễn ra', variant: 'info' as const, icon: <PlayCircle /> };
  }
  if (group === 'COMPLETED') {
    return { label: 'Hoàn thành', variant: 'success' as const, icon: <CheckCircle2 /> };
  }
  return { label: 'Đã hủy', variant: 'danger' as const, icon: <XCircle /> };
}

function emptyText(filter: MentorBookingFilter) {
  if (filter === 'NEW') {
    return ['Hiện chưa có booking mới.', 'Các yêu cầu đặt lịch mới sẽ xuất hiện tại đây.'];
  }
  const label = FILTERS.find((item) => item.value === filter)?.label.toLowerCase() ?? 'phù hợp';
  return [`Không có booking ${label}.`, 'Hãy chọn bộ lọc khác để xem các lịch đặt của bạn.'];
}

export function MentorBookingsView() {
  const { setHeaderTitle } = useMenteeShell();
  const {
    activeFilter,
    bookings,
    counts,
    error,
    isLoading,
    isSaving,
    loadDetail,
    mutate,
    refresh,
    selectedDate,
    setActiveFilter,
    setSelectedDate,
    setSortDirection,
    sortDirection,
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
        showSuccess('Đã cập nhật booking thành công.');
        setAction(undefined);
        setDetail(undefined);
      }
    } catch (reason) {
      showError(reason instanceof Error ? reason.message : 'Không thể cập nhật booking.');
    }
  };

  return (
    <section className="mentor-bookings-page">
      <header className="mentor-bookings-heading">
        <h1>Lịch đặt</h1>
        <p>Quản lý và theo dõi các lịch mentoring của bạn.</p>
      </header>

      <div className="mentor-booking-toolbar">
        <div className="mentor-booking-filters" role="tablist" aria-label="Lọc lịch đặt">
          {FILTERS.map((filter) => {
            const Icon = filter.icon;
            return (
              <button
                type="button"
                role="tab"
                aria-selected={activeFilter === filter.value}
                className={activeFilter === filter.value ? 'is-active' : ''}
                key={filter.value}
                onClick={() => setActiveFilter(filter.value)}
              >
                <Icon aria-hidden="true" />
                {filter.label} ({counts[filter.value]})
              </button>
            );
          })}
        </div>
        <div className="mentor-booking-filter-actions">
          <label className="mentor-booking-date-filter">
            <CalendarDays aria-hidden="true" />
            <span>{selectedDate || 'Chọn ngày'}</span>
            <input
              type="date"
              value={selectedDate}
              aria-label="Chọn ngày booking"
              onChange={(event) => setSelectedDate(event.target.value)}
            />
          </label>
          <button type="button" onClick={() => setShowAdvancedFilter((value) => !value)}>
            <Filter aria-hidden="true" /> Bộ lọc
          </button>
        </div>
      </div>

      {showAdvancedFilter && (
        <div className="mentor-booking-advanced-filter">
          <label>
            <span className="mentor-booking-advanced-label">
              <ArrowDownUp aria-hidden="true" />
              Sắp xếp theo thời gian
            </span>
            <span className="mentor-booking-sort-select">
              <select
                value={sortDirection}
                onChange={(event) => setSortDirection(event.target.value as 'ASC' | 'DESC')}
              >
                <option value="ASC">Gần nhất trước</option>
                <option value="DESC">Xa nhất trước</option>
              </select>
              <ChevronDown aria-hidden="true" />
            </span>
          </label>
          <button
            type="button"
            className="mentor-booking-clear-date"
            onClick={() => setSelectedDate('')}
            disabled={!selectedDate}
          >
            <CalendarX aria-hidden="true" />
            Xóa ngày đã chọn
          </button>
        </div>
      )}

      {error && (
        <div className="mentor-booking-error" role="alert">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={() => void refresh()}>
            Thử lại
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="mentor-booking-list" aria-label="Đang tải lịch đặt">
          {[1, 2, 3, 4].map((item) => (
            <div className="mentor-booking-row-skeleton" key={item} />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="mentor-booking-empty">
          <CalendarDays aria-hidden="true" />
          <strong>{empty[0]}</strong>
          <span>{empty[1]}</span>
        </div>
      ) : (
        <div className="mentor-booking-list">
          {bookings.map((booking) => (
            <BookingRow
              booking={booking}
              key={booking.bookingId}
              onAction={(type) => setAction({ type, booking })}
              onDetail={() => void openDetail(booking)}
            />
          ))}
        </div>
      )}

      <BookingDetailModal
        booking={detail}
        isLoading={isDetailLoading}
        onAction={(type) => detail && setAction({ type, booking: detail })}
        onClose={() => setDetail(undefined)}
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

function BookingRow({
  booking,
  onAction,
  onDetail,
}: {
  booking: MentorBookingResponse;
  onAction: (type: BookingAction) => void;
  onDetail: () => void;
}) {
  const status = statusPresentation(booking);
  const primaryAction = booking.canAccept
    ? { label: 'Xác nhận', icon: <Check />, action: () => onAction('accept') }
    : booking.canCompleteByMentor
      ? { label: 'Kết thúc', icon: <Square />, action: () => onAction('complete') }
      : booking.canJoin && booking.meetingLink
        ? {
            label: 'Tham gia',
            icon: <PlayCircle />,
            action: () => window.open(booking.meetingLink ?? '', '_blank', 'noopener,noreferrer'),
          }
        : undefined;

  return (
    <article className="mentor-booking-row">
      <div className="mentor-booking-identity">
        {booking.menteeAvatarUrl ? (
          <img src={booking.menteeAvatarUrl} alt={booking.menteeDisplayName} />
        ) : (
          <span aria-hidden="true">{initials(booking.menteeDisplayName)}</span>
        )}
        <div>
          <strong>{booking.serviceTitle || 'Dịch vụ mentoring'}</strong>
          <small>với {booking.menteeDisplayName}</small>
        </div>
      </div>
      <div className="mentor-booking-schedule">
        <CalendarDays aria-hidden="true" />
        <span>{formatSchedule(booking.selectedStartTime)}</span>
      </div>
      <Badge variant={status.variant} icon={status.icon} className="mentor-booking-status">
        {status.label}
      </Badge>
      <div className="mentor-booking-actions">
        <Button variant="outline" leftIcon={<Eye />} onClick={onDetail}>
          Chi tiết
        </Button>
        {primaryAction && (
          <Button leftIcon={primaryAction.icon} onClick={primaryAction.action}>
            {primaryAction.label}
          </Button>
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
  return (
    <Modal open onClose={onClose} title="Chi tiết lịch đặt" className="mentor-booking-modal">
      <div className="mentor-booking-detail-content">
        {isLoading && <RefreshCw className="mentor-booking-detail-spinner" aria-label="Đang tải" />}
        <div className="mentor-booking-detail-grid">
          <Info label="Dịch vụ" value={booking.serviceTitle || 'Dịch vụ mentoring'} />
          <Info label="Mentee" value={booking.menteeDisplayName} />
          <Info label="Thời gian bắt đầu" value={formatSchedule(booking.selectedStartTime)} />
          <Info label="Thời gian kết thúc" value={formatSchedule(booking.selectedEndTime)} />
          <Info label="Trạng thái" value={status.label} />
          <Info label="Nền tảng" value={booking.meetingPlatform || 'Chưa thiết lập'} />
        </div>
        <Info label="Mục tiêu" value={booking.learningGoalTitle || 'Không có'} />
        {booking.learningGoalDescription && (
          <Info label="Mô tả mục tiêu" value={booking.learningGoalDescription} />
        )}
        {booking.meetingLink && (
          <a href={booking.meetingLink} target="_blank" rel="noreferrer">
            Mở liên kết buổi mentoring
          </a>
        )}
        {booking.location && <Info label="Địa điểm" value={booking.location} />}
      </div>
      <footer className="mentor-booking-modal-footer">
        <Button variant="outline" onClick={onClose}>
          Đóng
        </Button>
        <div>
          {booking.canReject && (
            <Button variant="destructive" onClick={() => onAction('reject')}>
              Từ chối
            </Button>
          )}
          {booking.canCancel && !booking.canReject && (
            <Button variant="destructive" onClick={() => onAction('cancel')}>
              Hủy lịch
            </Button>
          )}
          {booking.canAccept && <Button onClick={() => onAction('accept')}>Xác nhận</Button>}
          {booking.canCompleteByMentor && (
            <Button onClick={() => onAction('complete')}>Kết thúc</Button>
          )}
        </div>
      </footer>
    </Modal>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="mentor-booking-detail-info">
      <small>{label}</small>
      <strong>{value}</strong>
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
  const [meetingPlatform, setMeetingPlatform] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [location, setLocation] = useState('');

  useEffect(() => {
    setNote('');
    setMeetingPlatform('');
    setMeetingLink('');
    setLocation('');
  }, [action]);

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
      onSubmit({
        type: 'accept',
        data: {
          mentorResponseNote: trimmedNote || undefined,
          meetingPlatform: meetingPlatformOf(meetingPlatform),
          meetingLink: meetingLink.trim() || undefined,
          location: location.trim() || undefined,
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
    <Modal open onClose={onClose} title={title} className="mentor-booking-action-modal">
      <div className="mentor-booking-action-form">
        {action.type === 'accept' && (
          <>
            <label>
              Nền tảng buổi mentoring
              <select
                value={meetingPlatform}
                onChange={(event) => setMeetingPlatform(event.target.value)}
              >
                <option value="">Tự động theo cấu hình hiện tại</option>
                <option value="GOOGLE_MEET">Google Meet</option>
                <option value="ZOOM">Zoom</option>
                <option value="MICROSOFT_TEAMS">Microsoft Teams</option>
                <option value="DISCORD">Discord</option>
                <option value="OFFLINE">Trực tiếp</option>
                <option value="OTHER">Khác</option>
              </select>
            </label>
            {meetingPlatform && meetingPlatform !== 'OFFLINE' && (
              <label>
                Liên kết cuộc họp
                <input
                  type="url"
                  value={meetingLink}
                  onChange={(event) => setMeetingLink(event.target.value)}
                  placeholder="https://..."
                />
              </label>
            )}
            {meetingPlatform === 'OFFLINE' && (
              <label>
                Địa điểm
                <input
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
            onChange={(event) => setNote(event.target.value)}
            placeholder={requiresReason ? 'Nhập lý do để người học biết...' : 'Nhập ghi chú...'}
          />
        </label>
      </div>
      <footer className="mentor-booking-modal-footer">
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
