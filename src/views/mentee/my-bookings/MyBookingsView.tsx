/**
 * @file MyBookingsView.tsx
 * @description Danh sách booking và các CTA theo capability backend dành cho Mentee.
 */

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { CalendarDays, Plus, RefreshCw } from 'lucide-react';
import { useMenteeShell } from '@/components/domain/mentee-shell/MenteeShell';
import { SelectField } from '@/components/ui/SelectField';
import type { MentorBookingResponse } from '@/models/auth';
import { getUserFriendlyErrorMessage, showError, showSuccess } from '@/utils/toast';
import {
  BOOKING_TAB_GROUPS,
  type BookingTabGroup,
  getBookingStateKey,
  getBookingTabGroup,
  getMentorName,
  isActionableExpiry,
} from './bookingStatusConfig';
import { ActionModal, type NoteActionType } from './components/ActionModal';
import { BookingCard, type BookingFormAction } from './components/BookingCard';
import { CancelBookingModal } from './components/CancelBookingModal';
import styles from './MyBookingsView.module.css';
import { useDismissedExpiries } from './useDismissedExpiries';
import { type MenteeBookingMutation, useMyBookings } from './useMyBookings';

export function MyBookingsView({ locale: localeProp }: { locale: string }) {
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const locale = params.locale || localeProp || 'vi';
  const { setHeaderTitle } = useMenteeShell();
  // The hook's own status filter stays on 'ALL'; user-facing tab groups are derived here.
  const { bookings, error, isLoading, isSaving, mutate, refresh, setSortDirection, sortDirection } =
    useMyBookings();
  const [activeGroup, setActiveGroup] = useState<BookingTabGroup>('ALL');
  const { dismissedIds, dismiss, now } = useDismissedExpiries();
  const [noteAction, setNoteAction] = useState<{
    type: NoteActionType;
    booking: MentorBookingResponse;
  }>();
  const [cancelTarget, setCancelTarget] = useState<MentorBookingResponse>();
  const [cancelError, setCancelError] = useState<string>();
  const cancelTriggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setHeaderTitle('Lịch đặt');
    return () => setHeaderTitle(undefined);
  }, [setHeaderTitle]);

  // Notification links open `#booking-<id>`; the list loads async, so scroll once it is rendered.
  useEffect(() => {
    if (isLoading || !window.location.hash.startsWith('#booking-')) return;
    document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ block: 'center' });
  }, [isLoading]);

  // Mentor-expired requests whose session is still ahead stay in "Cần bạn xử lý" until dismissed.
  const actionableExpiryIds = useMemo(
    () =>
      new Set(
        bookings
          .filter((booking) => isActionableExpiry(booking, dismissedIds, now))
          .map((booking) => booking.bookingId),
      ),
    [bookings, dismissedIds, now],
  );

  const counts = useMemo(() => {
    const result: Record<BookingTabGroup, number> = {
      ALL: bookings.length,
      NEEDS_ACTION: 0,
      WAITING: 0,
      UPCOMING: 0,
      ENDED: 0,
      CANCELED: 0,
    };
    bookings.forEach((booking) => {
      result[getBookingTabGroup(booking, actionableExpiryIds.has(booking.bookingId))] += 1;
    });
    return result;
  }, [actionableExpiryIds, bookings]);

  const visibleBookings = useMemo(
    () =>
      activeGroup === 'ALL'
        ? bookings
        : bookings.filter(
            (booking) =>
              getBookingTabGroup(booking, actionableExpiryIds.has(booking.bookingId)) ===
              activeGroup,
          ),
    [actionableExpiryIds, activeGroup, bookings],
  );

  const openChat = (booking: MentorBookingResponse) =>
    router.push(
      `/${locale}/messages?participantId=${encodeURIComponent(booking.mentorUserId || '')}`,
    );

  const execute = async (booking: MentorBookingResponse, mutation: MenteeBookingMutation) => {
    try {
      await mutate(booking.bookingId, mutation);
      showSuccess({ title: 'Đã cập nhật lịch đặt', description: 'Thay đổi của bạn đã được lưu.' });
      setNoteAction(undefined);
    } catch (reason) {
      showError(reason, { title: 'Không thể cập nhật lịch đặt' });
    }
  };

  const closeCancel = () => {
    setCancelTarget(undefined);
    setCancelError(undefined);
    const trigger = cancelTriggerRef.current;
    // Modal restores its own previous focus first; re-focus the card's cancel button after it.
    window.setTimeout(() => {
      if (trigger?.isConnected) trigger.focus();
    }, 0);
  };

  const submitCancel = async (reason: string) => {
    if (!cancelTarget) return;
    const booking = cancelTarget;
    setCancelError(undefined);
    try {
      await mutate(booking.bookingId, { type: 'cancel', reason });
      const subject = getBookingStateKey(booking) === 'PENDING' ? 'yêu cầu' : 'lịch';
      showSuccess(`Đã hủy ${subject}. ${getMentorName(booking)} đã được thông báo.`);
      closeCancel();
    } catch (failure) {
      setCancelError(
        getUserFriendlyErrorMessage(failure, 'Không thể hủy lịch lúc này. Vui lòng thử lại sau.'),
      );
    }
  };

  const handleAction = (
    booking: MentorBookingResponse,
    type: BookingFormAction,
    trigger?: HTMLElement | null,
  ) => {
    if (type === 'cancel') {
      cancelTriggerRef.current = trigger ?? null;
      setCancelError(undefined);
      setCancelTarget(booking);
      return;
    }
    setNoteAction({ type, booking });
  };

  return (
    <section className={styles.page}>
      <header className={styles.headerCard}>
        <div>
          <h1 className={styles.headerTitle}>Lịch đặt của tôi</h1>
          <p className={styles.headerSubtitle}>
            Xem mỗi buổi đang ở bước nào và việc tiếp theo cần làm.
          </p>
        </div>
        <Link className={`${styles.btn} ${styles.btnPrimary}`} href={`/${locale}/mentor-booking`}>
          <Plus aria-hidden="true" />
          Đặt buổi mới
        </Link>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.tabs} role="tablist" aria-label="Lọc lịch đặt">
          {BOOKING_TAB_GROUPS.map((tab) => {
            const selected = activeGroup === tab.value;
            const count = counts[tab.value];
            return (
              <button
                type="button"
                role="tab"
                id={`booking-tab-${tab.value}`}
                aria-selected={selected}
                aria-controls="booking-tab-panel"
                className={`${styles.tab} ${selected ? styles.tabActive : ''} ${count === 0 ? styles.tabEmpty : ''}`}
                key={tab.value}
                onClick={() => setActiveGroup(tab.value)}
              >
                {tab.label}
                <span
                  className={`${styles.tabCount} ${tab.value === 'NEEDS_ACTION' && count > 0 ? styles.tabCountAlert : ''}`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        <div className={styles.toolbarRight}>
          <div className={styles.sortSelect}>
            <SelectField
              placeholder="Sắp xếp lịch đặt"
              triggerClassName="h-11 text-sm"
              value={sortDirection}
              onValueChange={(val) => setSortDirection(val as 'ASC' | 'DESC')}
              options={[
                { value: 'DESC', label: 'Gần nhất trước' },
                { value: 'ASC', label: 'Xa nhất trước' },
              ]}
            />
          </div>
          <button
            type="button"
            className={styles.iconBtn}
            aria-label="Làm mới"
            title="Làm mới"
            onClick={() => void refresh()}
            disabled={isLoading}
          >
            <RefreshCw aria-hidden="true" />
          </button>
        </div>
      </div>

      <div
        id="booking-tab-panel"
        role="tabpanel"
        aria-labelledby={`booking-tab-${activeGroup}`}
        className="grid gap-4"
      >
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
              <div className="h-40 animate-pulse rounded-[20px] bg-slate-100" key={item} />
            ))}
          </div>
        ) : visibleBookings.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-[20px] bg-white p-12 text-center shadow-xs">
            <CalendarDays className="h-10 w-10 text-text-disabled" aria-hidden="true" />
            <strong className="text-text-main">Không có lịch đặt phù hợp.</strong>
            <span className="text-sm text-text-muted">
              Các booking của bạn sẽ xuất hiện tại đây.
            </span>
          </div>
        ) : (
          visibleBookings.map((booking) => (
            <BookingCard
              booking={booking}
              key={booking.bookingId}
              locale={locale}
              isActionableExpiry={actionableExpiryIds.has(booking.bookingId)}
              onDismissExpiry={() => dismiss(booking.bookingId)}
              onAction={(type, trigger) => handleAction(booking, type, trigger)}
              onImmediate={(mutation) => void execute(booking, mutation)}
              onMessage={() => openChat(booking)}
            />
          ))
        )}
      </div>

      <ActionModal
        action={noteAction}
        isSaving={isSaving}
        onClose={() => setNoteAction(undefined)}
        onSubmit={(mutation) => noteAction && void execute(noteAction.booking, mutation)}
      />
      <CancelBookingModal
        booking={cancelTarget}
        isSaving={isSaving}
        error={cancelError}
        onClose={closeCancel}
        onSubmit={(reason) => void submitCancel(reason)}
        onMessage={() => {
          const booking = cancelTarget;
          setCancelTarget(undefined);
          setCancelError(undefined);
          if (booking) openChat(booking);
        }}
      />
    </section>
  );
}
