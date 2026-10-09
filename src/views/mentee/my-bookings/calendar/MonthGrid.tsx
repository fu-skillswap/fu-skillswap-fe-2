/**
 * @file MonthGrid.tsx
 * @description Month overview: whole weeks of the month, up to 3 event chips per day.
 */

'use client';

import { useMemo } from 'react';
import type { MentorBookingResponse } from '@/models/auth';
import { TONE_STYLES, getBookingTone, toneStyle } from './bookingColors';
import {
  WEEKDAY_LABELS,
  dayKey,
  formatLongDay,
  formatTime,
  formatTimeRange,
  isSameDay,
  isSameMonth,
  startOfDay,
} from './calendarUtils';
import type { CalendarEvent } from './WeekGrid';

const MAX_CHIPS = 3;

export function MonthGrid({
  month,
  days,
  events,
  now,
  isCompact,
  selectedDay,
  onEventClick,
  onDayClick,
  onShowWeek,
}: {
  month: Date;
  days: Date[];
  events: CalendarEvent[];
  now: Date;
  /** Mobile: chips become dots and tapping a day selects it. */
  isCompact: boolean;
  selectedDay?: Date;
  onEventClick: (booking: MentorBookingResponse, element: HTMLElement) => void;
  onDayClick: (day: Date) => void;
  onShowWeek: (day: Date) => void;
}) {
  const today = startOfDay(now);
  const byDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    [...events]
      .sort((left, right) => left.start.getTime() - right.start.getTime())
      .forEach((event) => {
        const key = dayKey(event.start);
        map.set(key, [...(map.get(key) ?? []), event]);
      });
    return map;
  }, [events]);

  return (
    <div className="overflow-x-auto">
      <div className={isCompact ? '' : 'min-w-[640px]'}>
        <div className="grid grid-cols-7 border-b border-border-light">
          {WEEKDAY_LABELS.map((label) => (
            <div key={label} className="py-2 text-center text-[11px] font-bold text-text-muted">
              {label}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const key = dayKey(day);
            const dayEvents = byDay.get(key) ?? [];
            const inMonth = isSameMonth(day, month);
            const isToday = isSameDay(day, today);
            const isSelected = Boolean(selectedDay && isSameDay(day, selectedDay));
            const hidden = dayEvents.length - MAX_CHIPS;

            return (
              <div
                key={key}
                role={isCompact ? 'button' : undefined}
                tabIndex={isCompact ? 0 : undefined}
                aria-label={
                  isCompact ? `${formatLongDay(day)}, ${dayEvents.length} buổi` : undefined
                }
                aria-pressed={isCompact ? isSelected : undefined}
                onClick={(event) => {
                  if ((event.target as HTMLElement).closest('[data-event]')) return;
                  onDayClick(day);
                }}
                onKeyDown={(event) => {
                  if (isCompact && (event.key === 'Enter' || event.key === ' ')) {
                    event.preventDefault();
                    onDayClick(day);
                  }
                }}
                className={`flex cursor-pointer flex-col gap-1 border-b border-l border-border-light p-1.5 outline-none hover:bg-surface-subtle/60 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30 ${isCompact ? 'min-h-14 items-center' : 'min-h-[112px]'} ${inMonth ? '' : 'bg-slate-50/70'} ${isSelected ? 'bg-sky-50' : ''}`}
              >
                <span
                  className={`inline-flex h-7 w-7 items-center justify-center self-center rounded-full text-sm font-bold ${isToday ? 'bg-primary text-white' : inMonth ? 'text-text-main' : 'text-slate-400'}`}
                >
                  {day.getDate()}
                </span>

                {isCompact ? (
                  dayEvents.length > 0 && (
                    <span className="flex flex-wrap justify-center gap-0.5" aria-hidden="true">
                      {dayEvents.slice(0, 4).map((event) => (
                        <span
                          key={event.booking.bookingId}
                          className="h-1.5 w-1.5 rounded-full"
                          style={{
                            backgroundColor: TONE_STYLES[getBookingTone(event.booking).tone].swatch,
                          }}
                        />
                      ))}
                    </span>
                  )
                ) : (
                  <>
                    {dayEvents.slice(0, MAX_CHIPS).map(({ booking, start, end }) => {
                      const { tone, label } = getBookingTone(booking);
                      const title = booking.serviceTitle || 'Dịch vụ mentoring';
                      return (
                        <button
                          type="button"
                          data-event
                          key={booking.bookingId}
                          aria-label={`${title}, ${booking.mentorDisplayName || 'Mentor'}, ${label}, ${formatLongDay(start)} ${formatTimeRange(start, end)}`}
                          onClick={(event) => onEventClick(booking, event.currentTarget)}
                          className={`w-full truncate rounded-md px-1.5 py-0.5 text-left text-[11px] font-semibold leading-snug outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${tone === 'completed' && end < now ? 'opacity-60' : ''}`}
                          style={toneStyle(tone)}
                        >
                          {formatTime(start)}{' '}
                          <span className={TONE_STYLES[tone].strike ? 'line-through' : ''}>
                            {title}
                          </span>
                        </button>
                      );
                    })}
                    {hidden > 0 && (
                      <button
                        type="button"
                        data-event
                        onClick={() => onShowWeek(day)}
                        className="self-start rounded-md px-1.5 text-[11px] font-bold text-primary outline-none hover:bg-primary-light focus-visible:ring-2 focus-visible:ring-primary/40"
                      >
                        +{hidden} buổi
                      </button>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
