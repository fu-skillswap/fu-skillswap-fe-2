/**
 * @file WeekGrid.tsx
 * @description Time grid (hour rows × day columns) with absolutely positioned booking events.
 */

'use client';

import { useEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { CreditCard, Plus } from 'lucide-react';
import type { MentorBookingResponse } from '@/models/auth';
import { TONE_STYLES, getBookingTone, toneStyle } from './bookingColors';
import {
  DEFAULT_END_HOUR,
  DEFAULT_START_HOUR,
  HOUR_HEIGHT,
  WEEKDAY_LABELS,
  addDays,
  dayKey,
  formatLongDay,
  formatTimeRange,
  isSameDay,
  minutesOfDay,
  packEvents,
  parseDate,
  startOfDay,
  weekdayIndex,
} from './calendarUtils';

export interface CalendarEvent {
  booking: MentorBookingResponse;
  start: Date;
  end: Date;
}

const GUTTER = 60;

export function WeekGrid({
  days,
  events,
  now,
  emptyState,
  onEventClick,
  onSlotClick,
}: {
  days: Date[];
  events: CalendarEvent[];
  now: Date;
  emptyState?: ReactNode;
  onEventClick: (booking: MentorBookingResponse, element: HTMLElement) => void;
  onSlotClick: (start: Date) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hoverSlot, setHoverSlot] = useState<{ day: string; hour: number }>();
  const today = startOfDay(now);
  const rangeKey = days.map(dayKey).join('|');

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    days.forEach((day) => map.set(dayKey(day), []));
    events.forEach((event) => map.get(dayKey(event.start))?.push(event));
    return map;
  }, [days, events]);

  // Default 07:00–23:00, widened when a visible booking falls outside.
  const [startHour, endHour] = useMemo(() => {
    let first = DEFAULT_START_HOUR;
    let last = DEFAULT_END_HOUR;
    events.forEach((event) => {
      first = Math.min(first, event.start.getHours());
      const endMinutes = isSameDay(event.start, event.end) ? minutesOfDay(event.end) : 24 * 60;
      last = Math.max(last, Math.ceil(endMinutes / 60));
    });
    return [first, Math.min(24, last)];
  }, [events]);
  const hours = Array.from({ length: endHour - startHour }, (_, index) => startHour + index);
  const bodyHeight = hours.length * HOUR_HEIGHT;
  const toTop = (minutes: number) => ((minutes - startHour * 60) * HOUR_HEIGHT) / 60;

  // Scroll to one hour before the first booking of the range, or to "now".
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const first = events.reduce<Date | undefined>(
      (earliest, event) =>
        !earliest || minutesOfDay(event.start) < minutesOfDay(earliest) ? event.start : earliest,
      undefined,
    );
    const target = first ? minutesOfDay(first) - 60 : minutesOfDay(new Date()) - 60;
    container.scrollTop = Math.max(0, toTop(target));
    // Only when the visible range changes, not on every data refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeKey]);

  const columns = `${GUTTER}px repeat(${days.length}, minmax(${days.length > 3 ? 88 : 72}px, 1fr))`;

  const handleHover =
    (day: Date, dayEvents: CalendarEvent[]) => (event: MouseEvent<HTMLDivElement>) => {
      if ((event.target as HTMLElement).closest('[data-event]')) {
        setHoverSlot(undefined);
        return;
      }
      const offset = event.clientY - event.currentTarget.getBoundingClientRect().top;
      const hour = startHour + Math.floor(offset / HOUR_HEIGHT);
      const slotStart = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour);
      const slotEnd = new Date(slotStart.getTime() + 60 * 60_000);
      const overlaps = dayEvents.some((item) => item.start < slotEnd && item.end > slotStart);
      if (hour >= endHour || slotStart < now || overlaps) {
        setHoverSlot(undefined);
        return;
      }
      setHoverSlot({ day: dayKey(day), hour });
    };

  return (
    <div className="relative">
      <div ref={scrollRef} className="max-h-[640px] overflow-auto">
        <div style={{ minWidth: GUTTER + days.length * (days.length > 3 ? 88 : 72) }}>
          {/* Day header */}
          <div
            className="sticky top-0 z-20 grid border-b border-border-light bg-white"
            style={{ gridTemplateColumns: columns }}
          >
            <div className="sticky left-0 z-10 bg-white" />
            {days.map((day) => {
              const isToday = isSameDay(day, today);
              const isPast = day < today;
              return (
                <div
                  key={dayKey(day)}
                  className={`flex flex-col items-center gap-1 border-l border-border-light py-2 ${isToday ? 'bg-sky-50' : ''}`}
                >
                  <span
                    className={`text-[11px] font-bold ${isToday ? 'text-primary' : 'text-text-muted'}`}
                  >
                    {WEEKDAY_LABELS[weekdayIndex(day)]}
                    {isToday && ' · Hôm nay'}
                  </span>
                  <span
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-lg font-bold ${isToday ? 'bg-primary text-white' : isPast ? 'text-slate-400' : 'text-text-main'}`}
                  >
                    {day.getDate()}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Body */}
          <div
            className="relative grid"
            style={{ gridTemplateColumns: columns, height: bodyHeight }}
          >
            <div className="sticky left-0 z-10 bg-white">
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="relative text-right text-[11px] text-text-muted"
                  style={{ height: HOUR_HEIGHT }}
                >
                  {hour > startHour && (
                    <span className="absolute -top-2 right-2">
                      {String(hour).padStart(2, '0')}:00
                    </span>
                  )}
                </div>
              ))}
            </div>

            {days.map((day) => {
              const key = dayKey(day);
              const isToday = isSameDay(day, today);
              const isPast = day < today;
              const dayEvents = byDay.get(key) ?? [];
              const positioned = packEvents(
                dayEvents.map((event) => ({
                  item: event.booking,
                  start: event.start,
                  end: event.end,
                })),
              );
              const nowTop = toTop(minutesOfDay(now));
              const ghost = hoverSlot?.day === key ? hoverSlot.hour : undefined;

              return (
                <div
                  key={key}
                  className={`relative border-l border-border-light ${isToday ? 'bg-sky-50/60' : isPast ? 'bg-slate-50' : ''}`}
                  style={{
                    backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent ${HOUR_HEIGHT - 1}px, var(--border-light, #eef2f6) ${HOUR_HEIGHT - 1}px, var(--border-light, #eef2f6) ${HOUR_HEIGHT}px)`,
                  }}
                  onMouseMove={isPast ? undefined : handleHover(day, dayEvents)}
                  onMouseLeave={() => setHoverSlot(undefined)}
                  onClick={(event) => {
                    if (
                      ghost === undefined ||
                      (event.target as HTMLElement).closest('[data-event]')
                    ) {
                      return;
                    }
                    onSlotClick(new Date(day.getFullYear(), day.getMonth(), day.getDate(), ghost));
                  }}
                >
                  {ghost !== undefined && (
                    <div
                      className="pointer-events-none absolute inset-x-1 flex items-center justify-center gap-1 rounded-lg border-[1.5px] border-dashed border-primary bg-primary-light/70 text-xs font-bold text-primary"
                      style={{ top: toTop(ghost * 60) + 2, height: HOUR_HEIGHT - 4 }}
                      aria-hidden="true"
                    >
                      <Plus className="h-3.5 w-3.5" /> Đặt {String(ghost).padStart(2, '0')}:00
                    </div>
                  )}

                  {positioned.map(({ item: booking, start, end, column, columns: count }) => {
                    const { tone, label } = getBookingTone(booking);
                    const style = TONE_STYLES[tone];
                    const top = toTop(minutesOfDay(start));
                    const endMinutes = isSameDay(start, end) ? minutesOfDay(end) : 24 * 60;
                    const height = Math.max(22, toTop(endMinutes) - top - 2);
                    const title = booking.serviceTitle || 'Dịch vụ mentoring';
                    const faded = tone === 'completed' && end < now;
                    return (
                      <button
                        type="button"
                        data-event
                        key={booking.bookingId}
                        aria-label={`${title}, ${booking.mentorDisplayName || 'Mentor'}, ${label}, ${formatLongDay(start)} ${formatTimeRange(start, end)}`}
                        onClick={(event) => onEventClick(booking, event.currentTarget)}
                        className={`absolute z-[1] overflow-hidden rounded-lg px-2 py-1 text-left text-xs leading-tight shadow-xs outline-none transition-shadow hover:z-[2] hover:shadow-md focus-visible:z-[2] focus-visible:ring-3 focus-visible:ring-primary/30 ${faded ? 'opacity-60' : ''}`}
                        style={{
                          ...toneStyle(tone),
                          top: top + 1,
                          height,
                          left: `calc(${(column / count) * 100}% + 2px)`,
                          width: `calc(${100 / count}% - 4px)`,
                        }}
                      >
                        {tone === 'payment' && (
                          <CreditCard
                            className="absolute right-1 top-1 h-3.5 w-3.5"
                            aria-hidden="true"
                          />
                        )}
                        <span
                          className={`block truncate font-bold ${tone === 'payment' ? 'pr-4' : ''} ${style.strike ? 'line-through' : ''}`}
                        >
                          {title}
                        </span>
                        {height >= 34 && (
                          <span className="block truncate opacity-90">
                            {formatTimeRange(start, end)}
                          </span>
                        )}
                      </button>
                    );
                  })}

                  {isToday && nowTop >= 0 && nowTop <= bodyHeight && (
                    <div
                      className="pointer-events-none absolute inset-x-0 z-[3] h-0.5 bg-red-500"
                      style={{ top: nowTop }}
                      aria-hidden="true"
                    >
                      <span className="absolute -left-1.5 -top-[5px] h-3 w-3 rounded-full bg-red-500" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {emptyState && (
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-30 flex items-center justify-center p-4"
          style={{ left: GUTTER }}
        >
          <div className="pointer-events-auto rounded-2xl border border-border-light bg-white/95 px-5 py-4 text-center shadow-sm">
            {emptyState}
          </div>
        </div>
      )}
    </div>
  );
}

/** Events that start inside one of `days`, ignoring bookings with an unparsable start time. */
export function eventsForDays(bookings: MentorBookingResponse[], days: Date[]): CalendarEvent[] {
  if (days.length === 0) return [];
  const first = startOfDay(days[0]);
  const after = addDays(days[days.length - 1], 1);
  return bookings.flatMap((booking) => {
    const start = parseDate(booking.selectedStartTime);
    if (!start || start < first || start >= after) return [];
    const end = parseDate(booking.selectedEndTime) ?? new Date(start.getTime() + 60 * 60_000);
    return [{ booking, start, end: end > start ? end : new Date(start.getTime() + 30 * 60_000) }];
  });
}
