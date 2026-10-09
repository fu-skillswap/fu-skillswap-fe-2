/**
 * @file EventPopover.tsx
 * @description Google-Calendar-style detail popover for a booking event (bottom sheet on mobile).
 */

'use client';

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  LogIn,
  MapPin,
  MessageSquare,
  Repeat,
  Video,
  X,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { MentorBookingResponse } from '@/models/auth';
import { getBookingActions, platformLabel } from '../bookingActions';
import type { MenteeBookingMutation } from '../useMyBookings';
import { TONE_STYLES, getBookingTone } from './bookingColors';
import { formatLongDay, formatTime, formatTimeRange, parseDate } from './calendarUtils';

export type BookingFormAction = 'cancel' | 'confirm' | 'reportIssue' | 'respondIssue';

export interface BookingEventHandlers {
  onAction: (booking: MentorBookingResponse, type: BookingFormAction) => void;
  onImmediate: (booking: MentorBookingResponse, mutation: MenteeBookingMutation) => void;
  onMessage: (booking: MentorBookingResponse) => void;
}

const GAP = 8;
const MARGIN = 12;

export function MentorInitialsAvatar({
  name,
  url,
  className = 'h-8 w-8 text-xs',
}: {
  name?: string | null;
  url?: string | null;
  className?: string;
}) {
  const initials =
    (name || 'Mentor')
      .split(/\s+/)
      .filter(Boolean)
      .slice(-2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || 'M';
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt="" className={`${className} shrink-0 rounded-full object-cover`} />
    );
  }
  return (
    <span
      className={`${className} inline-flex shrink-0 items-center justify-center rounded-full bg-primary-light font-bold text-primary`}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}

export function EventPopover({
  booking,
  anchor,
  locale,
  isSaving,
  handlers,
  onClose,
}: {
  booking: MentorBookingResponse;
  anchor: HTMLElement;
  locale: string;
  isSaving: boolean;
  handlers: BookingEventHandlers;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [isSheet, setIsSheet] = useState(false);
  const [position, setPosition] = useState<CSSProperties>({ visibility: 'hidden' });

  // Place the popover beside the event (right, else left), else above/below; never over it.
  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const sheet = window.matchMedia('(max-width: 639px)').matches;
    setIsSheet(sheet);
    if (sheet) {
      setPosition({});
      return;
    }
    const rect = anchor.getBoundingClientRect();
    const width = panel.offsetWidth;
    const height = panel.offsetHeight;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const clampTop = (top: number) =>
      Math.min(Math.max(MARGIN, top), Math.max(MARGIN, viewportHeight - height - MARGIN));
    const clampLeft = (left: number) =>
      Math.min(Math.max(MARGIN, left), Math.max(MARGIN, viewportWidth - width - MARGIN));

    if (rect.right + GAP + width + MARGIN <= viewportWidth) {
      setPosition({ top: clampTop(rect.top), left: rect.right + GAP });
    } else if (rect.left - GAP - width >= MARGIN) {
      setPosition({ top: clampTop(rect.top), left: rect.left - GAP - width });
    } else if (rect.top - GAP - height >= MARGIN) {
      setPosition({ top: rect.top - GAP - height, left: clampLeft(rect.left) });
    } else {
      setPosition({ top: clampTop(rect.bottom + GAP), left: clampLeft(rect.left) });
    }
  }, [anchor, booking]);

  // Focus moves into the popover and returns to the event when it closes.
  useEffect(() => {
    panelRef.current?.focus();
    return () => {
      if (anchor.isConnected) anchor.focus();
    };
  }, [anchor]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || anchor.contains(target)) return;
      onClose();
    };
    // The event moves when its grid scrolls, so a fixed popover would drift away from it.
    const onScroll = (event: Event) => {
      if (panelRef.current?.contains(event.target as Node)) return;
      onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onClose);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onClose);
    };
  }, [anchor, onClose]);

  const start = parseDate(booking.selectedStartTime);
  const end = parseDate(booking.selectedEndTime);
  const joinAt = parseDate(booking.joinAvailableAt);
  const { tone, label } = getBookingTone(booking);
  const toneStyle = TONE_STYLES[tone];
  const actions = getBookingActions(booking);
  const platform = platformLabel(booking);
  const isOffline = booking.meetingPlatform === 'OFFLINE';
  const title = booking.serviceTitle || 'Dịch vụ mentoring';
  const mentorId = booking.mentorUserId;
  const run = (callback: () => void) => {
    onClose();
    callback();
  };

  return (
    <>
      {isSheet && <div className="fixed inset-0 z-[60] bg-slate-900/30" aria-hidden="true" />}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal={isSheet || undefined}
        aria-label={title}
        tabIndex={-1}
        style={isSheet ? undefined : position}
        className={
          isSheet
            ? 'fixed inset-x-0 bottom-0 z-[61] max-h-[85vh] overflow-y-auto rounded-t-2xl border border-border-light bg-white p-5 shadow-xl outline-none'
            : 'fixed z-[61] w-[min(360px,calc(100vw-24px))] rounded-2xl border border-border-light bg-white p-5 shadow-xl outline-none'
        }
      >
        <div className="flex items-start gap-3">
          <span
            className="mt-1.5 h-3.5 w-3.5 shrink-0 rounded"
            style={{ backgroundColor: toneStyle.swatch }}
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1">
            <h2
              className={`m-0 text-base font-extrabold text-text-main ${toneStyle.strike ? 'line-through' : ''}`}
            >
              {title}
            </h2>
            {start && (
              <p className="mt-0.5 text-sm text-text-muted">
                {formatLongDay(start)} · {formatTimeRange(start, end)}
              </p>
            )}
          </div>
          <button
            type="button"
            aria-label="Đóng"
            onClick={onClose}
            className="-mr-1 -mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-muted outline-none hover:bg-surface-subtle focus-visible:ring-3 focus-visible:ring-primary/20"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 grid gap-2.5 text-sm">
          <div className="flex items-center gap-2.5">
            <MentorInitialsAvatar name={booking.mentorDisplayName} url={booking.mentorAvatarUrl} />
            <span className="font-semibold text-text-main">
              {booking.mentorDisplayName || 'Mentor'}
            </span>
            <span className="text-text-muted">· Mentor</span>
          </div>
          {(booking.meetingPlatform || booking.location) && (
            <div className="flex items-center gap-2.5 text-text-secondary">
              {isOffline ? (
                <MapPin className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              ) : (
                <Video className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              )}
              <span>
                {isOffline
                  ? booking.location || 'Gặp trực tiếp'
                  : `${platform}${joinAt ? ` · mở lúc ${formatTime(joinAt)}` : ''}`}
              </span>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="rounded-full px-2.5 py-0.5 text-xs font-bold"
              style={{
                backgroundColor: tone === 'closed' ? '#F1F5F9' : `${toneStyle.swatch}1F`,
                color: tone === 'closed' ? '#475569' : '#1E293B',
              }}
            >
              {label}
            </span>
            {booking.servicePriceScoinSnapshot != null && (
              <span className="rounded-full bg-surface-subtle px-2.5 py-0.5 text-xs font-bold text-text-secondary">
                {booking.servicePriceScoinSnapshot.toLocaleString('vi-VN')} S-coins
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 border-t border-border-light pt-4">
          {actions.canPay && (
            <Button
              leftIcon={<CreditCard className="h-4 w-4" />}
              loading={isSaving}
              onClick={() => run(() => handlers.onImmediate(booking, { type: 'pay' }))}
            >
              Thanh toán
            </Button>
          )}
          {actions.canJoin && (
            <Button
              leftIcon={<Video className="h-4 w-4" />}
              onClick={() =>
                window.open(booking.meetingLink || '', '_blank', 'noopener,noreferrer')
              }
            >
              Vào {platform}
            </Button>
          )}
          {actions.canCheckIn && (
            <Button
              leftIcon={<LogIn className="h-4 w-4" />}
              loading={isSaving}
              onClick={() => run(() => handlers.onImmediate(booking, { type: 'checkIn' }))}
            >
              Điểm danh
            </Button>
          )}
          {actions.canConfirm && (
            <Button
              leftIcon={<CheckCircle2 className="h-4 w-4" />}
              onClick={() => run(() => handlers.onAction(booking, 'confirm'))}
            >
              Xác nhận đã học
            </Button>
          )}
          {tone === 'completed' && mentorId && (
            <Link
              href={`/${locale}/mentor-booking?mentorId=${encodeURIComponent(mentorId)}`}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4.5 text-xs font-bold text-white no-underline shadow-xs outline-none hover:bg-primary-hover focus-visible:ring-4 focus-visible:ring-primary/20"
            >
              <Repeat className="h-4 w-4" aria-hidden="true" />
              Đặt buổi tiếp
            </Link>
          )}
          {/* TODO(api): show "Đánh giá" when nextAction === 'LEAVE_FEEDBACK' once a mentee feedback
              endpoint/flow exists (none in bookingRepo yet). */}
          {actions.canReportIssue && (
            <Button
              variant="outline"
              leftIcon={<AlertTriangle className="h-4 w-4" />}
              onClick={() => run(() => handlers.onAction(booking, 'reportIssue'))}
            >
              Báo sự cố
            </Button>
          )}
          {actions.canRespondIssue && (
            <Button
              variant="outline"
              onClick={() => run(() => handlers.onAction(booking, 'respondIssue'))}
            >
              Phản hồi sự cố
            </Button>
          )}
          {actions.canMessage && (
            <Button
              variant="outline"
              leftIcon={<MessageSquare className="h-4 w-4" />}
              onClick={() => run(() => handlers.onMessage(booking))}
            >
              Nhắn
            </Button>
          )}
          {actions.canCancel && (
            <Button
              variant="outline"
              className="!border-red-200 !text-danger hover:!bg-danger-soft"
              leftIcon={<XCircle className="h-4 w-4" />}
              onClick={() => run(() => handlers.onAction(booking, 'cancel'))}
            >
              Hủy yêu cầu
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
