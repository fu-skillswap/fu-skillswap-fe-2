/**
 * @file calendarUtils.ts
 * @description Date math for the bookings calendar. Weeks start on Monday; every date is read in
 * the browser's local time zone (Asia/Ho_Chi_Minh for our users).
 */

export type CalendarView = 'week' | 'month';

export const HOUR_HEIGHT = 56;
export const DEFAULT_START_HOUR = 7;
export const DEFAULT_END_HOUR = 23;

/** Short weekday labels, Monday first. */
export const WEEKDAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

const LONG_WEEKDAYS = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

export function parseDate(value?: string | null): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

export function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

/** Monday of the week that contains `date`. */
export function startOfWeek(date: Date) {
  const day = startOfDay(date);
  return addDays(day, -((day.getDay() + 6) % 7));
}

export function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function isSameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

export function isSameMonth(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth();
}

export function dayKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Monday-first index (T2 = 0 … CN = 6). */
export function weekdayIndex(date: Date) {
  return (date.getDay() + 6) % 7;
}

export function minutesOfDay(date: Date) {
  return date.getHours() * 60 + date.getMinutes();
}

export function weekDays(date: Date) {
  const monday = startOfWeek(date);
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
}

/** Days shown in the month grid: whole weeks covering the month (5 or 6 rows). */
export function monthGridDays(date: Date) {
  const first = startOfMonth(date);
  const gridStart = startOfWeek(first);
  const lastDay = new Date(first.getFullYear(), first.getMonth() + 1, 0);
  const rows = Math.ceil((weekdayIndex(first) + lastDay.getDate()) / 7);
  return Array.from({ length: rows * 7 }, (_, index) => addDays(gridStart, index));
}

export function formatTime(date: Date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function formatTimeRange(start: Date, end?: Date) {
  return end ? `${formatTime(start)} – ${formatTime(end)}` : formatTime(start);
}

/** "5 – 11 tháng 10, 2026" or "28 tháng 9 – 4 tháng 10, 2026" (or across years). */
export function formatRangeTitle(first: Date, last: Date) {
  if (first.getFullYear() !== last.getFullYear()) {
    return `${first.getDate()} tháng ${first.getMonth() + 1}, ${first.getFullYear()} – ${last.getDate()} tháng ${last.getMonth() + 1}, ${last.getFullYear()}`;
  }
  if (first.getMonth() !== last.getMonth()) {
    return `${first.getDate()} tháng ${first.getMonth() + 1} – ${last.getDate()} tháng ${last.getMonth() + 1}, ${last.getFullYear()}`;
  }
  return `${first.getDate()} – ${last.getDate()} tháng ${last.getMonth() + 1}, ${last.getFullYear()}`;
}

export function formatMonthTitle(date: Date) {
  return `Tháng ${date.getMonth() + 1}, ${date.getFullYear()}`;
}

/** "Thứ Bảy, 10 tháng 10". */
export function formatLongDay(date: Date) {
  return `${LONG_WEEKDAYS[date.getDay()]}, ${date.getDate()} tháng ${date.getMonth() + 1}`;
}

/** "T7 10/10". */
export function formatShortDay(date: Date) {
  return `${WEEKDAY_LABELS[weekdayIndex(date)]} ${date.getDate()}/${date.getMonth() + 1}`;
}

export interface PositionedEvent<T> {
  item: T;
  start: Date;
  end: Date;
  column: number;
  columns: number;
}

/**
 * Simple column packing: events that overlap (directly or through a chain) form a cluster and
 * share the column width side by side.
 */
export function packEvents<T>(events: Array<{ item: T; start: Date; end: Date }>) {
  const sorted = [...events].sort(
    (left, right) =>
      left.start.getTime() - right.start.getTime() || right.end.getTime() - left.end.getTime(),
  );
  const result: PositionedEvent<T>[] = [];
  let cluster: PositionedEvent<T>[] = [];
  let columnEnds: number[] = [];
  let clusterEnd = 0;

  const flush = () => {
    cluster.forEach((event) => (event.columns = columnEnds.length));
    result.push(...cluster);
    cluster = [];
    columnEnds = [];
  };

  sorted.forEach((event) => {
    const start = event.start.getTime();
    const end = Math.max(event.end.getTime(), start + 15 * 60_000);
    if (cluster.length > 0 && start >= clusterEnd) flush();
    let column = columnEnds.findIndex((columnEnd) => columnEnd <= start);
    if (column === -1) {
      column = columnEnds.length;
      columnEnds.push(end);
    } else {
      columnEnds[column] = end;
    }
    clusterEnd = cluster.length === 0 ? end : Math.max(clusterEnd, end);
    cluster.push({ ...event, column, columns: 1 });
  });
  flush();
  return result;
}

export function readStorage(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStorage(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage can be blocked (private mode); the choice simply is not remembered.
  }
}
