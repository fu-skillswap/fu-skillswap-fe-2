/**
 * @file mentorScheduleCalendarData.ts
 * @description Chuẩn hóa availability-slot DTO sang event dùng cho calendar Mentor.
 */

import type {
  AvailabilitySlotsResponse,
  AvailabilityTemplateResponse,
  MentorBookingResponse,
  WeekdayEnum,
} from '@/models/auth';
import { localDateTimeToUtcIso } from './mentorScheduleDateTime';
import { formatLocalTime } from './mentorTemplateHelpers';

export type MentorCalendarEventStatus = 'available' | 'booked' | 'ongoing' | 'past' | 'inactive';

export interface MentorCalendarEvent {
  id: string;
  start: Date;
  end: Date;
  type: 'availability';
  status: MentorCalendarEventStatus;
  source: 'slot' | 'template' | 'booking';
  isRecurring?: boolean;
  slotId?: string;
  bookingId?: string;
  note?: string;
  serviceTitle?: string;
}

export interface MentorScheduleCalendarData {
  events: MentorCalendarEvent[];
  isEmpty: boolean;
  error?: string;
}

const invalidPayloadMessage = 'Không thể đọc dữ liệu lịch từ máy chủ.';

const WEEKDAYS: WeekdayEnum[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function getDateInTimezone(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function getEventStatus(start: Date, end: Date, isBooked: boolean): MentorCalendarEventStatus {
  const now = Date.now();
  if (end.getTime() <= now) return 'past';
  if (isBooked && start.getTime() <= now) return 'ongoing';
  return isBooked ? 'booked' : 'available';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isSlotMutationCapability(value: unknown): value is Record<string, unknown> {
  return (
    isRecord(value) &&
    typeof value.mode === 'string' &&
    (value.restrictionCode === null ||
      value.restrictionCode === undefined ||
      typeof value.restrictionCode === 'string') &&
    typeof value.affectedPendingBookingCount === 'number'
  );
}

function isAvailabilitySlotService(value: unknown): value is Record<string, unknown> {
  return (
    isRecord(value) &&
    typeof value.serviceId === 'string' &&
    typeof value.title === 'string' &&
    typeof value.durationMinutes === 'number' &&
    typeof value.isFree === 'boolean' &&
    (value.priceScoin === null ||
      value.priceScoin === undefined ||
      typeof value.priceScoin === 'number') &&
    (value.bindingRemoval === null ||
      value.bindingRemoval === undefined ||
      isSlotMutationCapability(value.bindingRemoval))
  );
}

function isAvailabilitySlot(value: unknown): value is Record<string, unknown> {
  return (
    isRecord(value) &&
    typeof value.slotId === 'string' &&
    typeof value.startAt === 'string' &&
    typeof value.endAt === 'string' &&
    typeof value.timezone === 'string' &&
    typeof value.isActive === 'boolean' &&
    (value.note === null || value.note === undefined || typeof value.note === 'string') &&
    Array.isArray(value.services) &&
    value.services.every(isAvailabilitySlotService) &&
    typeof value.version === 'number' &&
    typeof value.pendingBookingCount === 'number' &&
    typeof value.lockingBookingCount === 'number' &&
    typeof value.hasLockingBooking === 'boolean' &&
    (value.timeMutation === null ||
      value.timeMutation === undefined ||
      isSlotMutationCapability(value.timeMutation)) &&
    (value.deactivation === null ||
      value.deactivation === undefined ||
      isSlotMutationCapability(value.deactivation)) &&
    typeof value.canEditNote === 'boolean'
  );
}

/**
 * Converts the unwrapped backend response to the UI event model.
 * Runtime guards keep an unexpected backend payload out of the calendar instead of treating it as an empty week.
 */
export function toMentorScheduleCalendarData(
  response: AvailabilitySlotsResponse | undefined,
): MentorScheduleCalendarData {
  if (!Array.isArray(response)) {
    return {
      events: [],
      isEmpty: false,
      error: invalidPayloadMessage,
    };
  }

  if (response.length === 0) return { events: [], isEmpty: true };

  const events: MentorCalendarEvent[] = [];
  for (const slot of response) {
    if (!isAvailabilitySlot(slot)) {
      return {
        events: [],
        isEmpty: false,
        error: invalidPayloadMessage,
      };
    }

    const startAtStr = slot.startAt as string;
    const endAtStr = slot.endAt as string;
    const start = new Date(startAtStr);
    const end = new Date(endAtStr);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      return {
        events: [],
        isEmpty: false,
        error: invalidPayloadMessage,
      };
    }

    const services = slot.services as Array<{ title?: string }>;
    const serviceTitle = services[0]?.title;
    const noteStr = typeof slot.note === 'string' ? slot.note.trim() : undefined;
    events.push({
      id: slot.slotId as string,
      start,
      end,
      type: 'availability',
      status: getEventStatus(start, end, false),
      source: 'slot',
      slotId: slot.slotId as string,
      note: noteStr || undefined,
      serviceTitle,
    });
  }

  return { events, isEmpty: false };
}

const inactiveBookingStatuses = new Set([
  'REJECTED_BY_MENTOR',
  'CANCELED_BY_MENTEE',
  'CANCELED_BY_MENTOR',
  'REQUEST_EXPIRED',
  'PAYMENT_EXPIRED',
]);

/** Splits availability around real booking intervals so only the reserved duration is marked booked. */
export function mergeBookingsIntoCalendar(
  availabilityEvents: MentorCalendarEvent[],
  bookings: MentorBookingResponse[] = [],
): MentorCalendarEvent[] {
  const bookingEvents = bookings.flatMap((booking) => {
    if (inactiveBookingStatuses.has(booking.bookingStatus)) return [];

    const start = new Date(booking.selectedStartTime);
    const end = new Date(booking.selectedEndTime);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) return [];

    return [
      {
        id: `booking-${booking.bookingId}`,
        start,
        end,
        type: 'availability' as const,
        status: getEventStatus(start, end, true),
        source: 'booking' as const,
        bookingId: booking.bookingId,
        serviceTitle: booking.serviceTitle ?? undefined,
      },
    ];
  });

  const availableFragments = availabilityEvents.flatMap((event) => {
    let fragments = [{ start: event.start, end: event.end }];

    bookingEvents.forEach((booking) => {
      fragments = fragments.flatMap((fragment) => {
        if (booking.end <= fragment.start || booking.start >= fragment.end) return [fragment];

        const remaining: Array<{ start: Date; end: Date }> = [];
        if (booking.start > fragment.start) {
          remaining.push({ start: fragment.start, end: booking.start });
        }
        if (booking.end < fragment.end) {
          remaining.push({ start: booking.end, end: fragment.end });
        }
        return remaining;
      });
    });

    return fragments.map((fragment) => ({
      ...event,
      id: `${event.id}-${fragment.start.getTime()}-${fragment.end.getTime()}`,
      start: fragment.start,
      end: fragment.end,
      status: getEventStatus(fragment.start, fragment.end, false),
    }));
  });

  return [...availableFragments, ...bookingEvents];
}

/** Projects active weekly templates into a concrete week and merges them with generated slots. */
export function mergeAvailabilityTemplatesIntoCalendar(
  slotEvents: MentorCalendarEvent[],
  templates: AvailabilityTemplateResponse[],
  weekStart: Date,
): MentorCalendarEvent[] {
  let mergedSlotEvents = slotEvents;
  const templateEvents: MentorCalendarEvent[] = [];

  [...templates]
    .sort((left, right) => {
      const leftCreatedAt = new Date(left.createdAt).getTime();
      const rightCreatedAt = new Date(right.createdAt).getTime();
      if (Number.isNaN(leftCreatedAt) || Number.isNaN(rightCreatedAt)) return 0;
      return leftCreatedAt - rightCreatedAt;
    })
    .forEach((template) => {
      const isActive =
        template.effectiveStatus === 'ACTIVE' && template.configuredStatus === 'ACTIVE';
      const today = getDateInTimezone(new Date(), template.timezone);

      WEEKDAYS.forEach((weekday, dayIndex) => {
        if (!template.weekdays.includes(weekday)) return;

        const date = addDays(weekStart, dayIndex).toISOString().slice(0, 10);
        const isOutsideEffectiveRange =
          date < template.effectiveFrom ||
          Boolean(template.effectiveTo && date > template.effectiveTo);
        const isInactiveFutureOccurrence = !isActive && date > today;
        const isSkipped =
          template.skippedDates?.includes(date) ||
          template.blockedOccurrences?.some((occurrence) => occurrence.date === date);
        if (isOutsideEffectiveRange || isInactiveFutureOccurrence || isSkipped) return;

        try {
          const start = new Date(
            localDateTimeToUtcIso(
              { date, time: formatLocalTime(template.startTime) },
              template.timezone,
            ),
          );
          const end = new Date(
            localDateTimeToUtcIso(
              { date, time: formatLocalTime(template.endTime) },
              template.timezone,
            ),
          );
          if (end <= start) return;

          const overlappingSlotIds = new Set(
            mergedSlotEvents
              .filter((event) => event.source === 'slot' && event.start < end && event.end > start)
              .map((event) => event.id),
          );
          if (overlappingSlotIds.size > 0) {
            mergedSlotEvents = mergedSlotEvents.map((event) =>
              overlappingSlotIds.has(event.id) ? { ...event, isRecurring: true } : event,
            );
            return;
          }

          const overlapsProjectedTemplate = templateEvents.some(
            (event) => event.start < end && event.end > start,
          );
          if (overlapsProjectedTemplate) return;

          templateEvents.push({
            id: `template-${template.templateId}-${date}`,
            start,
            end,
            type: 'availability',
            status: isActive ? getEventStatus(start, end, false) : 'inactive',
            source: 'template',
            isRecurring: true,
            note: template.note?.trim() || undefined,
            serviceTitle: template.services[0]?.title,
          });
        } catch {
          // Ignore a template occurrence whose local time is invalid in its configured timezone.
        }
      });
    });

  return [...mergedSlotEvents, ...templateEvents];
}
