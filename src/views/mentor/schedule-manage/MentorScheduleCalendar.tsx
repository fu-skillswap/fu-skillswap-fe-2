/**
 * @file MentorScheduleCalendar.tsx
 * @description Calendar tuần cho lịch dạy của Mentor thiết kế chuẩn theo reference.
 */

'use client';

import { Calendar, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { MentorCalendarEvent } from './mentorScheduleCalendarData';

const HOURS = Array.from({ length: 24 }, (_, hour) => hour);

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
  return `${startLabel} - ${endLabel}/${year}`;
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

function eventClasses(event: MentorCalendarEvent) {
  if (event.status === 'inactive') {
    return 'border-dashed border-slate-300 bg-slate-100 text-slate-500';
  }
  if (event.status === 'past') {
    return 'border-slate-200 bg-slate-50 text-slate-400 hover:border-slate-300 hover:bg-slate-100';
  }
  if (event.status === 'booked') {
    return 'border-blue-700 bg-blue-600 text-white hover:border-blue-800 hover:bg-blue-700';
  }
  if (event.status === 'ongoing') {
    return 'border-emerald-300 bg-emerald-100 text-emerald-800 hover:border-emerald-500 hover:bg-emerald-200';
  }
  if (event.isRecurring || event.source === 'template') {
    return 'border-dashed border-sky-300 bg-sky-50 text-[#087fc5] hover:border-[#119CF7] hover:bg-sky-100';
  }
  return 'border-sky-200 bg-sky-50 text-[#087fc5] hover:border-[#119CF7] hover:bg-sky-100';
}

function eventStatusLabel(event: MentorCalendarEvent) {
  if (event.status === 'inactive') return 'lịch lặp đã dừng hoạt động';
  if (event.status === 'past') return 'đã diễn ra';
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
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      // Scroll to 06:00 by default (6 hours * 60px = 360px)
      scrollRef.current.scrollTop = 360;
    }
  }, []);

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

  const hasActiveRecurringEvents = events.some(
    (event) => (event.isRecurring || event.source === 'template') && event.status !== 'inactive',
  );
  const hasInactiveRecurringEvents = events.some(
    (event) => event.source === 'template' && event.status === 'inactive',
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 md:px-5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 outline-none transition hover:border-[#119CF7] hover:bg-sky-50 hover:text-[#119CF7] focus-visible:ring-4 focus-visible:ring-[#119CF7]/20"
            aria-label="Tuần trước"
            onClick={onPreviousWeek}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 outline-none transition hover:border-[#119CF7] hover:bg-sky-50 hover:text-[#119CF7] focus-visible:ring-4 focus-visible:ring-[#119CF7]/20"
            onClick={onToday}
          >
            Hôm nay
          </button>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 outline-none transition hover:border-[#119CF7] hover:bg-sky-50 hover:text-[#119CF7] focus-visible:ring-4 focus-visible:ring-[#119CF7]/20"
            aria-label="Tuần sau"
            onClick={onNextWeek}
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-[#119CF7]" aria-hidden="true" />
          <div className="text-right">
            <strong className="block text-sm font-bold text-slate-800">
              {formatWeekRange(weekStart)}
            </strong>
            <span className="block max-w-52 truncate text-xs text-slate-500">{timezone}</span>
          </div>
        </div>
      </header>

      <div className="relative">
        <div className="max-h-[620px] overflow-auto" ref={scrollRef}>
          <div className="min-w-[960px]">
            <div className="sticky top-0 z-20 grid grid-cols-[72px_repeat(7,minmax(120px,1fr))] border-b border-slate-200 bg-white">
              <div className="border-r border-slate-200" aria-hidden="true" />
              {days.map((day) => {
                const isWeekend = day.getUTCDay() === 0 || day.getUTCDay() === 6;
                const weekdayName = new Intl.DateTimeFormat('vi-VN', {
                  timeZone: 'UTC',
                  weekday: 'short',
                }).format(day);

                return (
                  <div
                    key={day.toISOString()}
                    className={`border-r border-slate-200 px-2 py-3 text-center last:border-r-0 ${
                      isWeekend ? 'bg-slate-50' : 'bg-white'
                    }`}
                  >
                    <span className="block text-xs font-semibold uppercase text-slate-500">
                      {weekdayName}
                    </span>
                    <strong className="mt-0.5 block text-sm text-slate-800">
                      {formatDate(day)}
                    </strong>
                  </div>
                );
              })}
            </div>

            <div className="relative h-[1440px]">
              <div className="absolute inset-0">
                {HOURS.map((hour) => (
                  <div
                    className="grid h-[60px] grid-cols-[72px_repeat(7,minmax(120px,1fr))]"
                    key={hour}
                  >
                    <div className="border-r border-b border-slate-200 bg-white pr-3 pt-2 text-right text-xs font-medium text-slate-500">
                      {formatHour(hour)}
                    </div>
                    {days.map((day) => (
                      <div
                        className="border-r border-b border-slate-100 bg-white last:border-r-0"
                        key={`${day.toISOString()}-${hour}`}
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                ))}
              </div>

              <div
                className="absolute inset-y-0 left-[72px] right-0 grid grid-cols-7"
                aria-label="Lịch dạy theo tuần"
              >
                {days.map((day, dayIndex) => (
                  <div className="relative min-w-0 px-1" key={day.toISOString()}>
                    {eventSegments
                      .filter((segment) => segment.dayIndex === dayIndex)
                      .map((segment) => {
                        const durationMinutes = segment.endMinutes - segment.startMinutes;
                        const HOUR_HEIGHT = 60;
                        const calculatedHeight = Math.max(
                          32,
                          (durationMinutes / 60) * HOUR_HEIGHT - 6,
                        );
                        const calculatedTop = (segment.startMinutes / 60) * HOUR_HEIGHT + 3;
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
                            className={`absolute left-1 right-1 z-10 overflow-hidden rounded-lg border px-2 py-1 text-center text-xs font-semibold outline-none transition focus-visible:z-20 focus-visible:ring-2 focus-visible:ring-[#119CF7] focus-visible:ring-offset-1 ${eventClasses(
                              segment.event,
                            )}`}
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
                            <span className="block truncate">
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
            <button
              type="button"
              className="mt-2 h-10 rounded-xl bg-[#119CF7] px-4 text-sm font-semibold text-white outline-none hover:bg-[#0789dc] focus-visible:ring-4 focus-visible:ring-[#119CF7]/25"
              onClick={onRetry}
            >
              Thử lại
            </button>
          </div>
        ) : isAvailabilityResponseEmpty ? (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 bg-white/95 px-6 text-center">
            <Calendar className="mb-1 h-9 w-9 text-slate-300" aria-hidden="true" />
            <strong className="text-base text-slate-800">
              Bạn chưa thiết lập lịch rảnh trong tuần này.
            </strong>
            <span className="text-sm text-slate-500">
              Thêm thời gian rảnh để mentee có thể đặt lịch với bạn.
            </span>
            <button
              type="button"
              className="mt-2 h-10 rounded-xl bg-[#119CF7] px-4 text-sm font-semibold text-white outline-none hover:bg-[#0789dc] focus-visible:ring-4 focus-visible:ring-[#119CF7]/25"
              onClick={onUnavailableAction}
            >
              + Thêm lịch rảnh
            </button>
          </div>
        ) : null}
      </div>

      <footer className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-200 px-4 py-3 text-xs text-slate-600 md:px-5">
        <div className="flex items-center gap-2">
          <span className="h-3.5 w-6 rounded border border-sky-200 bg-sky-50" aria-hidden="true" />
          <span>Có thể đặt</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="h-3.5 w-6 rounded border border-blue-700 bg-blue-600"
            aria-hidden="true"
          />
          <span>Đã đặt</span>
        </div>
        {hasActiveRecurringEvents && (
          <div className="flex items-center gap-2">
            <span
              className="h-3.5 w-6 rounded border border-dashed border-sky-300 bg-sky-50"
              aria-hidden="true"
            />
            <span>Lịch lặp</span>
          </div>
        )}
        {hasInactiveRecurringEvents && (
          <div className="flex items-center gap-2">
            <span
              className="h-3.5 w-6 rounded border border-dashed border-slate-300 bg-slate-100"
              aria-hidden="true"
            />
            <span>Lịch lặp đã dừng</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <span
            className="h-3.5 w-6 rounded border border-emerald-300 bg-emerald-100"
            aria-hidden="true"
          />
          <span>Đang diễn ra</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="h-3.5 w-6 rounded border border-slate-200 bg-slate-50"
            aria-hidden="true"
          />
          <span>Đã diễn ra</span>
        </div>
        <div className="ml-auto flex items-center gap-2 text-slate-500">
          <Info className="h-4 w-4 text-[#119CF7]" aria-hidden="true" />
          <span>Nhấn vào khung giờ để xem hoặc quản lý lịch.</span>
        </div>
      </footer>
    </div>
  );
}
