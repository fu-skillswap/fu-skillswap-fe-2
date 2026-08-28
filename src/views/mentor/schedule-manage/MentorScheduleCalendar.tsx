/**
 * @file MentorScheduleCalendar.tsx
 * @description Calendar tuần read-only cho lịch dạy của Mentor.
 */

'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
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

  return (
    <div className="mentor-schedule-calendar-card">
      <header className="mentor-schedule-calendar-toolbar">
        <div className="mentor-schedule-calendar-navigation">
          <button type="button" aria-label="Tuần trước" onClick={onPreviousWeek}>
            <ChevronLeft aria-hidden="true" />
          </button>
          <button type="button" className="mentor-schedule-today-button" onClick={onToday}>
            Hôm nay
          </button>
          <button type="button" aria-label="Tuần sau" onClick={onNextWeek}>
            <ChevronRight aria-hidden="true" />
          </button>
        </div>
        <div className="mentor-schedule-calendar-period">
          <strong>{formatWeekRange(weekStart)}</strong>
          <span>{timezone}</span>
        </div>
      </header>

      <div className="mentor-schedule-calendar-content">
        <div className="mentor-schedule-calendar-scroll">
          <div className="mentor-schedule-calendar-grid" aria-label="Lịch dạy theo tuần">
            <div className="mentor-schedule-calendar-corner" />
            {days.map((day) => (
              <div key={day.toISOString()} className="mentor-schedule-calendar-day">
                <span>
                  {new Intl.DateTimeFormat('en-US', {
                    timeZone: 'UTC',
                    weekday: 'long',
                  }).format(day)}
                </span>
                <strong>{formatDate(day)}</strong>
              </div>
            ))}

            {HOURS.map((hour) => (
              <div className="mentor-schedule-calendar-row" key={hour}>
                <div className="mentor-schedule-calendar-time">{formatHour(hour)}</div>
                {days.map((day) => (
                  <div
                    className="mentor-schedule-calendar-hour"
                    key={`${day.toISOString()}-${hour}`}
                    aria-hidden="true"
                  />
                ))}
              </div>
            ))}

            <div className="mentor-schedule-calendar-event-layer" aria-label="Lịch rảnh">
              <div />
              {days.map((day, dayIndex) => (
                <div className="mentor-schedule-calendar-event-column" key={day.toISOString()}>
                  {eventSegments
                    .filter((segment) => segment.dayIndex === dayIndex)
                    .map((segment) => {
                      const durationMinutes = segment.endMinutes - segment.startMinutes;
                      const HOUR_HEIGHT = 60;
                      const calculatedHeight = Math.max(28, (durationMinutes / 60) * HOUR_HEIGHT - 4);
                      const calculatedTop = (segment.startMinutes / 60) * HOUR_HEIGHT + 2;
                      const isShortSlot = calculatedHeight < 40;

                      return (
                        <article
                          className={`mentor-schedule-calendar-event event-availability ${isShortSlot ? 'event-short' : ''}`}
                          key={`${segment.event.id}-${dayIndex}`}
                          role="button"
                          tabIndex={0}
                          onClick={() => onSelectSlot?.(segment.event.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              onSelectSlot?.(segment.event.id);
                            }
                          }}
                          style={{
                            height: `${calculatedHeight}px`,
                            top: `${calculatedTop}px`,
                          }}
                        >
                          <div className="event-title-time flex flex-wrap items-baseline gap-x-1">
                            <strong>Lịch rảnh</strong>
                            <span>
                              {formatHour(Math.floor(segment.startMinutes / 60))} –{' '}
                              {String(segment.endMinutes % 60).padStart(2, '0') === '00'
                                ? formatHour(Math.floor(segment.endMinutes / 60) % 24)
                                : `${String(Math.floor(segment.endMinutes / 60) % 24).padStart(2, '0')}:${String(segment.endMinutes % 60).padStart(2, '0')}`}
                            </span>
                          </div>
                          {segment.event.serviceTitle && (
                            <small className="event-service">{segment.event.serviceTitle}</small>
                          )}
                          {segment.event.note && (
                            <small className="event-note">{segment.event.note}</small>
                          )}
                        </article>
                      );
                    })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div
            className="mentor-schedule-calendar-state mentor-schedule-calendar-skeleton"
            aria-live="polite"
          >
            <span />
            <span />
            <span />
          </div>
        ) : error ? (
          <div className="mentor-schedule-calendar-state" role="alert">
            <strong>Không thể tải lịch.</strong>
            <span>{error}</span>
            <button type="button" onClick={onRetry}>
              Thử lại
            </button>
          </div>
        ) : isAvailabilityResponseEmpty ? (
          <div className="mentor-schedule-calendar-state mentor-schedule-calendar-empty">
            <strong>Bạn chưa mở lịch rảnh trong tuần này.</strong>
            <span>Thêm thời gian rảnh để mentee có thể đặt lịch với bạn.</span>
            <button type="button" onClick={onUnavailableAction}>
              + Thêm lịch rảnh
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
