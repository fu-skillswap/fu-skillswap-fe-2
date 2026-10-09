/**
 * @file BookingCalendar.tsx
 * @description Week / month calendar of the mentee's bookings with a right rail (book again,
 * mini calendar, status filters, mentors to book again).
 */

'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { MentorBookingResponse } from '@/models/auth';
import { TONE_ORDER, TONE_STYLES, getBookingTone, type BookingTone } from './bookingColors';
import {
  HOUR_HEIGHT,
  WEEKDAY_LABELS,
  addDays,
  addMonths,
  dayKey,
  formatMonthTitle,
  formatRangeTitle,
  formatShortDay,
  isSameDay,
  isSameMonth,
  monthGridDays,
  parseDate,
  readStorage,
  startOfDay,
  startOfMonth,
  weekDays,
  writeStorage,
  type CalendarView,
} from './calendarUtils';
import { EventPopover, MentorInitialsAvatar, type BookingEventHandlers } from './EventPopover';
import { MonthGrid } from './MonthGrid';
import { WeekGrid, eventsForDays } from './WeekGrid';

const HIDDEN_TONES_KEY = 'skillswap.myBookings.hiddenTones';

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [query]);
  return matches;
}

/** Re-renders every minute so the "now" line and past/future checks stay current. */
function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  return now;
}

export function BookingCalendar({
  bookings,
  view,
  onViewChange,
  isLoading,
  isSaving,
  locale,
  handlers,
  renderBookingCard,
}: {
  bookings: MentorBookingResponse[];
  view: CalendarView;
  onViewChange: (view: CalendarView) => void;
  isLoading: boolean;
  isSaving: boolean;
  locale: string;
  handlers: BookingEventHandlers;
  renderBookingCard: (booking: MentorBookingResponse) => ReactNode;
}) {
  const router = useRouter();
  const now = useNow();
  const isMobile = useMediaQuery('(max-width: 767px)');
  const [focusDate, setFocusDate] = useState(() => startOfDay(new Date()));
  const [selectedDay, setSelectedDay] = useState<Date>();
  const [hiddenTones, setHiddenTones] = useState<BookingTone[]>([]);
  const [popover, setPopover] = useState<{ booking: MentorBookingResponse; anchor: HTMLElement }>();

  useEffect(() => {
    try {
      const stored = JSON.parse(readStorage(HIDDEN_TONES_KEY) || '[]');
      if (Array.isArray(stored)) {
        setHiddenTones(stored.filter((tone): tone is BookingTone => tone in TONE_STYLES));
      }
    } catch {
      // Ignore a malformed stored value.
    }
  }, []);

  const toggleTone = (tone: BookingTone) => {
    setHiddenTones((current) => {
      const next = current.includes(tone)
        ? current.filter((item) => item !== tone)
        : [...current, tone];
      writeStorage(HIDDEN_TONES_KEY, JSON.stringify(next));
      return next;
    });
  };

  const closePopover = useCallback(() => setPopover(undefined), []);
  const openPopover = useCallback(
    (booking: MentorBookingResponse, anchor: HTMLElement) => setPopover({ booking, anchor }),
    [],
  );

  const visibleBookings = useMemo(
    () => bookings.filter((booking) => !hiddenTones.includes(getBookingTone(booking).tone)),
    [bookings, hiddenTones],
  );

  // Mobile week view shows 3 days around the focused day.
  const days = useMemo(() => {
    if (view === 'month') return monthGridDays(focusDate);
    if (isMobile) return [addDays(focusDate, -1), focusDate, addDays(focusDate, 1)];
    return weekDays(focusDate);
  }, [focusDate, isMobile, view]);

  const rangeDays = useMemo(
    () => (view === 'month' ? days.filter((day) => isSameMonth(day, focusDate)) : days),
    [days, focusDate, view],
  );
  const rangeStart = rangeDays[0];
  const rangeEnd = addDays(rangeDays[rangeDays.length - 1], 1);

  const events = useMemo(() => eventsForDays(visibleBookings, days), [days, visibleBookings]);
  const rangeEvents = useMemo(() => eventsForDays(bookings, rangeDays), [bookings, rangeDays]);
  const payCount = rangeEvents.filter((event) => event.booking.canPay).length;
  const shownInRange = events.filter(
    (event) => event.start >= rangeStart && event.start < rangeEnd,
  ).length;

  const nearestBooking = useMemo(() => {
    const dated = visibleBookings
      .map((booking) => ({ booking, start: parseDate(booking.selectedStartTime) }))
      .filter((item): item is { booking: MentorBookingResponse; start: Date } =>
        Boolean(item.start),
      )
      .sort((left, right) => left.start.getTime() - right.start.getTime());
    return (
      dated.find((item) => item.start >= rangeEnd) ??
      [...dated].reverse().find((item) => item.start < rangeStart)
    );
  }, [rangeEnd, rangeStart, visibleBookings]);

  const step = view === 'month' ? 0 : isMobile ? 3 : 7;
  const move = (direction: 1 | -1) => {
    setSelectedDay(undefined);
    setFocusDate((current) =>
      view === 'month' ? addMonths(current, direction) : addDays(current, direction * step),
    );
  };
  const goToDay = (day: Date) => {
    setFocusDate(startOfDay(day));
    if (view === 'month') setSelectedDay(startOfDay(day));
  };
  const showWeekOf = (day: Date) => {
    setFocusDate(startOfDay(day));
    setSelectedDay(undefined);
    onViewChange('week');
  };

  const unit = view === 'month' ? 'Tháng' : 'Tuần';
  const title =
    view === 'month'
      ? formatMonthTitle(focusDate)
      : formatRangeTitle(days[0], days[days.length - 1]);
  const rangeLabel = view === 'month' ? 'Tháng này' : isMobile ? 'Những ngày này' : 'Tuần này';
  const presentTones = TONE_ORDER.filter((tone) =>
    bookings.some((booking) => getBookingTone(booking).tone === tone),
  );
  const selectedDayBookings = selectedDay
    ? visibleBookings
        .filter((booking) => {
          const start = parseDate(booking.selectedStartTime);
          return start && isSameDay(start, selectedDay);
        })
        .sort((left, right) => left.selectedStartTime.localeCompare(right.selectedStartTime))
    : [];

  const emptyNote =
    !isLoading && shownInRange === 0 ? (
      <div className="grid justify-items-center gap-1.5 text-sm">
        <CalendarDays className="h-6 w-6 text-text-disabled" aria-hidden="true" />
        <strong className="text-text-main">
          Không có buổi học trong {view === 'month' ? 'tháng' : isMobile ? 'những ngày' : 'tuần'}{' '}
          này
        </strong>
        {nearestBooking && (
          <button
            type="button"
            onClick={() => goToDay(nearestBooking.start)}
            className="font-bold text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            Đến buổi gần nhất
          </button>
        )}
      </div>
    ) : undefined;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_250px] lg:items-start">
      <div className="min-w-0 overflow-hidden rounded-[20px] border border-border-color bg-white shadow-xs">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 border-b border-border-light px-4 py-3">
          <Button variant="outline" size="sm" onClick={() => goToDay(new Date())}>
            Hôm nay
          </Button>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label={`${unit} trước`}
              onClick={() => move(-1)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-text-secondary outline-none hover:bg-surface-subtle focus-visible:ring-3 focus-visible:ring-primary/20"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label={`${unit} sau`}
              onClick={() => move(1)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-text-secondary outline-none hover:bg-surface-subtle focus-visible:ring-3 focus-visible:ring-primary/20"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="min-w-0">
            <h2 className="m-0 text-lg font-extrabold text-text-main" aria-live="polite">
              {title}
            </h2>
            <p className="m-0 text-xs text-text-muted">
              {rangeLabel}: {rangeEvents.length} buổi
              {payCount > 0 && ` · ${payCount} cần thanh toán`}
            </p>
          </div>
        </div>

        {/* Legend (the rail filters replace it on large screens) */}
        {presentTones.length > 0 && (
          <ul className="m-0 flex list-none flex-wrap gap-x-4 gap-y-1 border-b border-border-light px-4 py-2 lg:hidden">
            {presentTones.map((tone) => (
              <li key={tone} className="flex items-center gap-1.5 text-xs text-text-secondary">
                <span
                  className="h-2.5 w-2.5 rounded-sm"
                  style={{ backgroundColor: TONE_STYLES[tone].swatch }}
                  aria-hidden="true"
                />
                {TONE_STYLES[tone].label}
              </li>
            ))}
          </ul>
        )}

        {isLoading ? (
          <CalendarSkeleton columns={view === 'month' ? 7 : days.length} />
        ) : view === 'week' ? (
          <WeekGrid
            days={days}
            events={events}
            now={now}
            emptyState={emptyNote}
            onEventClick={openPopover}
            onSlotClick={(start) =>
              // TODO: use ?from to pre-filter mentor availability once the booking page supports it.
              router.push(
                `/${locale}/mentor-booking?from=${encodeURIComponent(start.toISOString())}`,
              )
            }
          />
        ) : (
          <>
            {emptyNote && <div className="border-b border-border-light px-4 py-3">{emptyNote}</div>}
            <MonthGrid
              month={focusDate}
              days={days}
              events={events}
              now={now}
              isCompact={isMobile}
              selectedDay={selectedDay}
              onEventClick={openPopover}
              onDayClick={(day) => (isMobile ? setSelectedDay(day) : showWeekOf(day))}
              onShowWeek={showWeekOf}
            />
          </>
        )}

        {isMobile && view === 'month' && selectedDay && (
          <div className="grid gap-3 border-t border-border-light p-4">
            <strong className="text-sm text-text-main">
              {formatShortDay(selectedDay)} · {selectedDayBookings.length} buổi
            </strong>
            {selectedDayBookings.map((booking) => (
              <div key={booking.bookingId}>{renderBookingCard(booking)}</div>
            ))}
          </div>
        )}
      </div>

      {/* Right rail (stacks under the calendar below lg) */}
      <aside className="flex flex-col gap-4" aria-label="Tiện ích lịch">
        <Link
          href={`/${locale}/mentor-booking`}
          className="order-1 inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-bold text-white no-underline shadow-xs outline-none transition-colors hover:bg-primary-hover focus-visible:ring-4 focus-visible:ring-primary/20"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Đặt buổi học mới
        </Link>

        <MiniCalendar
          focusDate={focusDate}
          highlightDays={view === 'week' ? days : []}
          bookings={visibleBookings}
          today={startOfDay(now)}
          onPick={goToDay}
        />

        {presentTones.length > 0 && (
          <section className="order-3 rounded-2xl border border-border-color bg-white p-4 shadow-xs">
            <h3 className="m-0 mb-2 text-sm font-extrabold text-text-main">Hiển thị trên lịch</h3>
            <ul className="m-0 grid list-none gap-1 p-0">
              {presentTones.map((tone) => {
                const count = bookings.filter(
                  (booking) => getBookingTone(booking).tone === tone,
                ).length;
                return (
                  <li key={tone}>
                    <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1 py-1.5 text-sm text-text-secondary hover:bg-surface-subtle">
                      <input
                        type="checkbox"
                        checked={!hiddenTones.includes(tone)}
                        onChange={() => toggleTone(tone)}
                        className="h-4 w-4 cursor-pointer"
                        style={{ accentColor: TONE_STYLES[tone].swatch }}
                      />
                      <span className="flex-1">{TONE_STYLES[tone].label}</span>
                      <span className="text-xs font-bold text-text-muted">{count}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <MentorsToRebook bookings={bookings} now={now} locale={locale} />
      </aside>

      {popover && (
        <EventPopover
          booking={popover.booking}
          anchor={popover.anchor}
          locale={locale}
          isSaving={isSaving}
          handlers={handlers}
          onClose={closePopover}
        />
      )}
    </div>
  );
}

function CalendarSkeleton({ columns }: { columns: number }) {
  return (
    <div className="animate-pulse p-4" aria-label="Đang tải lịch" role="status">
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }, (_, index) => (
          <div key={index} className="h-10 rounded-lg bg-slate-100" />
        ))}
      </div>
      <div className="mt-3 grid gap-px">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="rounded bg-slate-50" style={{ height: HOUR_HEIGHT - 4 }} />
        ))}
      </div>
    </div>
  );
}

function MiniCalendar({
  focusDate,
  highlightDays,
  bookings,
  today,
  onPick,
}: {
  focusDate: Date;
  highlightDays: Date[];
  bookings: MentorBookingResponse[];
  today: Date;
  onPick: (day: Date) => void;
}) {
  const [month, setMonth] = useState(() => startOfMonth(focusDate));
  useEffect(() => setMonth(startOfMonth(focusDate)), [focusDate]);

  const bookedDays = useMemo(() => {
    const keys = new Set<string>();
    bookings.forEach((booking) => {
      const start = parseDate(booking.selectedStartTime);
      if (start) keys.add(dayKey(start));
    });
    return keys;
  }, [bookings]);
  const highlighted = new Set(highlightDays.map(dayKey));

  return (
    <section className="order-2 hidden rounded-2xl border border-border-color bg-white p-3 shadow-xs lg:block">
      <div className="mb-2 flex items-center justify-between">
        <strong className="text-sm text-text-main">{formatMonthTitle(month)}</strong>
        <div className="flex">
          <button
            type="button"
            aria-label="Tháng trước"
            onClick={() => setMonth((current) => addMonths(current, -1))}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-text-secondary outline-none hover:bg-surface-subtle focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-label="Tháng sau"
            onClick={() => setMonth((current) => addMonths(current, 1))}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-text-secondary outline-none hover:bg-surface-subtle focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 text-center">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label} className="py-1 text-[10px] font-bold text-text-muted">
            {label}
          </span>
        ))}
        {monthGridDays(month).map((day) => {
          const key = dayKey(day);
          const isToday = isSameDay(day, today);
          const inMonth = isSameMonth(day, month);
          return (
            <div key={key} className={`py-0.5 ${highlighted.has(key) ? 'bg-sky-100' : ''}`}>
              <button
                type="button"
                onClick={() => onPick(day)}
                aria-label={`${formatShortDay(day)}${bookedDays.has(key) ? ', có buổi học' : ''}`}
                className={`relative mx-auto inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${isToday ? 'bg-primary text-white' : inMonth ? 'text-text-main hover:bg-surface-subtle' : 'text-slate-400 hover:bg-surface-subtle'}`}
              >
                {day.getDate()}
                {bookedDays.has(key) && (
                  <span
                    className={`absolute bottom-0.5 h-1 w-1 rounded-full ${isToday ? 'bg-white' : 'bg-primary'}`}
                    aria-hidden="true"
                  />
                )}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function MentorsToRebook({
  bookings,
  now,
  locale,
}: {
  bookings: MentorBookingResponse[];
  now: Date;
  locale: string;
}) {
  const mentors = useMemo(() => {
    const byMentor = new Map<
      string,
      { id: string; name: string; avatar?: string | null; completed: number; next?: Date }
    >();
    bookings.forEach((booking) => {
      if (!booking.mentorUserId) return;
      const { tone } = getBookingTone(booking);
      const start = parseDate(booking.selectedStartTime);
      const entry = byMentor.get(booking.mentorUserId) ?? {
        id: booking.mentorUserId,
        name: booking.mentorDisplayName || 'Mentor',
        avatar: booking.mentorAvatarUrl,
        completed: 0,
      };
      if (tone === 'completed') entry.completed += 1;
      if (tone !== 'completed' && tone !== 'closed' && start && start > now) {
        if (!entry.next || start < entry.next) entry.next = start;
      }
      byMentor.set(booking.mentorUserId, entry);
    });
    return [...byMentor.values()]
      .filter((mentor) => mentor.completed > 0 || mentor.next)
      .sort(
        (left, right) =>
          right.completed - left.completed ||
          (left.next?.getTime() ?? Infinity) - (right.next?.getTime() ?? Infinity),
      )
      .slice(0, 3);
  }, [bookings, now]);

  if (mentors.length === 0) return null;

  return (
    <section className="order-2 rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 to-blue-50 p-4 lg:order-4">
      <h3 className="m-0 mb-3 text-sm font-extrabold text-text-main">
        Học tiếp với mentor của bạn
      </h3>
      <ul className="m-0 grid list-none gap-3 p-0">
        {mentors.map((mentor) => (
          <li key={mentor.id} className="flex items-center gap-2.5">
            <MentorInitialsAvatar name={mentor.name} url={mentor.avatar} />
            <div className="min-w-0 flex-1">
              <strong className="block truncate text-sm text-text-main">{mentor.name}</strong>
              <span className="block truncate text-xs text-text-muted">
                {mentor.completed > 0
                  ? `Đã học ${mentor.completed} buổi`
                  : mentor.next && `Buổi tới: ${formatShortDay(mentor.next)}`}
              </span>
            </div>
            <Link
              href={`/${locale}/mentor-booking?mentorId=${encodeURIComponent(mentor.id)}`}
              className="inline-flex h-8 shrink-0 items-center rounded-xl border border-primary-border bg-white px-3 text-xs font-bold text-primary no-underline outline-none hover:bg-primary-light focus-visible:ring-3 focus-visible:ring-primary/20"
            >
              Đặt lại
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
