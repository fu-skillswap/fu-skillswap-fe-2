/**
 * @file ConfirmEndBookingDialog.tsx
 * @description The one confirmation step before a booking is ended for good: mentor reject /
 * cancel and mentee cancel. Names the booking, asks a reason, states the consequences and that
 * it cannot be undone. Below 640px it becomes a bottom sheet.
 */

'use client';

import { useId, useRef, useState } from 'react';
import { Bell, CalendarX, Check, Coins, Info, Lock, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ApiClientError } from '@/models/apiClient';
import type { MentorBookingResponse } from '@/models/auth';
import {
  formatTime,
  getBookingPrice,
  isBookingPaid,
  toDate,
} from '@/views/mentee/my-bookings/bookingStatusConfig';

export type EndBookingVariant =
  'mentor-reject' | 'mentor-cancel' | 'mentee-cancel-request' | 'mentee-cancel';

const OTHER_REASON = 'Lý do khác';
const NOTE_MAX = 300;

const MENTEE_REASONS = [
  'Trùng lịch khác',
  'Muốn đổi giờ khác',
  'Đã tìm được mentor khác',
  'Không còn nhu cầu',
  OTHER_REASON,
];
const RESCHEDULE_REASON = 'Muốn đổi giờ khác';

const COPY: Record<
  EndBookingVariant,
  {
    title: (other: string) => string;
    legend: string;
    reasons: string[];
    keep: string;
    confirm: string;
    busy: string;
    placeholder: string;
  }
> = {
  'mentor-reject': {
    title: (other) => `Từ chối yêu cầu của ${other}?`,
    legend: 'Vì sao bạn từ chối?',
    reasons: [
      'Bận đột xuất giờ này',
      'Không đúng chuyên môn của mình',
      'Mentee cần dịch vụ khác',
      OTHER_REASON,
    ],
    keep: 'Quay lại',
    confirm: 'Từ chối yêu cầu',
    busy: 'Đang từ chối…',
    placeholder: 'Ví dụ: Mình có lịch họp đột xuất sáng mai, xin lỗi bạn nhé.',
  },
  'mentor-cancel': {
    title: (other) => `Hủy buổi học đã nhận với ${other}?`,
    legend: 'Vì sao bạn hủy?',
    reasons: [
      'Có việc đột xuất',
      'Sức khỏe không đảm bảo',
      'Sự cố mạng hoặc thiết bị',
      OTHER_REASON,
    ],
    keep: 'Giữ buổi học',
    confirm: 'Hủy buổi học',
    busy: 'Đang hủy…',
    placeholder: 'Ví dụ: Mình bị ốm, mong bạn thông cảm và đặt lại tuần sau nhé.',
  },
  'mentee-cancel-request': {
    title: (other) => `Hủy yêu cầu đặt lịch với ${other}?`,
    legend: 'Vì sao bạn hủy?',
    reasons: MENTEE_REASONS,
    keep: 'Giữ yêu cầu',
    confirm: 'Hủy yêu cầu',
    busy: 'Đang hủy…',
    placeholder: 'Ví dụ: Em bị trùng lịch thi, em sẽ đặt lại tuần sau ạ.',
  },
  'mentee-cancel': {
    title: (other) => `Hủy buổi học với ${other}?`,
    legend: 'Vì sao bạn hủy?',
    reasons: MENTEE_REASONS,
    keep: 'Giữ buổi học',
    confirm: 'Hủy buổi học',
    busy: 'Đang hủy…',
    placeholder: 'Ví dụ: Em bị trùng lịch thi, em sẽ đặt lại tuần sau ạ.',
  },
};

/** The existing reason payloads take one string: "<chip label>" or "<chip label>: <note>". */
export function composeEndReason(reason: string, note: string) {
  const trimmed = note.trim();
  return trimmed ? `${reason}: ${trimmed}` : reason;
}

/**
 * True when the server refused because the booking is no longer in a state that can be ended
 * (typically the other side ended it first).
 */
export function isBookingAlreadyEnded(reason: unknown) {
  return (
    reason instanceof ApiClientError &&
    (reason.status === 409 ||
      /BOOKING.*(STATUS|STATE)|INVALID_.*(STATUS|STATE)/i.test(reason.code ?? ''))
  );
}

interface ConfirmEndBookingDialogProps {
  variant: EndBookingVariant;
  booking?: MentorBookingResponse;
  /** Display name of the other side (mentee for mentor variants, mentor for mentee ones). */
  otherName: string;
  /** Runs the existing reject / cancel mutation. Rejects so the dialog can show the error. */
  onConfirm: (reason: string, note: string) => Promise<void>;
  onClose: () => void;
  /** Maps an API error to a friendly inline message. */
  errorMessage: (reason: unknown) => string;
  /** Mentee only: opens the chat when the reason is "Muốn đổi giờ khác". */
  onMessage?: () => void;
}

export function ConfirmEndBookingDialog({ booking, ...props }: ConfirmEndBookingDialogProps) {
  if (!booking) return null;
  // Keyed so every opening starts from a fresh form.
  return <EndBookingDialog key={booking.bookingId} booking={booking} {...props} />;
}

function EndBookingDialog({
  variant,
  booking,
  otherName,
  onConfirm,
  onClose,
  errorMessage,
  onMessage,
}: ConfirmEndBookingDialogProps & { booking: MentorBookingResponse }) {
  const ids = useId();
  const titleId = `${ids}-title`;
  const lockId = `${ids}-lock`;
  const legendId = `${ids}-legend`;
  const noteId = `${ids}-note`;
  const ackId = `${ids}-ack`;
  const copy = COPY[variant];
  const needsAck = variant === 'mentor-cancel' || variant === 'mentee-cancel';
  const isMentor = variant.startsWith('mentor');

  const [reason, setReason] = useState<string>();
  const [note, setNote] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [submitError, setSubmitError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const firstChipRef = useRef<HTMLInputElement>(null);
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const ackRef = useRef<HTMLInputElement>(null);

  const start = toDate(booking.selectedStartTime);
  const end = toDate(booking.selectedEndTime);
  const minutes =
    booking.serviceDurationSnapshot ||
    (start && end ? Math.round((end.getTime() - start.getTime()) / 60000) : 0);
  const price = getBookingPrice(booking);
  const paid = price > 0 && isBookingPaid(booking);
  const priceText =
    price > 0
      ? `${new Intl.NumberFormat('vi-VN').format(price)} S-coins${paid ? ', đã thanh toán' : ''}`
      : 'Miễn phí';

  const noteRequired = reason === OTHER_REASON;
  const reasonError = !reason ? `Chọn một lý do để ${otherName} hiểu vì sao.` : undefined;
  const noteError = noteRequired && !note.trim() ? 'Viết vài chữ cho lý do khác.' : undefined;
  const ackError = needsAck && !acknowledged ? 'Đánh dấu ô này để xác nhận bạn hiểu.' : undefined;

  const payer = isMentor ? otherName : 'Bạn';
  // TODO(api): expose the refund amount/rule for paid bookings; never guess a number here.
  const refundText =
    price <= 0
      ? 'Buổi này miễn phí nên không có khoản hoàn tiền.'
      : !paid
        ? `${payer} chưa thanh toán nên không có khoản hoàn tiền.`
        : 'S-coins được hoàn vào ví theo chính sách hoàn tiền.';
  const lockText =
    variant === 'mentor-reject'
      ? `Yêu cầu này đóng lại, ${otherName} cần gửi yêu cầu mới.`
      : `Muốn học lại, ${isMentor ? otherName : 'bạn'} cần đặt một lịch mới.`;

  const close = () => {
    if (!submittingRef.current) onClose();
  };

  const submit = async () => {
    if (submittingRef.current) return;
    if (reasonError || noteError || ackError) {
      setShowErrors(true);
      if (reasonError) firstChipRef.current?.focus();
      else if (noteError) noteRef.current?.focus();
      else ackRef.current?.focus();
      return;
    }
    submittingRef.current = true;
    setIsSubmitting(true);
    setSubmitError(undefined);
    try {
      await onConfirm(reason as string, note.trim());
    } catch (failure) {
      submittingRef.current = false;
      setIsSubmitting(false);
      setSubmitError(errorMessage(failure));
    }
  };

  return (
    <Modal
      open
      title={copy.title(otherName)}
      role="alertdialog"
      labelledBy={titleId}
      describedBy={lockId}
      hideHeader
      onClose={close}
      className="max-w-[560px] max-sm:max-w-none max-sm:max-h-[92vh]! max-sm:rounded-b-none! max-sm:rounded-t-[24px]!"
      overlayClassName="max-sm:items-end! max-sm:p-0!"
      contentClassName="p-0! sm:p-0! overflow-hidden! flex min-h-0 flex-col"
    >
      <div
        className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-border-strong sm:hidden"
        aria-hidden="true"
      />
      <header className="flex shrink-0 items-start gap-3 border-b border-solid border-border-light px-6 pt-4 pb-4 sm:pt-5">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#FDECE7] text-[#C4320A]"
          aria-hidden="true"
        >
          <CalendarX className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2
            id={titleId}
            className="m-0 text-lg leading-snug font-semibold tracking-tight break-words text-text-main"
          >
            {copy.title(otherName)}
          </h2>
          <p className="mt-0.5 mb-0 text-sm text-text-secondary">
            Kiểm tra lại buổi học trước khi xác nhận.
          </p>
        </div>
        <button
          type="button"
          onClick={close}
          disabled={isSubmitting}
          aria-label="Đóng"
          className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-none bg-surface-subtle text-text-secondary outline-none transition hover:bg-border-light hover:text-text-main focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <X className="h-4.5 w-4.5" aria-hidden="true" />
        </button>
      </header>

      <div className="grid min-h-0 flex-1 gap-5 overflow-y-auto p-6">
        {/* Booking summary */}
        <section
          className="flex items-start gap-3.5 rounded-2xl bg-primary-light p-3.5"
          aria-label="Thông tin buổi học"
        >
          {start && (
            <div
              className="flex w-14 shrink-0 flex-col items-center rounded-xl bg-white px-1 py-1.5 text-center shadow-xs"
              aria-hidden="true"
            >
              <span className="text-[11px] font-semibold text-primary">
                {start.getDay() === 0 ? 'CN' : `Thứ ${start.getDay() + 1}`}
              </span>
              <span className="text-xl leading-6 font-bold text-text-main">{start.getDate()}</span>
              <span className="text-[11px] text-text-muted">Th{start.getMonth() + 1}</span>
            </div>
          )}
          <div className="min-w-0">
            <p className="m-0 text-[15px] leading-snug font-semibold break-words text-text-main">
              {booking.serviceTitle?.trim() || 'Buổi mentoring'}
            </p>
            <p className="mt-0.5 mb-0 text-sm text-text-secondary">
              {start && <span className="sr-only">{start.toLocaleDateString('vi-VN')}, </span>}
              {[
                `với ${otherName}`,
                start
                  ? end
                    ? `${formatTime(start)} – ${formatTime(end)}`
                    : formatTime(start)
                  : '',
                minutes ? `${minutes} phút` : '',
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
            <p className="mt-0.5 mb-0 text-sm text-text-secondary">{priceText}</p>
          </div>
        </section>

        {/* Reason */}
        <fieldset className="m-0 min-w-0 border-0 p-0" disabled={isSubmitting}>
          <legend id={legendId} className="mb-2.5 p-0 text-sm font-semibold text-text-main">
            {copy.legend}
            <span className="ml-0.5 text-[#C4320A]" aria-hidden="true">
              *
            </span>
            <span className="sr-only"> (bắt buộc)</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {copy.reasons.map((option, index) => {
              const checked = reason === option;
              return (
                <label
                  key={option}
                  className={`inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-full border border-solid px-3.5 text-sm font-medium transition-colors focus-within:ring-4 focus-within:ring-primary/20 ${
                    checked
                      ? 'border-primary bg-primary text-white'
                      : showErrors && reasonError
                        ? 'border-[#C4320A] bg-white text-text-main'
                        : 'border-border-color bg-white text-text-main hover:border-primary-border hover:text-primary'
                  }`}
                >
                  <input
                    ref={(node) => {
                      if (index !== 0) return;
                      firstChipRef.current = node;
                      // Modal focuses [autofocus] on open, so focus starts on the first reason.
                      node?.setAttribute('autofocus', '');
                    }}
                    type="radio"
                    name={`${ids}-reason`}
                    value={option}
                    checked={checked}
                    onChange={() => setReason(option)}
                    aria-describedby={showErrors && reasonError ? `${ids}-reason-error` : undefined}
                    className="sr-only"
                  />
                  {checked && <Check className="h-4 w-4" aria-hidden="true" />}
                  {option}
                </label>
              );
            })}
          </div>
          {showErrors && reasonError && (
            <p
              id={`${ids}-reason-error`}
              role="alert"
              className="mt-2 mb-0 text-[13px] text-[#C4320A]"
            >
              {reasonError}
            </p>
          )}
        </fieldset>

        {!isMentor && reason === RESCHEDULE_REASON && onMessage && (
          <div className="flex flex-col gap-3 rounded-xl border border-solid border-primary-border bg-primary-light p-3 text-sm text-text-main sm:flex-row sm:items-center sm:justify-between">
            <span className="flex items-start gap-2">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              Chỉ muốn đổi giờ? Nhắn {otherName} để hẹn giờ khác, bạn không cần hủy.
            </span>
            <Button variant="outline" className="shrink-0 text-sm" onClick={onMessage}>
              Nhắn mentor
            </Button>
          </div>
        )}

        {/* Note */}
        <div className="grid gap-1.5">
          <label htmlFor={noteId} className="text-sm font-semibold text-text-main">
            Lời nhắn cho {otherName}{' '}
            <span className="font-normal text-text-secondary">
              {noteRequired ? '(bắt buộc)' : '(không bắt buộc)'}
            </span>
          </label>
          <textarea
            id={noteId}
            ref={noteRef}
            rows={2}
            maxLength={NOTE_MAX}
            value={note}
            disabled={isSubmitting}
            onChange={(event) => setNote(event.target.value)}
            aria-required={noteRequired}
            aria-invalid={Boolean(showErrors && noteError) || undefined}
            aria-describedby={`${noteId}-help${showErrors && noteError ? ` ${noteId}-error` : ''}`}
            placeholder={copy.placeholder}
            className={`w-full resize-y rounded-xl border border-solid bg-white px-3.5 py-2.5 text-sm text-text-main outline-none transition placeholder:text-text-muted focus:border-primary focus:ring-4 focus:ring-primary/15 ${showErrors && noteError ? 'border-[#C4320A]' : 'border-border-strong'}`}
          />
          {showErrors && noteError && (
            <p id={`${noteId}-error`} role="alert" className="m-0 text-[13px] text-[#C4320A]">
              {noteError}
            </p>
          )}
          <div className="flex items-center justify-between gap-3 text-[13px] text-text-secondary">
            <span id={`${noteId}-help`}>{otherName} sẽ thấy lý do và lời nhắn này.</span>
            <span className="shrink-0 tabular-nums">
              {note.length}/{NOTE_MAX}
            </span>
          </div>
        </div>

        {/* Consequences */}
        <ul className="m-0 grid list-none gap-2 rounded-xl border border-solid border-[#F6CDB8] bg-[#FFF4EE] p-3.5 text-[13px] leading-5 text-[#3D2A20]">
          <li className="flex items-start gap-2.5">
            <Bell className="mt-0.5 h-4 w-4 shrink-0 text-[#C4320A]" aria-hidden="true" />
            {otherName} nhận thông báo ngay, kèm lý do của bạn.
          </li>
          <li className="flex items-start gap-2.5">
            <Coins className="mt-0.5 h-4 w-4 shrink-0 text-[#C4320A]" aria-hidden="true" />
            {refundText}
          </li>
          <li className="flex items-start gap-2.5">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-[#C4320A]" aria-hidden="true" />
            <span id={lockId}>
              <strong className="font-semibold text-[#8A2C08]">Không hoàn tác được.</strong>{' '}
              {lockText}
            </span>
          </li>
        </ul>

        {needsAck && (
          <div className="grid gap-1.5">
            <label
              htmlFor={ackId}
              className="flex cursor-pointer items-start gap-2.5 text-sm text-text-main"
            >
              <input
                id={ackId}
                ref={ackRef}
                type="checkbox"
                checked={acknowledged}
                disabled={isSubmitting}
                onChange={(event) => setAcknowledged(event.target.checked)}
                aria-invalid={Boolean(showErrors && ackError) || undefined}
                aria-describedby={showErrors && ackError ? `${ackId}-error` : undefined}
                className="mt-0.5 h-4.5 w-4.5 shrink-0 cursor-pointer accent-[#C4320A]"
              />
              Mình hiểu buổi học với {otherName} sẽ bị hủy và không khôi phục được.
            </label>
            {showErrors && ackError && (
              <p id={`${ackId}-error`} role="alert" className="m-0 text-[13px] text-[#C4320A]">
                {ackError}
              </p>
            )}
          </div>
        )}

        {submitError && (
          <p
            role="alert"
            className="m-0 rounded-xl border border-solid border-[#F6CDB8] bg-[#FFF4EE] p-3 text-[13px] text-[#C4320A]"
          >
            {submitError}
          </p>
        )}
      </div>

      <footer className="flex shrink-0 flex-col gap-2 border-t border-solid border-border-light bg-white px-6 py-4 sm:flex-row sm:justify-end">
        <Button
          variant="outline"
          className="text-sm max-sm:h-12 max-sm:w-full"
          onClick={close}
          disabled={isSubmitting}
        >
          {copy.keep}
        </Button>
        <button
          type="button"
          onClick={() => void submit()}
          disabled={isSubmitting}
          aria-busy={isSubmitting || undefined}
          className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border-none bg-[#C4320A] px-4.5 text-sm font-bold text-white outline-none transition-colors hover:bg-[#A92A08] focus-visible:ring-4 focus-visible:ring-[#C4320A]/25 disabled:cursor-not-allowed disabled:opacity-60 max-sm:h-12 max-sm:w-full"
        >
          {isSubmitting && (
            <span
              className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
              aria-hidden="true"
            />
          )}
          {isSubmitting ? copy.busy : copy.confirm}
        </button>
      </footer>
    </Modal>
  );
}
