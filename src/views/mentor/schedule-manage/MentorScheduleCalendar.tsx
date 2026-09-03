/**
 * @file MentorScheduleCalendar.tsx
 * @description Calendar tuần cho lịch dạy của Mentor thiết kế chuẩn theo reference.
 */

'use client';

import { Calendar, ChevronLeft, ChevronRight, Info, Repeat2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import type { MentorCalendarEvent } from './mentorScheduleCalendarData';

const DEFAULT_START_HOUR = 7;
const DEFAULT_END_HOUR = 20;
const HOUR_HEIGHT = 30;

const CALENDAR_STATUS_STYLES = {
  inactive: {
    event: 'border-dashed border-slate-300 bg-slate-100 text-slate-500',
    legend: 'border-dashed border-slate-300 bg-slate-100',
  },
  pastRecurring: {
    event:
      'border-dashed border-slate-300 bg-slate-50 text-slate-500 hover:border-slate-400 hover:bg-slate-100',
    legend: 'border-dashed border-slate-300 bg-slate-50',
  },
  past: {
    event: 'border-slate-200 bg-slate-50 text-slate-400 hover:border-slate-300 hover:bg-slate-100',
    legend: 'border-slate-200 bg-slate-50',
  },
  booked: {
    event: 'border-blue-700 bg-blue-600 text-white hover:border-blue-800 hover:bg-blue-700',
    legend: 'border-blue-700 bg-blue-600',
  },
  ongoing: {
    event:
      'border-emerald-300 bg-emerald-100 text-emerald-800 hover:border-emerald-500 hover:bg-emerald-200',
    legend: 'border-emerald-300 bg-emerald-100',
  },
  recurring: {
    event:
      'border-dashed border-sky-300 bg-sky-50 text-[#087fc5] hover:border-[#119CF7] hover:bg-sky-100',
    legend: 'border-dashed border-sky-300 bg-sky-50',
  },
  available: {
    event: 'border-sky-200 bg-sky-50 text-[#087fc5] hover:border-[#119CF7] hover:bg-sky-100',
    legend: 'border-sky-200 bg-sky-50',
  },
} as const;

type CalendarStatusStyleKey = keyof typeof CALENDAR_STATUS_STYLES;

interface MentorScheduleCalendarProps {
  weekStart: Date;
  timezone: string;
  events: MentorCalendarEvent[];
  isLoading: boolean;
  error?: string;
  isAvailabilityResponseEmpty: boolean;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  onRetry: () => void;
  onUnavailableAction: () => void;
  onSelectSlot?: (slotId: string) => void;
  onSelectBooking?: (bookingId: string) => void;
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function formatDate(value: Date) {
  return `${String(value.getUTCDate()).padStart(2, '0')}/${String(value.getUTCMonth() + 1).padStart(2, '0')}`;
}

function formatWeekRange(weekStart: Date) {
  const weekEnd = addDays(weekStart, 6);
  const startLabel = formatDate(weekStart);
  const endLabel = formatDate(weekEnd);
  const year =
    weekStart.getUTCFullYear() === weekEnd.getUTCFullYear()
      ? weekEnd.getUTCFullYear()
      : `${weekStart.getUTCFullYear()} - ${weekEnd.getUTCFullYear()}`;
  return `${startLabel} – ${endLabel}/${year}`;
}

function formatHour(hour: number) {
  return `${String(hour).padStart(2, '0')}:00`;
}

function formatSlotTime(minutes: number) {
  const h = String(Math.floor(minutes / 60) % 24).padStart(2, '0');
  const m = String(minutes % 60).padStart(2, '0');
  return `${h}:${m}`;
}

interface ZonedDateTimeParts {
  date: string;
  minutes: number;
}

function getZonedDateTimeParts(date: Date, timezone: string): ZonedDateTimeParts {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts
      .filter((part) => ['year', 'month', 'day', 'hour', 'minute'].includes(part.type))
      .map((part) => [part.type, part.value]),
  );
  return {
    date: `${values.year}-${values.month}-${values.day}`,
    minutes: Number(values.hour) * 60 + Number(values.minute),
  };
}

function getEventSegments(event: MentorCalendarEvent, days: Date[], timezone: string) {
  const start = getZonedDateTimeParts(event.start, timezone);
  const end = getZonedDateTimeParts(event.end, timezone);

  return days.flatMap((day, dayIndex) => {
    const dayKey = day.toISOString().slice(0, 10);
    if (dayKey < start.date || dayKey > end.date) return [];

    const startMinutes = dayKey === start.date ? start.minutes : 0;
    const endMinutes = dayKey === end.date ? end.minutes : 24 * 60;
    if (endMinutes <= startMinutes) return [];

    return [{ dayIndex, endMinutes, event, startMinutes }];
  });
}

function eventStyleKey(event: MentorCalendarEvent): CalendarStatusStyleKey {
  if (event.status === 'inactive') return 'inactive';
  if (event.status === 'past') {
    return event.isRecurring || event.source === 'template' ? 'pastRecurring' : 'past';
  }
  if (event.status === 'booked') return 'booked';
  if (event.status === 'ongoing') return 'ongoing';
  if (event.isRecurring || event.source === 'template') return 'recurring';
  return 'available';
}

function eventClasses(event: MentorCalendarEvent) {
  return CALENDAR_STATUS_STYLES[eventStyleKey(event)].event;
}

function eventStatusLabel(event: MentorCalendarEvent) {
  if (event.status === 'inactive') return 'lịch lặp đã dừng hoạt động';
  if (event.status === 'past') {
    return event.isRecurring || event.source === 'template' ? 'lịch lặp đã diễn ra' : 'đã diễn ra';
  }
  if (event.status === 'booked') return 'đã được đặt';
  if (event.status === 'ongoing') return 'đang diễn ra';
  if (event.isRecurring || event.source === 'template') return 'lịch lặp, có thể đặt';
  return 'có thể đặt';
}

export function MentorScheduleCalendar({
  weekStart,
  timezone,
  events,
  isLoading,
  error,
  isAvailabilityResponseEmpty,
  onPreviousWeek,
  onNextWeek,
  onToday,
  onRetry,
  onUnavailableAction,
  onSelectSlot,
  onSelectBooking,
}: MentorScheduleCalendarProps) {
  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  let eventSegments: Array<{
    dayIndex: number;
    endMinutes: number;
    event: MentorCalendarEvent;
    startMinutes: number;
  }> = [];
  try {
    eventSegments = events.flatMap((event) => getEventSegments(event, days, timezone));
  } catch {
    eventSegments = [];
  }

  const earliestEventHour = eventSegments.length
    ? Math.floor(Math.min(...eventSegments.map((segment) => segment.startMinutes)) / 60)
    : DEFAULT_START_HOUR;
  const latestEventHour = eventSegments.length
    ? Math.ceil(Math.max(...eventSegments.map((segment) => segment.endMinutes)) / 60)
    : DEFAULT_END_HOUR;
  const visibleStartHour = Math.max(0, Math.min(DEFAULT_START_HOUR, earliestEventHour));
  const visibleEndHour = Math.min(24, Math.max(DEFAULT_END_HOUR, latestEventHour));
  const visibleHours = Array.from(
    { length: visibleEndHour - visibleStartHour },
    (_, index) => visibleStartHour + index,
  );
  const calendarHeight = visibleHours.length * HOUR_HEIGHT;

  const hasActiveRecurringEvents = events.some(
    (event) => (event.isRecurring || event.source === 'template') && event.status !== 'inactive',
  );
  const hasInactiveRecurringEvents = events.some(
    (event) => event.source === 'template' && event.status === 'inactive',
  );
  const todayKey = getZonedDateTimeParts(new Date(), timezone).date;

  return (
    <div className="mentor-schedule-surface overflow-hidden rounded-2xl border border-border-color bg-white shadow-xs">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border-light px-4 py-2 md:px-5">
        <div className="flex items-center gap-2">
          <IconButton
            variant="ghost"
            size="md"
            className="h-9 w-9 rounded-xl border-border-color bg-white"
            aria-label="Tuần trước"
            icon={<ChevronLeft className="h-4 w-4" aria-hidden="true" />}
            onClick={onPreviousWeek}
          />
          <Button
            variant="secondary"
            size="md"
            className="h-9 border-border-color bg-white px-3.5 text-xs font-semibold text-text-secondary shadow-none"
            onClick={onToday}
          >
            Hôm nay
          </Button>
          <IconButton
            variant="ghost"
            size="md"
            className="h-9 w-9 rounded-xl border-border-color bg-white"
            aria-label="Tuần sau"
            icon={<ChevronRight className="h-4 w-4" aria-hidden="true" />}
            onClick={onNextWeek}
          />
        </div>

        <div className="flex items-center gap-2.5">
          <Calendar className="h-5 w-5 text-primary" aria-hidden="true" />
          <div className="text-right">
            <strong className="block text-sm font-semibold text-text-main">
              {formatWeekRange(weekStart)}
            </strong>
            <span className="mt-0.5 block max-w-52 truncate text-xs text-text-muted">
              {timezone}
            </span>
          </div>
        </div>
      </header>

      <div className="relative">
        <div className="overflow-x-auto overflow-y-hidden [scrollbar-color:var(--border-strong)_var(--surface-subtle)] [scrollbar-width:thin]">
          <div className="min-w-[900px]">
            <div className="sticky top-0 z-20 grid grid-cols-[60px_repeat(7,minmax(112px,1fr))] border-b border-border-color bg-white">
              <div className="border-r border-border-color bg-surface-subtle" aria-hidden="true" />
              {days.map((day) => {
                const isToday = day.toISOString().slice(0, 10) === todayKey;
                const weekdayName = new Intl.DateTimeFormat('vi-VN', {
                  timeZone: 'UTC',
                  weekday: 'short',
                }).format(day);

                return (
                  <div
                    key={day.toISOString()}
                    className={`border-r border-border-light px-2 py-1.5 text-center last:border-r-0 ${isToday ? 'bg-primary-light' : 'bg-white'}`}
                  >
                    <span
                      className={`block text-xs font-medium uppercase ${isToday ? 'text-primary' : 'text-text-muted'}`}
                    >
                      {weekdayName}
                    </span>
                    <strong
                      className={`mt-0.5 block text-sm font-semibold ${isToday ? 'text-primary' : 'text-text-main'}`}
                    >
                      {formatDate(day)}
                    </strong>
                  </div>
                );
              })}
            </div>

            <div className="relative bg-white" style={{ height: `${calendarHeight}px` }}>
              <div className="absolute inset-0">
                {visibleHours.map((hour) => (
                  <div
                    className="grid grid-cols-[60px_repeat(7,minmax(112px,1fr))]"
                    key={hour}
                    style={{ height: `${HOUR_HEIGHT}px` }}
                  >
                    <div className="border-r border-b border-border-color bg-white pr-2 pt-2 text-right text-xs font-medium text-text-muted">
                      {formatHour(hour)}
                    </div>
                    {days.map((day) => (
                      <div
                        className="border-r border-b border-border-light bg-white last:border-r-0"
                        key={`${day.toISOString()}-${hour}`}
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                ))}
              </div>

              <div
                className="absolute inset-y-0 left-[60px] right-0 grid grid-cols-7"
                aria-label="Lịch dạy theo tuần"
              >
                {days.map((day, dayIndex) => (
                  <div className="relative min-w-0 px-1" key={day.toISOString()}>
                    {eventSegments
                      .filter((segment) => segment.dayIndex === dayIndex)
                      .map((segment) => {
                        const durationMinutes = segment.endMinutes - segment.startMinutes;
                        const isCompactEvent = durationMinutes < 60;
                        const calculatedHeight = Math.max(
                          13,
                          (durationMinutes / 60) * HOUR_HEIGHT - 2,
                        );
                        const calculatedTop =
                          ((segment.startMinutes - visibleStartHour * 60) / 60) * HOUR_HEIGHT + 1;
                        const startTimeStr = formatSlotTime(segment.startMinutes);
                        const endTimeStr = formatSlotTime(segment.endMinutes);

                        const accessibleDay = new Intl.DateTimeFormat('vi-VN', {
                          timeZone: 'UTC',
                          weekday: 'long',
                          day: '2-digit',
                          month: '2-digit',
                        }).format(day);

                        return (
                          <button
                            type="button"
                            className={`mentor-calendar-event absolute left-1 right-1 z-10 overflow-hidden border text-left font-semibold outline-none transition focus-visible:z-20 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 ${
                              isCompactEvent
                                ? 'rounded-sm px-1 py-0 text-[9px] leading-3'
                                : 'rounded-xl px-2.5 py-2 text-xs'
                            } ${eventClasses(segment.event)}`}
                            key={`${segment.event.id}-${dayIndex}`}
                            aria-label={`${accessibleDay}, ${startTimeStr} đến ${endTimeStr}, ${eventStatusLabel(segment.event)}`}
                            disabled={!segment.event.slotId && !segment.event.bookingId}
                            onClick={() => {
                              if (segment.event.bookingId) {
                                onSelectBooking?.(segment.event.bookingId);
                              } else if (segment.event.slotId) {
                                onSelectSlot?.(segment.event.slotId);
                              }
                            }}
                            style={{
                              height: `${calculatedHeight}px`,
                              top: `${calculatedTop}px`,
                            }}
                          >
                            <span
                              className={`flex items-center justify-start truncate ${isCompactEvent ? 'gap-1' : 'gap-1.5'}`}
                            >
                              {(segment.event.isRecurring ||
                                segment.event.source === 'template') && (
                                <Repeat2
                                  className={
                                    isCompactEvent ? 'h-2 w-2 shrink-0' : 'h-3 w-3 shrink-0'
                                  }
                                  aria-hidden="true"
                                />
                              )}
                              {startTimeStr}–{endTimeStr}
                            </span>
                          </button>
                        );
                      })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div
            className="absolute inset-0 z-30 flex items-center justify-center bg-white/85 px-6"
            aria-live="polite"
          >
            <div className="w-full max-w-sm animate-pulse space-y-3" aria-label="Đang tải lịch">
              <span className="block h-4 rounded bg-slate-200" />
              <span className="block h-4 rounded bg-slate-200" />
              <span className="block h-4 w-2/3 rounded bg-slate-200" />
            </div>
          </div>
        ) : error ? (
          <div
            className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 bg-white/95 px-6 text-center"
            role="alert"
          >
            <strong className="text-base text-slate-800">Không thể tải lịch.</strong>
            <span className="text-sm text-slate-500">Vui lòng thử lại.</span>
            <Button type="button" className="mt-2" onClick={onRetry}>
              Thử lại
            </Button>
          </div>
        ) : isAvailabilityResponseEmpty ? (
          <div className="absolute left-1/2 top-20 z-30 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 flex-col items-center gap-2 rounded-2xl border border-border-color bg-white/95 px-6 py-5 text-center shadow-sm backdrop-blur-sm">
            <Calendar className="mb-1 h-9 w-9 text-slate-300" aria-hidden="true" />
            <strong className="text-base text-text-main">
              Bạn chưa thiết lập lịch rảnh trong tuần này.
            </strong>
            <span className="text-sm text-text-muted">
              Thêm thời gian rảnh để mentee có thể đặt lịch với bạn.
            </span>
            <Button type="button" className="mt-2" onClick={onUnavailableAction}>
              + Thêm lịch rảnh
            </Button>
          </div>
        ) : null}
      </div>

      <footer className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-border-color px-4 py-2 text-[11px] text-text-secondary md:px-5">
        <div className="flex items-center gap-2">
          <span
            className={`h-3.5 w-6 rounded border ${CALENDAR_STATUS_STYLES.available.legend}`}
            aria-hidden="true"
          />
          <span>Có thể đặt</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`h-3.5 w-6 rounded border ${CALENDAR_STATUS_STYLES.booked.legend}`}
            aria-hidden="true"
          />
          <span>Đã đặt</span>
        </div>
        {hasActiveRecurringEvents && (
          <div className="flex items-center gap-2">
            <span
              className={`h-3.5 w-6 rounded border ${CALENDAR_STATUS_STYLES.recurring.legend}`}
              aria-hidden="true"
            />
            <span>Lịch lặp</span>
          </div>
        )}
        {hasInactiveRecurringEvents && (
          <div className="flex items-center gap-2">
            <span
              className={`h-3.5 w-6 rounded border ${CALENDAR_STATUS_STYLES.inactive.legend}`}
              aria-hidden="true"
            />
            <span>Lịch lặp đã dừng</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <span
            className={`h-3.5 w-6 rounded border ${CALENDAR_STATUS_STYLES.ongoing.legend}`}
            aria-hidden="true"
          />
          <span>Đang diễn ra</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`h-3.5 w-6 rounded border ${CALENDAR_STATUS_STYLES.past.legend}`}
            aria-hidden="true"
          />
          <span>Đã diễn ra</span>
        </div>
        <div className="ml-auto flex items-center gap-2 text-text-muted">
          <Info className="h-4 w-4 text-primary" aria-hidden="true" />
          <span>Nhấn vào khung giờ để xem hoặc quản lý lịch.</span>
        </div>
      </footer>
    </div>
  );
}
