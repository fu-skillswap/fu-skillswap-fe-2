/**
 * @file AcceptBookingModal.tsx
 * @description "Nhận lịch" dialog: shows which booking the mentor is accepting, lets them pick
 * the platform as chips, add an optional room link / place and a note, then accept.
 * Below 640px it becomes a bottom sheet.
 */

'use client';

import { useId, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { CalendarDays, CheckCircle2, Clock3, MapPin, Video, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import type {
  AcceptMentorBookingRequest,
  GoogleCalendarStatusResponse,
  MentorBookingResponse,
} from '@/models/auth';
import { durationMinutes, priceLabel, timeRange, toDate } from './mentorInbox';

type MeetingPlatform = NonNullable<MentorBookingResponse['meetingPlatform']>;

const PLATFORMS: Array<{
  value: MeetingPlatform;
  label: string;
  shortLabel?: string;
  placeholder: string;
}> = [
  {
    value: 'GOOGLE_MEET',
    label: 'Google Meet',
    placeholder: 'https://meet.google.com/abc-defg-hij',
  },
  { value: 'ZOOM', label: 'Zoom', placeholder: 'https://zoom.us/j/1234567890' },
  {
    value: 'MICROSOFT_TEAMS',
    label: 'Microsoft Teams',
    shortLabel: 'MS Teams',
    placeholder: 'https://teams.microsoft.com/l/meetup-join/...',
  },
  { value: 'DISCORD', label: 'Discord', placeholder: 'https://discord.gg/...' },
  { value: 'OFFLINE', label: 'Gặp trực tiếp', placeholder: 'Ví dụ: Thư viện tầng 2, FPTU HCM' },
  { value: 'OTHER', label: 'Khác', placeholder: 'https://...' },
];

const NOTE_MAX = 300;
const INPUT_CLASS =
  'h-11 w-full rounded-xl border border-solid border-border-strong bg-white px-3.5 text-sm text-text-main outline-none transition placeholder:text-text-muted focus:border-primary focus:ring-4 focus:ring-primary/15';

/** "Trần Minh Anh" → "Minh Anh", "Trần Anh" → "Anh". */
export function menteeFirstName(fullName?: string | null) {
  const words = fullName?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (!words.length) return 'mentee';
  return words.slice(words.length >= 3 ? -2 : -1).join(' ');
}

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(-2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || 'M'
  );
}

const isHttpUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
};

interface AcceptBookingModalProps {
  booking?: MentorBookingResponse;
  googleCalendarStatus?: GoogleCalendarStatusResponse;
  onClose: () => void;
  /** Runs the accept mutation; rejects with the API error so the modal can show it inline. */
  onAccept: (booking: MentorBookingResponse, data: AcceptMentorBookingRequest) => Promise<void>;
  /** Maps an API error to the friendly message shown above the footer. */
  errorMessage: (reason: unknown) => string;
}

export function AcceptBookingModal({ booking, ...props }: AcceptBookingModalProps) {
  if (!booking) return null;
  // Keyed so every opening starts from a fresh form.
  return <AcceptBookingDialog key={booking.bookingId} booking={booking} {...props} />;
}

function AcceptBookingDialog({
  booking,
  googleCalendarStatus,
  onClose,
  onAccept,
  errorMessage,
}: AcceptBookingModalProps & { booking: MentorBookingResponse }) {
  const ids = useId();
  const titleId = `${ids}-title`;
  const legendId = `${ids}-platform`;
  const platformErrorId = `${ids}-platform-error`;
  const placeId = `${ids}-place`;
  const placeErrorId = `${ids}-place-error`;
  const noteId = `${ids}-note`;

  const [platform, setPlatform] = useState<MeetingPlatform | undefined>(
    booking.meetingPlatform ?? undefined,
  );
  const [meetingLink, setMeetingLink] = useState(booking.meetingLink ?? '');
  const [location, setLocation] = useState(booking.location ?? '');
  const [note, setNote] = useState('');
  const [platformError, setPlatformError] = useState(false);
  const [linkError, setLinkError] = useState<'format' | 'required'>();
  const [locationError, setLocationError] = useState(false);
  const [submitError, setSubmitError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const chipRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const linkRef = useRef<HTMLInputElement>(null);
  const locationRef = useRef<HTMLInputElement>(null);

  const menteeName = booking.menteeDisplayName?.trim() || 'mentee';
  const firstName = menteeFirstName(booking.menteeDisplayName);
  const start = toDate(booking.selectedStartTime);
  const minutes = durationMinutes(booking);
  const hasPrice =
    booking.servicePriceScoinSnapshot !== null && booking.servicePriceScoinSnapshot !== undefined;
  const menteeNote =
    booking.learningGoalDescription?.trim() || booking.learningGoalTitle?.trim() || '';

  const selected = PLATFORMS.find((option) => option.value === platform);
  const isOffline = platform === 'OFFLINE';
  const autoMeet =
    platform === 'GOOGLE_MEET' &&
    Boolean(googleCalendarStatus?.connected && !googleCalendarStatus.needsReconnect);
  const showPlaceField = Boolean(platform) && !autoMeet;
  // Without a working Google Calendar link the backend needs the room link, or a place for
  // in-person sessions, to accept the booking.
  const isCalendarConnected = Boolean(
    googleCalendarStatus?.connected && !googleCalendarStatus.needsReconnect,
  );
  const isPlaceRequired = showPlaceField && !isCalendarConnected;
  const selectedIndex = PLATFORMS.findIndex((option) => option.value === platform);

  const close = () => {
    if (!isSubmitting) onClose();
  };

  const focusChip = (index: number) => chipRefs.current[index]?.focus();
  const selectPlatform = (value: MeetingPlatform) => {
    setPlatform(value);
    setPlatformError(false);
  };

  const onChipKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    if (!step) return;
    event.preventDefault();
    const next = (index + step + PLATFORMS.length) % PLATFORMS.length;
    selectPlatform(PLATFORMS[next].value);
    focusChip(next);
  };

  const submit = async () => {
    if (isSubmitting) return;
    if (!platform) {
      setPlatformError(true);
      focusChip(0);
      return;
    }
    const link = meetingLink.trim();
    if (showPlaceField && !isOffline && !link && isPlaceRequired) {
      setLinkError('required');
      linkRef.current?.focus();
      return;
    }
    if (showPlaceField && !isOffline && link && !isHttpUrl(link)) {
      setLinkError('format');
      linkRef.current?.focus();
      return;
    }
    if (isOffline && isPlaceRequired && !location.trim()) {
      setLocationError(true);
      locationRef.current?.focus();
      return;
    }
    setSubmitError(undefined);
    setIsSubmitting(true);
    try {
      await onAccept(booking, {
        meetingPlatform: platform,
        meetingLink: showPlaceField && !isOffline ? link || undefined : undefined,
        location: isOffline ? location.trim() || undefined : undefined,
        mentorResponseNote: note.trim() || undefined,
      });
    } catch (reason) {
      setSubmitError(errorMessage(reason));
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open
      title={`Nhận lịch với ${menteeName}`}
      labelledBy={titleId}
      hideHeader
      onClose={close}
      className="max-w-[560px] max-sm:max-w-none max-sm:max-h-[94vh]! max-sm:rounded-b-none! max-sm:rounded-t-[22px]!"
      overlayClassName="max-sm:items-end! max-sm:p-0!"
      contentClassName="p-0! sm:p-0! overflow-hidden! flex min-h-0 flex-col"
    >
      <div
        className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-border-strong sm:hidden"
        aria-hidden="true"
      />
      <header className="flex shrink-0 items-start justify-between gap-4 border-b border-solid border-border-light px-6 pt-4 pb-4 sm:pt-5">
        <div className="min-w-0">
          <h2 id={titleId} className="m-0 text-xl font-semibold tracking-tight text-text-main">
            Nhận lịch với {menteeName}
          </h2>
          <p className="mt-1 mb-0 text-sm text-text-secondary">
            Xác nhận nơi học, mentee sẽ được báo ngay.
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
          className="grid gap-3 rounded-2xl bg-primary-light p-3.5"
          aria-label="Thông tin lịch đặt"
        >
          <div className="flex items-start gap-3.5">
            {start && (
              <div
                className="flex w-14 shrink-0 flex-col items-center rounded-xl bg-white px-1 py-1.5 text-center shadow-xs"
                aria-hidden="true"
              >
                <span className="text-[11px] font-semibold text-primary">
                  {start.getDay() === 0 ? 'CN' : `Thứ ${start.getDay() + 1}`}
                </span>
                <span className="text-xl leading-6 font-bold text-text-main">
                  {start.getDate()}
                </span>
                <span className="text-[11px] text-text-muted">Th{start.getMonth() + 1}</span>
              </div>
            )}
            <div className="min-w-0">
              <p className="m-0 text-[15.5px] leading-snug font-semibold break-words text-text-main">
                {booking.serviceTitle?.trim() || 'Buổi mentoring'}
              </p>
              <p className="mt-0.5 mb-0 text-sm text-text-secondary">
                {start && <span className="sr-only">{start.toLocaleDateString('vi-VN')}, </span>}
                {[timeRange(booking), minutes ? `${minutes} phút` : '', 'giờ Việt Nam']
                  .filter(Boolean)
                  .join(' · ')}
              </p>
              {hasPrice && (
                <p className="mt-0.5 mb-0 text-sm text-text-secondary">{priceLabel(booking)}</p>
              )}
            </div>
          </div>
          {menteeNote && (
            <div className="flex items-start gap-2.5 rounded-xl bg-white p-3">
              {booking.menteeAvatarUrl ? (
                <img
                  src={booking.menteeAvatarUrl}
                  alt=""
                  className="h-7 w-7 shrink-0 rounded-full object-cover"
                />
              ) : (
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-light text-[11px] font-bold text-primary"
                  aria-hidden="true"
                >
                  {initials(menteeName)}
                </span>
              )}
              <div className="min-w-0">
                <span className="block text-[12.5px] text-text-secondary">{firstName} nhắn</span>
                <p className="m-0 text-[13.5px] leading-5 break-words whitespace-pre-wrap text-text-main">
                  {menteeNote}
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Platform chips */}
        <fieldset className="m-0 min-w-0 border-0 p-0">
          <legend id={legendId} className="mb-2.5 p-0 text-sm font-semibold text-text-main">
            Nền tảng buổi học
            <span className="ml-0.5 text-danger" aria-hidden="true">
              *
            </span>
          </legend>
          <div
            role="radiogroup"
            aria-labelledby={legendId}
            aria-required="true"
            aria-invalid={platformError || undefined}
            aria-describedby={platformError ? platformErrorId : undefined}
            className="grid grid-cols-2 gap-2.5"
          >
            {PLATFORMS.map((option, index) => {
              const checked = option.value === platform;
              const Icon = option.value === 'OFFLINE' ? MapPin : Video;
              return (
                <button
                  key={option.value}
                  ref={(node) => {
                    chipRefs.current[index] = node;
                    // Modal focuses [autofocus] on open, so focus starts on the first chip.
                    if (index === 0) node?.setAttribute('autofocus', '');
                  }}
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  tabIndex={checked || (selectedIndex === -1 && index === 0) ? 0 : -1}
                  onClick={() => selectPlatform(option.value)}
                  onKeyDown={(event) => onChipKeyDown(event, index)}
                  className={`flex h-12 min-w-0 cursor-pointer items-center gap-2.5 rounded-xl border-solid bg-white px-3.5 text-left text-sm outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 ${
                    checked
                      ? 'border-2 border-primary bg-primary-light font-semibold text-primary-hover'
                      : platformError
                        ? 'border border-danger text-text-main hover:border-primary'
                        : 'border border-border-color text-text-main hover:border-primary-border hover:bg-surface-subtle'
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 ${checked ? 'text-primary' : 'text-text-muted'}`}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1 truncate">
                    {option.shortLabel ? (
                      <>
                        <span className="sm:hidden">{option.shortLabel}</span>
                        <span className="max-sm:hidden">{option.label}</span>
                      </>
                    ) : (
                      option.label
                    )}
                  </span>
                  {checked && (
                    <CheckCircle2
                      className="h-4.5 w-4.5 shrink-0 fill-primary text-white"
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </div>
          {platformError && (
            <p id={platformErrorId} role="alert" className="mt-2 mb-0 text-[13px] text-danger">
              Chọn nền tảng để {firstName} biết vào học ở đâu.
            </p>
          )}
        </fieldset>

        {autoMeet && (
          <div className="flex gap-3 rounded-xl border border-solid border-primary-border bg-primary-light p-3 text-sm text-text-main">
            <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <p className="m-0">
              Google Meet sẽ được tạo tự động và đồng bộ với{' '}
              {googleCalendarStatus?.email || 'Google Calendar'}. Bạn không cần dán link.
            </p>
          </div>
        )}
        {platform === 'GOOGLE_MEET' && googleCalendarStatus?.needsReconnect && (
          <p className="m-0 rounded-xl bg-warning-soft p-3 text-[13px] text-text-main">
            Google Calendar cần kết nối lại để tự tạo link Meet. Bạn có thể dán link thủ công bên
            dưới.
          </p>
        )}

        {/* Link / place: required until Google Calendar is connected, sent with the accept */}
        {showPlaceField && selected && (
          <div className="grid gap-1.5">
            <label htmlFor={placeId} className="text-sm font-semibold text-text-main">
              {isOffline ? 'Địa điểm gặp' : `Link phòng ${selected.label}`}
              {isPlaceRequired ? (
                <span className="text-danger" aria-hidden="true">
                  {' '}
                  *
                </span>
              ) : (
                <span className="font-normal text-text-secondary"> (không bắt buộc)</span>
              )}
            </label>
            {isOffline ? (
              <input
                id={placeId}
                ref={locationRef}
                className={`${INPUT_CLASS} ${locationError ? 'border-danger! focus:ring-danger/15!' : ''}`}
                value={location}
                maxLength={255}
                aria-required={isPlaceRequired || undefined}
                aria-invalid={locationError || undefined}
                aria-describedby={locationError ? placeErrorId : `${placeId}-help`}
                onChange={(event) => {
                  setLocation(event.target.value);
                  setLocationError(false);
                }}
                placeholder={selected.placeholder}
              />
            ) : (
              <input
                id={placeId}
                ref={linkRef}
                type="url"
                inputMode="url"
                className={`${INPUT_CLASS} ${linkError ? 'border-danger! focus:ring-danger/15!' : ''}`}
                value={meetingLink}
                aria-required={isPlaceRequired || undefined}
                aria-invalid={Boolean(linkError) || undefined}
                aria-describedby={linkError ? placeErrorId : `${placeId}-help`}
                onChange={(event) => {
                  setMeetingLink(event.target.value);
                  setLinkError(undefined);
                }}
                placeholder={selected.placeholder}
              />
            )}
            {linkError || locationError ? (
              <p id={placeErrorId} role="alert" className="m-0 text-[13px] text-danger">
                {linkError === 'format'
                  ? 'Link chưa đúng định dạng. Dán đủ link bắt đầu bằng https://'
                  : linkError === 'required'
                    ? 'Dán link phòng học để nhận lịch. Bạn chưa kết nối Google Calendar nên hệ thống chưa tự tạo link được.'
                    : 'Nhập địa điểm gặp để nhận lịch.'}
              </p>
            ) : isPlaceRequired ? (
              <p id={`${placeId}-help`} className="m-0 text-[13px] text-text-secondary">
                {isOffline
                  ? `${firstName} sẽ thấy địa điểm này khi bạn nhận lịch.`
                  : 'Bạn chưa kết nối Google Calendar nên cần dán link phòng học để nhận lịch.'}
              </p>
            ) : (
              <p id={`${placeId}-help`} className="m-0 text-[13px] text-text-secondary">
                {/* TODO(api): endpoint to set/update meetingLink & location after accept, so the
                    mentor can add it later from "Chi tiết lịch hẹn". */}
                {isOffline
                  ? `Chưa chốt chỗ? Bạn có thể nhắn ${firstName} trước giờ học.`
                  : `Chưa có link? Bạn có thể gửi cho ${firstName} qua tin nhắn trước giờ học.`}
              </p>
            )}
          </div>
        )}

        {/* Note. The mentee side does not display mentorResponseNote yet. */}
        <div className="grid gap-1.5">
          <label htmlFor={noteId} className="text-sm font-semibold text-text-main">
            Ghi chú cho bạn{' '}
            <span className="font-normal text-text-secondary">(không bắt buộc)</span>
          </label>
          <textarea
            id={noteId}
            rows={3}
            maxLength={NOTE_MAX}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            aria-describedby={`${noteId}-help`}
            placeholder="Ví dụ: Em mang sẵn đề PE năm ngoái để mình chữa luôn nhé."
            className="min-h-[84px] w-full resize-y rounded-xl border border-solid border-border-strong bg-white px-3.5 py-2.5 text-sm text-text-main outline-none transition placeholder:text-text-muted focus:border-primary focus:ring-4 focus:ring-primary/15"
          />
          <div className="flex items-center justify-between gap-3 text-[13px] text-text-secondary">
            {/* TODO(api): show mentorResponseNote on the mentee's booking, then relabel this
                "Lời nhắn cho {firstName}" with "{firstName} sẽ thấy lời nhắn này trong lịch hẹn." */}
            <span id={`${noteId}-help`}>Chỉ bạn thấy ghi chú này.</span>
            <span className="shrink-0 tabular-nums" aria-live="polite">
              {note.length}/{NOTE_MAX}
            </span>
          </div>
        </div>

        {submitError && (
          <p
            role="alert"
            className="m-0 rounded-xl border border-solid border-danger/30 bg-danger-soft p-3 text-[13px] text-danger"
          >
            {submitError}
          </p>
        )}
      </div>

      <footer className="flex shrink-0 flex-col gap-3 border-t border-solid border-border-light px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="m-0 flex items-start justify-center gap-2 text-center text-[13px] text-text-secondary sm:max-w-[250px] sm:justify-start sm:text-left">
          <Clock3 className="mt-0.5 h-4 w-4 shrink-0 max-sm:hidden" aria-hidden="true" />
          Nhận lịch là bạn cam kết có mặt đúng giờ đã mở.
        </p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
          <Button
            variant="outline"
            className="text-sm max-sm:h-11 max-sm:border-transparent! max-sm:bg-transparent! max-sm:shadow-none!"
            onClick={close}
            disabled={isSubmitting}
          >
            Để sau
          </Button>
          <Button
            className="text-sm max-sm:h-12"
            loading={isSubmitting}
            onClick={() => void submit()}
          >
            {isSubmitting ? 'Đang nhận…' : 'Nhận lịch'}
          </Button>
        </div>
      </footer>
    </Modal>
  );
}
