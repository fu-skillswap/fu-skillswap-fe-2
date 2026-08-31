/**
 * @file MentorScheduleCalendar.tsx
 * @description Calendar tuần cho lịch dạy của Mentor thiết kế chuẩn theo reference.
 */

'use client';

import { Calendar, ChevronDown, ChevronLeft, ChevronRight, Info } from 'lucide-react';
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

  return (
    <div className="mentor-schedule-calendar-card">
      <header className="mentor-schedule-calendar-toolbar">
        <div className="mentor-schedule-calendar-navigation">
          <button
            type="button"
            className="mentor-schedule-nav-btn"
            aria-label="Tuần trước"
            onClick={onPreviousWeek}
          >
            <ChevronLeft aria-hidden="true" />
          </button>
          <button type="button" className="mentor-schedule-today-button" onClick={onToday}>
            Hôm nay
          </button>
          <button
            type="button"
            className="mentor-schedule-nav-btn"
            aria-label="Tuần sau"
            onClick={onNextWeek}
          >
            <ChevronRight aria-hidden="true" />
          </button>
        </div>

        <div className="mentor-schedule-calendar-period-group">
          <div className="mentor-schedule-calendar-period">
            <strong>{formatWeekRange(weekStart)}</strong>
            <span>{timezone}</span>
          </div>
          <button type="button" className="mentor-schedule-icon-btn" aria-label="Xem lịch">
            <Calendar className="w-4 h-4" aria-hidden="true" />
          </button>
          <div className="mentor-schedule-dropdown">
            <button
              type="button"
              className="mentor-schedule-dropdown-btn"
              aria-label="Chọn chế độ hiển thị"
            >
              <span>Tuần</span>
              <ChevronDown className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <div className="mentor-schedule-calendar-content">
        <div className="mentor-schedule-calendar-scroll" ref={scrollRef}>
          <div className="mentor-schedule-calendar-grid" aria-label="Lịch dạy theo tuần">
            <div className="mentor-schedule-calendar-corner" />
            {days.map((day) => {
              const isWeekend = day.getUTCDay() === 0 || day.getUTCDay() === 6;
              const weekdayName = new Intl.DateTimeFormat('en-US', {
                timeZone: 'UTC',
                weekday: 'long',
              }).format(day);

              return (
                <div
                  key={day.toISOString()}
                  className={`mentor-schedule-calendar-day ${isWeekend ? 'is-weekend' : ''}`}
                >
                  <span className="weekday-name">{weekdayName}</span>
                  <strong className="day-date">{formatDate(day)}</strong>
                </div>
              );
            })}

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
                      const calculatedHeight = Math.max(
                        32,
                        (durationMinutes / 60) * HOUR_HEIGHT - 6,
                      );
                      const calculatedTop = (segment.startMinutes / 60) * HOUR_HEIGHT + 3;
                      const startTimeStr = formatSlotTime(segment.startMinutes);
                      const endTimeStr = formatSlotTime(segment.endMinutes);

                      return (
                        <article
                          className={`mentor-schedule-calendar-event event-availability event-${segment.event.status}`}
                          key={`${segment.event.id}-${dayIndex}`}
                          role={
                            segment.event.slotId || segment.event.bookingId ? 'button' : undefined
                          }
                          tabIndex={segment.event.slotId || segment.event.bookingId ? 0 : undefined}
                          onClick={() => {
                            if (segment.event.bookingId) {
                              onSelectBooking?.(segment.event.bookingId);
                            } else if (segment.event.slotId) {
                              onSelectSlot?.(segment.event.slotId);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              if (segment.event.bookingId) {
                                onSelectBooking?.(segment.event.bookingId);
                              } else if (segment.event.slotId) {
                                onSelectSlot?.(segment.event.slotId);
                              }
                            }
                          }}
                          style={{
                            height: `${calculatedHeight}px`,
                            top: `${calculatedTop}px`,
                          }}
                        >
                          <div className="event-time font-bold">
                            {startTimeStr} – {endTimeStr}
                          </div>
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

      {/* Legend footer matching reference spec */}
      <footer className="mentor-schedule-calendar-legend">
        <div className="legend-item">
          <span className="legend-box legend-box-available" aria-hidden="true" />
          <span>Khung giờ rảnh, chờ mentee đặt</span>
        </div>
        <div className="legend-item">
          <span className="legend-box legend-box-booked" aria-hidden="true" />
          <span>Khung giờ đã có mentee đặt</span>
        </div>
        <div className="legend-item">
          <span className="legend-box legend-box-ongoing" aria-hidden="true" />
          <span>Khung giờ đang diễn ra</span>
        </div>
        <div className="legend-item">
          <span className="legend-box legend-box-past" aria-hidden="true" />
          <span>Khung giờ đã diễn ra</span>
        </div>
        <div className="legend-item legend-info">
          <Info className="legend-info-icon" aria-hidden="true" />
          <span>Mentee có thể đặt lịch trong các khung giờ mentor đã mở.</span>
        </div>
      </footer>
    </div>
  );
}
