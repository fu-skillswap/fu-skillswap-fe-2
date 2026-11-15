/**
 * @file ReverseViolationDrawer.tsx
 * @description Right drawer (bottom sheet below 640px) opened from the mentor-violations list:
 * the mentor's violations that can still be reversed, each going through `ReverseViolationDialog`.
 */

'use client';

import { Button } from '@/components/ui/Button';
import type { AdminMentor } from '@/models/admin';
import type { MentorViolationItemResponse } from '@/models/auth';
import { CircleCheck, Lock, Undo2, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  DANGER_OUTLINE_BUTTON_CLASS,
  formatPoints,
  formatViolationDateTime,
  isBookingSuspended,
  violationState,
} from './mentorViolations.helpers';
import { ReverseViolationDialog } from './ReverseViolationDialog';
import { useAdminMentorViolations } from './useAdminMentorViolations';
import {
  BookingReference,
  SeverityPill,
  ViolationStatePill,
  violationTypeLabel,
} from './ViolationPills';

const DRAWER_PAGE_SIZE = 20;
const FOCUSABLE =
  'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

export interface ReverseViolationDrawerProps {
  mentor: AdminMentor;
  /** Mentor detail URL, opened by "Mở trang chi tiết mentor". */
  detailHref: string;
  onClose: () => void;
}

export function ReverseViolationDrawer(props: ReverseViolationDrawerProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(<DrawerContent {...props} />, document.body);
}

function timeOf(value?: string | null) {
  const time = value ? new Date(value).getTime() : NaN;
  return Number.isNaN(time) ? 0 : time;
}

function DrawerContent({ mentor, detailHref, onClose }: ReverseViolationDrawerProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLElement>(null);
  const onCloseRef = useRef(onClose);
  const [target, setTarget] = useState<MentorViolationItemResponse>();
  const dialogOpenRef = useRef(false);
  const { data, isLoading, error, reload } = useAdminMentorViolations(mentor.mentorUserId, {
    pageSize: DRAWER_PAGE_SIZE,
  });

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    dialogOpenRef.current = Boolean(target);
  }, [target]);

  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();

    const handleKeyboard = (event: KeyboardEvent) => {
      // The confirmation dialog on top owns the keyboard while it is open.
      if (dialogOpenRef.current || !panelRef.current) return;
      if (event.key === 'Escape') {
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || active === panelRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', handleKeyboard);
    return () => {
      window.removeEventListener('keydown', handleKeyboard);
      document.body.style.overflow = previousOverflow;
      opener?.focus();
    };
  }, []);

  const activeWindowStartAt = data?.activeWindowStartAt;
  const items = useMemo(() => {
    const open = (data?.history?.content ?? []).filter((item) => !item.reversedAt);
    const rank = (item: MentorViolationItemResponse) =>
      violationState(item, activeWindowStartAt) === 'active' ? 0 : 1;
    return [...open].sort(
      (left, right) =>
        rank(left) - rank(right) || timeOf(right.occurredAt) - timeOf(left.occurredAt),
    );
  }, [data, activeWindowStartAt]);

  const countingCount = items.filter(
    (item) => violationState(item, activeWindowStartAt) === 'active',
  ).length;
  const suspended = isBookingSuspended(data);

  return (
    <div
      className="fixed inset-0 z-[9990] flex items-end justify-end bg-slate-950/50 sm:items-stretch"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[90dvh] w-full flex-col rounded-t-3xl bg-white shadow-2xl outline-none sm:h-full sm:max-h-none sm:w-[560px] sm:max-w-full sm:rounded-none"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex shrink-0 items-center gap-3 border-b border-solid border-slate-200 px-5 py-4">
          {mentor.avatarUrl ? (
            <img
              src={mentor.avatarUrl}
              alt=""
              className="h-12 w-12 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-light text-base font-bold text-primary"
              aria-hidden="true"
            >
              {mentor.displayName.trim().charAt(0).toUpperCase() || '?'}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="m-0 text-base font-extrabold leading-6 text-slate-900">
              Gỡ vi phạm của {mentor.displayName}
            </h2>
            <p className="m-0 truncate text-[12.5px] text-slate-500" title={mentor.email}>
              {mentor.email}
            </p>
          </div>
          <button
            type="button"
            aria-label="Đóng"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-none bg-transparent text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {isLoading ? (
            <div className="space-y-3" role="status" aria-label="Đang tải vi phạm">
              {[0, 1, 2].map((index) => (
                <div key={index} className="h-28 animate-pulse rounded-2xl bg-slate-100" />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-solid border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <p className="m-0 font-semibold">Không thể tải vi phạm của mentor.</p>
              <p className="m-0 mt-1">{error}</p>
              <Button type="button" size="sm" variant="outline" className="mt-3" onClick={reload}>
                Thử lại
              </Button>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
              <CircleCheck className="h-10 w-10 text-emerald-700" aria-hidden="true" />
              <p className="m-0 text-sm font-semibold text-slate-900">
                Mentor không còn vi phạm nào để gỡ.
              </p>
              <Button type="button" variant="outline" onClick={onClose}>
                Đóng
              </Button>
            </div>
          ) : (
            <>
              <p className="m-0 flex items-start gap-2.5 rounded-2xl border border-solid border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
                <Lock className="mt-0.5 h-4.5 w-4.5 shrink-0" aria-hidden="true" />
                <span>
                  <strong>{formatPoints(data?.activePenaltyScore ?? 0)} điểm phạt hiện hành</strong>{' '}
                  từ {countingCount} vi phạm đang tính.
                  {suspended &&
                    ` Mentor đang bị tạm khóa nhận lịch đến ${formatViolationDateTime(
                      data?.bookingSuspendedUntil,
                    )}.`}
                </span>
              </p>
              <ul className="m-0 list-none space-y-3 p-0">
                {items.map((item) => {
                  const isTarget = target?.violationId === item.violationId;
                  return (
                    <li
                      key={item.violationId}
                      className={`rounded-2xl border border-solid bg-white p-4 transition ${
                        isTarget ? 'border-red-600 ring-4 ring-red-600/15' : 'border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="m-0 text-sm font-bold text-slate-900">
                            {violationTypeLabel(item.type)}
                          </p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-xs text-slate-500">
                            <span className="whitespace-nowrap">
                              {formatViolationDateTime(item.occurredAt)}
                            </span>
                            <SeverityPill severity={item.severity} />
                            <BookingReference bookingId={item.bookingId} />
                          </div>
                        </div>
                        <p className="m-0 shrink-0 text-right text-xs text-slate-500">
                          <strong className="block text-2xl font-extrabold leading-7 text-slate-900">
                            {formatPoints(item.points ?? 0)}
                          </strong>
                          điểm
                        </p>
                      </div>
                      {item.reason && (
                        <p className="m-0 mt-2.5 break-words text-sm leading-6 text-slate-600">
                          {item.reason}
                        </p>
                      )}
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                        <ViolationStatePill state={violationState(item, activeWindowStartAt)} />
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className={DANGER_OUTLINE_BUTTON_CLASS}
                          leftIcon={<Undo2 className="h-4 w-4" aria-hidden="true" />}
                          onClick={() => setTarget(item)}
                        >
                          Gỡ vi phạm
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>

        <footer className="shrink-0 border-t border-solid border-slate-200 px-5 py-4">
          <Link
            href={detailHref}
            className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-solid border-primary-border bg-white px-4 text-xs font-bold text-primary no-underline transition hover:bg-primary-light"
          >
            Mở trang chi tiết mentor
          </Link>
        </footer>
      </section>

      {target && (
        <div onMouseDown={(event) => event.stopPropagation()}>
          <ReverseViolationDialog
            mentorUserId={mentor.mentorUserId}
            mentorName={mentor.displayName}
            violation={target}
            activePenaltyScore={data?.activePenaltyScore}
            activeWindowStartAt={activeWindowStartAt}
            onClose={() => setTarget(undefined)}
            onReversed={() => panelRef.current?.focus()}
          />
        </div>
      )}
    </div>
  );
}
