/**
 * @file mentorTemplateHelpers.ts
 * @description Helper functions for Availability Templates formatting and parsing.
 */

import type { AvailabilityTemplateResponse, LocalTime, WeekdayEnum } from '@/models/auth';

/** Helper to format LocalTime object or string to HH:mm string. */
export function formatLocalTime(time: LocalTime | null | undefined): string {
  if (!time) return '';
  if (typeof time === 'string') {
    const parts = time.split(':');
    if (parts.length >= 2) {
      return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
    }
    return time;
  }
  const hour = String(time.hour ?? 0).padStart(2, '0');
  const minute = String(time.minute ?? 0).padStart(2, '0');
  return `${hour}:${minute}`;
}

export const WEEKDAY_LABELS: Record<WeekdayEnum, string> = {
  MONDAY: 'Thứ 2',
  TUESDAY: 'Thứ 3',
  WEDNESDAY: 'Thứ 4',
  THURSDAY: 'Thứ 5',
  FRIDAY: 'Thứ 6',
  SATURDAY: 'Thứ 7',
  SUNDAY: 'Chủ Nhật',
};

export const WEEKDAY_SHORT_LABELS: Record<WeekdayEnum, string> = {
  MONDAY: 'T2',
  TUESDAY: 'T3',
  WEDNESDAY: 'T4',
  THURSDAY: 'T5',
  FRIDAY: 'T6',
  SATURDAY: 'T7',
  SUNDAY: 'CN',
};

export const ALL_WEEKDAYS: WeekdayEnum[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

/** Formats an array of WeekdayEnums to "Thứ 2 · Thứ 4 · Thứ 6" */
export function formatWeekdays(weekdays: WeekdayEnum[]): string {
  if (!weekdays || weekdays.length === 0) return 'Chưa chọn ngày';
  return weekdays.map((w) => WEEKDAY_LABELS[w] ?? w).join(' · ');
}

/** Formats ISO YYYY-MM-DD to DD/MM/YYYY */
export function formatDateVi(dateStr?: string | null): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

/** Validates if a YYYY-MM-DD date is valid for a given template */
export function validateOccurrenceDateForTemplate(
  occurrenceDate: string,
  template: AvailabilityTemplateResponse,
): string | null {
  if (!occurrenceDate) {
    return 'Vui lòng chọn ngày cần bỏ qua.';
  }

  // Check effective range
  if (template.effectiveFrom && occurrenceDate < template.effectiveFrom) {
    return `Ngày cần bỏ qua phải từ ngày ${formatDateVi(template.effectiveFrom)} trở đi.`;
  }
  if (template.effectiveTo && occurrenceDate > template.effectiveTo) {
    return `Ngày cần bỏ qua phải trước hoặc bằng ngày ${formatDateVi(template.effectiveTo)}.`;
  }

  // Check weekday
  const dateObj = new Date(occurrenceDate + 'T00:00:00');
  const dayIndex = dateObj.getDay();
  const dayMap: Record<number, WeekdayEnum> = {
    0: 'SUNDAY',
    1: 'MONDAY',
    2: 'TUESDAY',
    3: 'WEDNESDAY',
    4: 'THURSDAY',
    5: 'FRIDAY',
    6: 'SATURDAY',
  };
  const targetWeekday = dayMap[dayIndex];
  if (!template.weekdays.includes(targetWeekday)) {
    return 'Ngày này không thuộc lịch lặp đã chọn.';
  }

  return null;
}
