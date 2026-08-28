/**
 * @file mentorScheduleCalendarData.ts
 * @description Chuẩn hóa availability-slot DTO sang event dùng cho calendar Mentor.
 */

import type { AvailabilitySlotsResponse } from '@/models/auth';

export interface MentorCalendarEvent {
  id: string;
  start: Date;
  end: Date;
  type: 'availability';
  note?: string;
  serviceTitle?: string;
}

export interface MentorScheduleCalendarData {
  events: MentorCalendarEvent[];
  isEmpty: boolean;
  error?: string;
}

const invalidPayloadMessage = 'Không thể đọc dữ liệu lịch từ máy chủ.';

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
      note: noteStr || undefined,
      serviceTitle,
    });
  }

  return { events, isEmpty: false };
}
