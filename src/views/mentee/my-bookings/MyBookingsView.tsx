/**
 * @file MyBookingsView.tsx
 * @description Danh sách booking và các CTA theo capability backend dành cho Mentee.
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  LogIn,
  MessageSquare,
  RefreshCw,
  Video,
  XCircle,
} from 'lucide-react';
import { useMenteeShell } from '@/components/domain/mentee-shell/MenteeShell';
import { BookingStatusBadge } from '@/components/ui/BookingStatusBadge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { SelectField } from '@/components/ui/SelectField';
import type { BookingIssueType, MentorBookingResponse } from '@/models/auth';
import { showError, showSuccess } from '@/utils/toast';
import { type MenteeBookingMutation, type MenteeBookingTab, useMyBookings } from './useMyBookings';

const TABS: Array<{ value: MenteeBookingTab; label: string }> = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'WAITING', label: 'Đang chờ' },
  { value: 'IN_PROGRESS', label: 'Đang diễn ra' },
  { value: 'COMPLETED', label: 'Đã hoàn thành' },
  { value: 'NO_SHOW', label: 'Vắng mặt' },
  { value: 'REJECTED', label: 'Bị từ chối' },
  { value: 'EXPIRED', label: 'Quá hạn' },
  { value: 'CANCELLED_BY_MENTEE', label: 'Mentee hủy' },
  { value: 'CANCELLED_BY_MENTOR', label: 'Mentor hủy' },
];

type FormAction = 'cancel' | 'confirm' | 'reportIssue' | 'respondIssue';

function formatSchedule(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function MyBookingsView({ locale: _locale }: { locale: string }) {
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const { setHeaderTitle } = useMenteeShell();
  const {
    activeTab,
    bookings,
    counts,
    error,
    isLoading,
    isSaving,
    mutate,
    refresh,
    setActiveTab,
    setSortDirection,
    sortDirection,
  } = useMyBookings();
  const [formAction, setFormAction] = useState<{
    type: FormAction;
    booking: MentorBookingResponse;
  }>();

  useEffect(() => {
    setHeaderTitle('Lịch đặt');
    return () => setHeaderTitle(undefined);
  }, [setHeaderTitle]);

  const execute = async (booking: MentorBookingResponse, mutation: MenteeBookingMutation) => {
    try {
      await mutate(booking.bookingId, mutation);
      showSuccess({ title: 'Đã cập nhật lịch đặt', description: 'Thay đổi của bạn đã được lưu.' });
      setFormAction(undefined);
    } catch (reason) {
      showError(reason, { title: 'Không thể cập nhật lịch đặt' });
    }
  };

  return (
    <section className="mx-auto max-w-7xl space-y-6">
      <header className="rounded-3xl border border-border-light bg-white p-6 shadow-xs">
        <h1 className="m-0 text-2xl font-extrabold text-text-main">Lịch đặt của tôi</h1>
        <p className="mt-1 text-sm text-text-muted">
          Theo dõi và thực hiện các bước tiếp theo của buổi mentoring.
        </p>
      </header>
      {/* Line 1: Status Filter Tags */}
      <div
        className="flex max-w-full gap-2 overflow-x-auto pb-1"
        role="tablist"
        aria-label="Lọc lịch đặt"
      >
        {TABS.map((tab) => (
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === tab.value}
            className={`inline-flex h-12 shrink-0 items-center gap-2 rounded-xl border px-4 text-sm font-semibold outline-none transition-colors focus-visible:ring-3 focus-visible:ring-primary/20 ${activeTab === tab.value ? 'border-primary bg-primary text-white' : 'border-border-color bg-white text-text-secondary hover:border-primary-border hover:bg-primary-light hover:text-primary'}`}
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
          >
            {tab.label} ({counts[tab.value] ?? 0})
          </button>
        ))}
      </div>

      {/* Line 2: Sort Filter & Refresh Button */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border-color/80 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:w-64">
          <SelectField
            value={sortDirection}
            onValueChange={(val) => setSortDirection(val as 'ASC' | 'DESC')}
            options={[
              { value: 'DESC', label: 'Sắp xếp: Gần nhất trước' },
              { value: 'ASC', label: 'Sắp xếp: Xa nhất trước' },
            ]}
          />
        </div>
        <Button
          variant="outline"
          className="h-11 justify-center shrink-0 self-end sm:self-auto"
          leftIcon={<RefreshCw className="h-4 w-4" />}
          onClick={() => void refresh()}
          disabled={isLoading}
        >
          Làm mới
        </Button>
      </div>

      {error && (
        <div
          className="rounded-xl border border-red-200 bg-danger-soft p-4 text-sm text-danger"
          role="alert"
        >
          {error}
        </div>
      )}
      {isLoading ? (
        <div className="grid gap-4" aria-label="Đang tải lịch đặt">
          {[1, 2, 3].map((item) => (
            <div className="h-32 animate-pulse rounded-2xl bg-slate-100" key={item} />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-3xl border border-border-light bg-white p-12 text-center shadow-xs">
          <CalendarDays className="h-10 w-10 text-text-disabled" aria-hidden="true" />
          <strong className="text-text-main">Không có lịch đặt phù hợp.</strong>
          <span className="text-sm text-text-muted">Các booking của bạn sẽ xuất hiện tại đây.</span>
        </div>
      ) : (
        <div className="grid gap-4">
          {bookings.map((booking) => (
            <BookingCard
              booking={booking}
              key={booking.bookingId}
              onAction={(type) => setFormAction({ type, booking })}
              onImmediate={(mutation) => void execute(booking, mutation)}
              onMessage={() =>
                router.push(
                  `/${params.locale || 'vi'}/messages?participantId=${encodeURIComponent(booking.mentorUserId || '')}`,
                )
              }
            />
          ))}
        </div>
      )}
      <ActionModal
        action={formAction}
        isSaving={isSaving}
        onClose={() => setFormAction(undefined)}
        onSubmit={(mutation) => formAction && void execute(formAction.booking, mutation)}
      />
    </section>
  );
}

function BookingCard({
  booking,
  onAction,
  onImmediate,
  onMessage,
}: {
  booking: MentorBookingResponse;
  onAction: (type: FormAction) => void;
  onImmediate: (mutation: MenteeBookingMutation) => void;
  onMessage: () => void;
}) {
  const canCheckIn = Boolean(
    booking.attendance?.canCheckIn && !booking.attendance.currentUserCheckedIn,
  );
  const canMessage =
    Boolean(booking.conversationId || booking.mentorUserId) &&
    [
      'UPCOMING',
      'IN_SESSION',
      'WAITING_CONFIRMATION',
      'UNDER_REVIEW',
      'FEEDBACK_REQUIRED',
      'COMPLETED',
    ].includes(booking.displayState);

  const isPendingStatus =
    booking.bookingStatus === 'PENDING' ||
    booking.bookingStatus === 'REQUESTED' ||
    booking.displayState === 'PENDING_MENTOR_RESPONSE';
  const canCancel = booking.canCancel && isPendingStatus;

  return (
    <article className="grid gap-4 rounded-2xl border border-border-color bg-white p-5 shadow-xs">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid gap-1">
          <strong className="text-base text-text-main">
            {booking.serviceTitle || 'Dịch vụ mentoring'}
          </strong>
          <span className="text-sm text-text-muted">
            với {booking.mentorDisplayName || 'Mentor'}
          </span>
        </div>
        <BookingStatusBadge status={booking.bookingStatus || booking.displayState} />
      </div>
      <div className="flex items-center gap-2 text-sm text-text-muted">
        <CalendarDays className="h-4 w-4 text-primary" />
        {formatSchedule(booking.selectedStartTime)}
      </div>
      <div className="flex flex-wrap justify-end gap-2 border-t border-border-light pt-4">
        {booking.canPay && (
          <Button leftIcon={<CreditCard />} onClick={() => onImmediate({ type: 'pay' })}>
            Thanh toán
          </Button>
        )}
        {canCheckIn && (
          <Button leftIcon={<LogIn />} onClick={() => onImmediate({ type: 'checkIn' })}>
            Check-in
          </Button>
        )}
        {booking.canJoin && booking.meetingLink && (
          <Button
            leftIcon={<Video />}
            onClick={() => window.open(booking.meetingLink || '', '_blank', 'noopener,noreferrer')}
          >
            Tham gia
          </Button>
        )}
        {booking.canConfirmByMentee && (
          <Button leftIcon={<CheckCircle2 />} onClick={() => onAction('confirm')}>
            Xác nhận hoàn tất
          </Button>
        )}
        {canMessage && (
          <Button variant="outline" leftIcon={<MessageSquare />} onClick={onMessage}>
            Nhắn tin
          </Button>
        )}
        {booking.canReportIssue && (
          <Button
            variant="outline"
            leftIcon={<AlertTriangle />}
            onClick={() => onAction('reportIssue')}
          >
            Báo vấn đề
          </Button>
        )}
        {booking.canRespondIssue && (
          <Button variant="outline" onClick={() => onAction('respondIssue')}>
            Phản hồi vấn đề
          </Button>
        )}
        {canCancel && (
          <Button variant="destructive" leftIcon={<XCircle />} onClick={() => onAction('cancel')}>
            Hủy lịch
          </Button>
        )}
      </div>
    </article>
  );
}

function ActionModal({
  action,
  isSaving,
  onClose,
  onSubmit,
}: {
  action?: { type: FormAction; booking: MentorBookingResponse };
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (mutation: MenteeBookingMutation) => void;
}) {
  const [note, setNote] = useState('');
  const [issueType, setIssueType] = useState<BookingIssueType>('OTHER');
  useEffect(() => {
    setNote('');
    setIssueType('OTHER');
  }, [action]);
  if (!action) return null;
  const titles = {
    cancel: 'Hủy lịch đặt',
    confirm: 'Xác nhận hoàn tất',
    reportIssue: 'Báo vấn đề',
    respondIssue: 'Phản hồi vấn đề',
  };
  const submit = () => {
    const value = note.trim();
    if (action.type !== 'confirm' && !value) return;
    if (action.type === 'cancel') onSubmit({ type: 'cancel', reason: value });
    if (action.type === 'confirm')
      onSubmit({ type: 'confirm', data: { confirmationNote: value || undefined } });
    if (action.type === 'reportIssue')
      onSubmit({ type: 'reportIssue', data: { issueType, description: value, evidenceIds: [] } });
    if (action.type === 'respondIssue') onSubmit({ type: 'respondIssue', responseNote: value });
  };
  return (
    <Modal open title={titles[action.type]} onClose={onClose}>
      <div className="grid gap-4">
        {action.type === 'reportIssue' && (
          <SelectField
            label="Loại vấn đề"
            required
            value={issueType}
            onValueChange={(val) => setIssueType(val as BookingIssueType)}
            options={[
              { value: 'MENTOR_NO_SHOW', label: 'Mentor không tham gia' },
              { value: 'QUALITY_ISSUE', label: 'Chất lượng buổi học' },
              { value: 'TECHNICAL_PROBLEM', label: 'Sự cố kỹ thuật' },
              { value: 'OTHER', label: 'Vấn đề khác' },
            ]}
          />
        )}
        <label className="grid gap-2 text-sm font-semibold text-text-main">
          <span>
            {action.type === 'cancel' ? 'Lý do hủy' : 'Ghi chú'}{' '}
            {action.type !== 'confirm' && <b>*</b>}
          </span>
          <textarea
            className="min-h-28 resize-y rounded-xl border border-border-color p-3 font-normal outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            value={note}
            maxLength={2000}
            onChange={(event) => setNote(event.target.value)}
          />
        </label>
      </div>
      <footer className="mt-6 flex flex-wrap justify-end gap-2 border-t border-border-light pt-4">
        <Button variant="outline" onClick={onClose}>
          Đóng
        </Button>
        <Button onClick={submit} disabled={isSaving || (action.type !== 'confirm' && !note.trim())}>
          {isSaving ? 'Đang xử lý...' : 'Xác nhận'}
        </Button>
      </footer>
    </Modal>
  );
}
