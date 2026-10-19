'use client';

import { useEffect, useRef, useState } from 'react';
import { Bell, CalendarX, Check, Info, RotateCcw, Wallet, X } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import type { MentorBookingResponse } from '@/models/auth';
import {
  formatFullDate,
  formatTimeRange,
  getBookingPrice,
  getBookingStateKey,
  getMentorName,
  toDate,
} from '../bookingStatusConfig';
import styles from '../MyBookingsView.module.css';

const CANCEL_REASONS = [
  'Trùng lịch khác',
  'Muốn đổi giờ khác',
  'Đã tìm được mentor khác',
  'Không còn nhu cầu',
  'Lý do khác',
] as const;

type CancelReason = (typeof CANCEL_REASONS)[number];

const NOTE_MAX_LENGTH = 300;

interface CancelBookingModalProps {
  booking?: MentorBookingResponse;
  isSaving: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  onMessage: () => void;
}

/** Composes the existing `cancelReason` payload: "<chip label>" or "<chip label>: <note>". */
export function buildCancelReason(reason: CancelReason, note: string) {
  const trimmed = note.trim();
  return trimmed ? `${reason}: ${trimmed}` : reason;
}

export function CancelBookingModal({
  booking,
  isSaving,
  error,
  onClose,
  onSubmit,
  onMessage,
}: CancelBookingModalProps) {
  const [reason, setReason] = useState<CancelReason>();
  const [note, setNote] = useState('');
  const firstChipRef = useRef<HTMLInputElement>(null);
  const bookingId = booking?.bookingId;

  useEffect(() => {
    setReason(undefined);
    setNote('');
    if (!bookingId) return;
    // Runs after Modal's own initial-focus timer, so the first reason chip wins.
    const timer = window.setTimeout(() => firstChipRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [bookingId]);

  if (!booking) return null;

  const mentor = getMentorName(booking);
  const isRequest = getBookingStateKey(booking) === 'PENDING';
  const actionLabel = isRequest ? 'Hủy yêu cầu' : 'Hủy lịch';
  const title = isRequest ? 'Hủy yêu cầu đặt lịch?' : 'Hủy lịch học?';
  const start = toDate(booking.selectedStartTime);
  const price = getBookingPrice(booking);
  const noteRequired = reason === 'Lý do khác';
  const helper = !reason
    ? 'Chọn một lý do để tiếp tục.'
    : noteRequired && !note.trim()
      ? 'Viết vài chữ cho lý do khác.'
      : undefined;
  const isValid = !helper;
  const canMessage = Boolean(booking.conversationId || booking.mentorUserId);

  const close = () => {
    if (!isSaving) onClose();
  };
  const submit = () => {
    if (!reason || !isValid || isSaving) return;
    onSubmit(buildCancelReason(reason, note));
  };

  return (
    <Modal
      open
      hideHeader
      title={title}
      onClose={close}
      className={`${styles.modal} max-w-[520px] max-md:max-w-none max-md:rounded-b-none max-md:rounded-t-[24px] max-md:border-b-0`}
      overlayClassName="max-md:items-end max-md:p-0"
      contentClassName="p-0!"
    >
      <div className={styles.modalBody}>
        <div className={styles.modalHeader}>
          <span className={styles.modalIcon} aria-hidden="true">
            <CalendarX />
          </span>
          <div>
            <h2 className={styles.modalTitle}>{title}</h2>
            <p className={styles.modalSubtitle}>Kiểm tra lại buổi học trước khi hủy.</p>
          </div>
          <button
            type="button"
            className={styles.modalClose}
            aria-label="Đóng"
            onClick={close}
            disabled={isSaving}
          >
            <X aria-hidden="true" />
          </button>
        </div>

        <div className={styles.summary}>
          {start && (
            <div className={styles.miniTile} aria-hidden="true">
              <span className={styles.miniTileDay}>{start.getDate()}</span>
              <span className={styles.miniTileMonth}>Th{start.getMonth() + 1}</span>
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <p className={styles.summaryTitle}>{booking.serviceTitle || 'Buổi mentoring'}</p>
            <p className={styles.summaryMeta}>
              với {mentor}
              {start ? ` · ${formatTimeRange(booking, false)}, ${formatFullDate(start)}` : ''}
            </p>
          </div>
        </div>

        <ul className={styles.consequences}>
          <li>
            <Bell aria-hidden="true" />
            {mentor} sẽ nhận được thông báo là bạn đã hủy.
          </li>
          <li>
            <Wallet aria-hidden="true" />
            {price > 0
              ? // TODO(api): expose the refund rule/amount for paid bookings; never guess amounts.
                'Tiền sẽ được xử lý theo chính sách hoàn tiền.'
              : 'Buổi này miễn phí nên không có khoản hoàn tiền.'}
          </li>
          <li>
            <RotateCcw aria-hidden="true" />
            Sau khi hủy sẽ không khôi phục được. Muốn học lại, bạn cần gửi yêu cầu mới.
          </li>
        </ul>

        <fieldset className={styles.fieldset} disabled={isSaving}>
          <legend className={styles.legend}>Vì sao bạn hủy?</legend>
          <div className={styles.reasonChips}>
            {CANCEL_REASONS.map((option, index) => {
              const selected = reason === option;
              return (
                <label
                  key={option}
                  className={`${styles.reasonChip} ${selected ? styles.reasonChipSelected : ''}`}
                >
                  <input
                    ref={index === 0 ? firstChipRef : undefined}
                    className={styles.srOnly}
                    type="radio"
                    name="cancel-reason"
                    value={option}
                    checked={selected}
                    onChange={() => setReason(option)}
                  />
                  {selected && <Check aria-hidden="true" />}
                  {option}
                </label>
              );
            })}
          </div>
        </fieldset>

        {reason === 'Muốn đổi giờ khác' && canMessage && (
          <div className={styles.hint}>
            <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
              <Info aria-hidden="true" style={{ width: 16, height: 16, flexShrink: 0 }} />
              Chỉ muốn đổi giờ? Nhắn {mentor} để hẹn giờ khác, bạn không cần hủy.
            </span>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnOutline}`}
              onClick={onMessage}
            >
              Nhắn mentor
            </button>
          </div>
        )}

        <div>
          <label className={styles.noteLabel} htmlFor="cancel-note">
            Lời nhắn cho mentor{' '}
            <span className={styles.noteHint}>
              {noteRequired ? '(bắt buộc)' : '(không bắt buộc)'}
            </span>
          </label>
          <textarea
            id="cancel-note"
            className={styles.textarea}
            value={note}
            maxLength={NOTE_MAX_LENGTH}
            placeholder="Ví dụ: Em bị trùng lịch thi, em sẽ đặt lại tuần sau ạ."
            aria-required={noteRequired}
            aria-describedby="cancel-note-counter"
            disabled={isSaving}
            onChange={(event) => setNote(event.target.value)}
          />
          <div id="cancel-note-counter" className={styles.counter}>
            {note.length}/{NOTE_MAX_LENGTH}
          </div>
        </div>

        {error && (
          <div className={styles.inlineError} role="alert">
            {error}
          </div>
        )}
      </div>

      <footer className={styles.modalFooter}>
        {helper && (
          <span className={styles.modalHelper} aria-live="polite">
            {helper}
          </span>
        )}
        <button
          type="button"
          className={`${styles.btn} ${styles.btnOutline}`}
          style={helper ? undefined : { marginLeft: 'auto' }}
          onClick={close}
          disabled={isSaving}
        >
          Giữ lịch
        </button>
        <button
          type="button"
          className={`${styles.btn} ${styles.btnDanger}`}
          disabled={!isValid || isSaving}
          aria-busy={isSaving}
          onClick={submit}
        >
          {isSaving && <span className={styles.spinner} aria-hidden="true" />}
          {actionLabel}
        </button>
      </footer>
    </Modal>
  );
}
