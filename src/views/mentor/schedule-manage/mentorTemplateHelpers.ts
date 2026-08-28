/**
 * @file mentorTemplateHelpers.ts
 * @description Helper functions for Availability Templates formatting and parsing.
 */

import type { LocalTime, WeekdayEnum } from '@/models/auth';

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

/** Converts HH:mm input string to LocalTime object { hour, minute, second: 0, nano: 0 } */
export function parseLocalTimeToObject(timeStr: string) {
  const [h, m] = timeStr.split(':').map(Number);
  return {
    hour: Number.isNaN(h) ? 0 : h,
    minute: Number.isNaN(m) ? 0 : m,
    second: 0,
    nano: 0,
  };
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
