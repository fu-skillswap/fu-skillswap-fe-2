/**
 * @file weeklyScheduleForm.ts
 * @description Pure helpers for the weekly availability form: time options, duration and
 * summary copy, range validation and conflict detection against existing templates.
 */

import type { AvailabilityTemplateResponse, WeekdayEnum } from '@/models/auth';
import { ALL_WEEKDAYS, WEEKDAY_LABELS, formatLocalTime } from './mentorTemplateHelpers';

export interface TimeRange {
  id: string;
  start: string;
  end: string;
}

// No backend limit is exposed on the client, so the picker offers 06:00–23:30 in 30-minute steps.
const FIRST_MINUTE = 6 * 60;
const LAST_MINUTE = 23 * 60 + 30;
const STEP_MINUTES = 30;

export const toMinutes = (time: string) => {
  const [hour, minute] = time.split(':').map(Number);
  return (hour || 0) * 60 + (minute || 0);
};

export const fromMinutes = (total: number) =>
  `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;

export const TIME_OPTIONS: string[] = Array.from(
  { length: (LAST_MINUTE - FIRST_MINUTE) / STEP_MINUTES + 1 },
  (_, index) => fromMinutes(FIRST_MINUTE + index * STEP_MINUTES),
);

/** Adds an off-grid value (e.g. an older template at 05:15) so editing never drops it. */
export function timeOptionsWith(value: string) {
  if (!value || TIME_OPTIONS.includes(value)) return TIME_OPTIONS;
  return [...TIME_OPTIONS, value].sort((a, b) => toMinutes(a) - toMinutes(b));
}

/** "3 giờ", "1 giờ 30 phút", "30 phút". */
export function formatDuration(minutes: number) {
  if (minutes <= 0) return '';
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest} phút`;
  return rest ? `${hours} giờ ${rest} phút` : `${hours} giờ`;
}

export const rangeMinutes = (range: Pick<TimeRange, 'start' | 'end'>) =>
  toMinutes(range.end) - toMinutes(range.start);

export const formatRange = (range: Pick<TimeRange, 'start' | 'end'>) =>
  `${range.start} – ${range.end}`;

const overlaps = (aStart: string, aEnd: string, bStart: string, bEnd: string) =>
  toMinutes(aStart) < toMinutes(bEnd) && toMinutes(bStart) < toMinutes(aEnd);

/** Per-row error: invalid order first, then overlap with an earlier row of the same form. */
export function getRangeErrors(ranges: TimeRange[]) {
  const errors: Record<string, string> = {};
  ranges.forEach((range, index) => {
    if (rangeMinutes(range) <= 0) {
      errors[range.id] = 'Giờ kết thúc phải sau giờ bắt đầu.';
      return;
    }
    const clashes = ranges
      .slice(0, index)
      .some(
        (other) =>
          rangeMinutes(other) > 0 && overlaps(range.start, range.end, other.start, other.end),
      );
    if (clashes) errors[range.id] = 'Khung giờ này trùng với khung giờ khác.';
  });
  return errors;
}

/** Next row to add: 19:00–21:00, or right after the latest row when the evening is taken. */
export function nextDefaultRange(ranges: TimeRange[]): Omit<TimeRange, 'id'> {
  if (!ranges.some((range) => overlaps('19:00', '21:00', range.start, range.end))) {
    return { start: '19:00', end: '21:00' };
  }
  const latestEnd = Math.max(...ranges.map((range) => toMinutes(range.end)));
  if (latestEnd + STEP_MINUTES > LAST_MINUTE) return { start: '19:00', end: '21:00' };
  return {
    start: fromMinutes(latestEnd),
    end: fromMinutes(Math.min(latestEnd + 120, LAST_MINUTE)),
  };
}

export interface ScheduleConflict {
  key: string;
  weekday: WeekdayEnum;
  start: string;
  end: string;
}

const isLiveTemplate = (template: AvailabilityTemplateResponse) =>
  !['ARCHIVED', 'EXPIRED'].includes(String(template.effectiveStatus).toUpperCase()) &&
  String(template.configuredStatus).toUpperCase() !== 'ARCHIVED';

/**
 * Existing (active or paused) templates sharing a weekday, an overlapping time and an
 * overlapping effective date range with the new schedule. Dates are ISO yyyy-MM-dd strings.
 */
export function findScheduleConflicts(
  templates: AvailabilityTemplateResponse[],
  draft: {
    weekdays: WeekdayEnum[];
    ranges: TimeRange[];
    effectiveFrom: string;
    effectiveTo?: string;
    excludeTemplateId?: string;
  },
): ScheduleConflict[] {
  const conflicts = new Map<string, ScheduleConflict>();
  templates.forEach((template) => {
    if (template.templateId === draft.excludeTemplateId || !isLiveTemplate(template)) return;
    const datesOverlap =
      (!template.effectiveTo ||
        !draft.effectiveFrom ||
        draft.effectiveFrom <= template.effectiveTo) &&
      (!draft.effectiveTo || draft.effectiveTo >= template.effectiveFrom);
    if (!datesOverlap) return;
    const start = formatLocalTime(template.startTime);
    const end = formatLocalTime(template.endTime);
    const timeClash = draft.ranges.some(
      (range) => rangeMinutes(range) > 0 && overlaps(range.start, range.end, start, end),
    );
    if (!timeClash) return;
    template.weekdays
      .filter((weekday) => draft.weekdays.includes(weekday))
      .forEach((weekday) => {
        const key = `${template.templateId}-${weekday}`;
        conflicts.set(key, { key, weekday, start, end });
      });
  });
  return [...conflicts.values()].sort(
    (a, b) => ALL_WEEKDAYS.indexOf(a.weekday) - ALL_WEEKDAYS.indexOf(b.weekday),
  );
}

const WORK_WEEK: WeekdayEnum[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

/** "Mọi ngày", "Thứ 2 – Thứ 6" or "Mỗi Thứ 2, Thứ 4". */
export function formatDayGroup(weekdays: WeekdayEnum[]) {
  const ordered = ALL_WEEKDAYS.filter((weekday) => weekdays.includes(weekday));
  if (ordered.length === 7) return 'Mọi ngày';
  if (ordered.length === 5 && WORK_WEEK.every((weekday) => ordered.includes(weekday))) {
    return 'Thứ 2 – Thứ 6';
  }
  return `Mỗi ${ordered.map((weekday) => WEEKDAY_LABELS[weekday]).join(', ')}`;
}

/** "Mỗi Thứ 2, 09:00 – 12:00 · 3 giờ mỗi tuần". */
export function formatScheduleSummary(weekdays: WeekdayEnum[], ranges: TimeRange[]) {
  const ordered = [...ranges].sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
  const weeklyMinutes =
    ordered.reduce((total, range) => total + Math.max(0, rangeMinutes(range)), 0) * weekdays.length;
  return `${formatDayGroup(weekdays)}, ${ordered.map(formatRange).join(' và ')} · ${formatDuration(weeklyMinutes)} mỗi tuần`;
}

/** Local calendar date as yyyy-MM-dd (toISOString would shift to UTC). */
export function todayIso() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
