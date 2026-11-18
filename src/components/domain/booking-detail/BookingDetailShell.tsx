/**
 * @file BookingDetailShell.tsx
 * @description Shared frame of the booking detail dialogs (mentee "Chi tiết buổi học" and mentor
 * "Chi tiết lịch hẹn"): status pill + title + round close button, a scrolling body and a footer
 * with an optional danger link on the left and the actions on the right. Below 640px the dialog
 * becomes a full-width bottom sheet.
 */

'use client';

import { X } from 'lucide-react';
import { useId, type ReactNode } from 'react';
import { Modal } from '@/components/ui/Modal';

/** Modal props that turn the shared Modal into this dialog's frame. */
export const BOOKING_DETAIL_MODAL_PROPS = {
  hideHeader: true,
  className: 'max-w-[560px] max-h-[92vh] rounded-b-none! sm:rounded-b-3xl! border-b-0 sm:border-b',
  contentClassName: 'p-0! sm:p-0! flex flex-col min-h-0 overflow-hidden!',
  overlayClassName: 'items-end! p-0! sm:items-center! sm:p-6!',
} as const;

/** Status tones of the detail pill. */
export const BOOKING_DETAIL_TONES = {
  blue: { bg: '#e0f2fe', text: '#075985' },
  amber: { bg: '#fef3c7', text: '#92400e' },
  green: { bg: '#dcfce7', text: '#166534' },
  grey: { bg: '#f1f5f9', text: '#475569' },
} as const;

export type BookingDetailTone = keyof typeof BOOKING_DETAIL_TONES;

export function BookingDetailPill({ tone, label }: { tone: BookingDetailTone; label: string }) {
  const colors = BOOKING_DETAIL_TONES[tone];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-semibold"
      style={{ background: colors.bg, color: colors.text }}
    >
      <span
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ background: colors.text }}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}

/** Outline footer button: tinted border, darker blue text so it passes 4.5:1. */
export const DETAIL_PRIMARY_BUTTON = 'w-full sm:w-auto min-h-11 px-5! text-sm!';
export const DETAIL_OUTLINE_BUTTON = `${DETAIL_PRIMARY_BUTTON} text-primary-text! hover:text-primary-text!`;

/** Text-only danger action shown on the left of the footer ("Hủy lịch", "Báo sự cố"). */
export function DetailDangerLink({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: (trigger: HTMLButtonElement) => void;
}) {
  return (
    <button
      type="button"
      onClick={(event) => onClick(event.currentTarget)}
      className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-1.5 self-center rounded-lg border-0 bg-transparent px-2 text-sm font-semibold text-[#b42318] underline-offset-4 outline-none hover:underline focus-visible:ring-4 focus-visible:ring-red-200 sm:self-auto"
    >
      {children}
    </button>
  );
}

export interface BookingDetailLayoutProps {
  /** Pill shown on its own line above the title. */
  status?: ReactNode;
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Optional danger link, left of the footer (under the buttons on phones). */
  footerStart?: ReactNode;
  /** Footer actions, outline ones first and at most one primary, last. */
  footerEnd?: ReactNode;
  /** id of the title, for the dialog's aria-labelledby. */
  titleId: string;
}

/** Header / body / footer of the dialog, for use inside a Modal opened elsewhere. */
export function BookingDetailLayout({
  status,
  title,
  onClose,
  children,
  footerStart,
  footerEnd,
  titleId,
}: BookingDetailLayoutProps) {
  return (
    <>
      <header className="flex shrink-0 items-start gap-3 border-0 border-b border-solid border-border-color px-6 pt-5 pb-4">
        <div className="flex min-w-0 flex-1 flex-col items-start gap-2">
          {status}
          <h2
            id={titleId}
            className="m-0 text-[22px] leading-snug font-bold break-words text-text-main"
          >
            {title}
          </h2>
        </div>
        <button
          type="button"
          aria-label="Đóng"
          onClick={onClose}
          className="-mt-1 -mr-2 inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-text-secondary outline-none hover:bg-surface-subtle hover:text-text-main focus-visible:ring-4 focus-visible:ring-primary/25"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </header>
      <div className="flex min-h-0 flex-1 flex-col gap-[18px] overflow-y-auto p-6">{children}</div>
      {(footerStart || footerEnd) && (
        <footer className="flex shrink-0 flex-col-reverse gap-2 border-0 border-t border-solid border-border-color px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex justify-center sm:justify-start">{footerStart}</div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">{footerEnd}</div>
        </footer>
      )}
    </>
  );
}

/** The whole dialog: Modal (Esc, backdrop, focus trap, focus return) + layout. */
export function BookingDetailShell({
  open,
  ...layout
}: Omit<BookingDetailLayoutProps, 'titleId'> & { open: boolean }) {
  const titleId = useId();
  return (
    <Modal
      open={open}
      onClose={layout.onClose}
      labelledBy={titleId}
      {...BOOKING_DETAIL_MODAL_PROPS}
    >
      <BookingDetailLayout {...layout} titleId={titleId} />
    </Modal>
  );
}
