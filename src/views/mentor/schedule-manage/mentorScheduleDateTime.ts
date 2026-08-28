/**
 * @file mentorScheduleDateTime.ts
 * @description Chuyển ngày giờ local của Mentor sang UTC instant theo timezone Booking Policy.
 */

interface LocalDateTime {
  date: string;
  time: string;
}

function getTimezoneOffsetMilliseconds(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts
      .filter((part) => ['year', 'month', 'day', 'hour', 'minute', 'second'].includes(part.type))
      .map((part) => [part.type, Number(part.value)]),
  );
  const localTimeAsUtc = Date.UTC(
    values.year,
    values.month - 1,
    values.day,
    values.hour,
    values.minute,
    values.second,
  );
  return localTimeAsUtc - date.getTime();
}

function matchesLocalDateTime(date: Date, localDateTime: LocalDateTime, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return (
    `${values.year}-${values.month}-${values.day}` === localDateTime.date &&
    `${values.hour}:${values.minute}` === localDateTime.time
  );
}

/**
 * Converts a local date/time selected in the booking-policy timezone to a UTC ISO instant.
 * Throws when the local time does not exist in that timezone, such as a DST-forward gap.
 */
export function localDateTimeToUtcIso(localDateTime: LocalDateTime, timezone: string) {
  const [year, month, day] = localDateTime.date.split('-').map(Number);
  const [hour, minute] = localDateTime.time.split(':').map(Number);
  const localTimeAsUtc = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
  let candidate = new Date(
    localTimeAsUtc - getTimezoneOffsetMilliseconds(new Date(localTimeAsUtc), timezone),
  );
  candidate = new Date(localTimeAsUtc - getTimezoneOffsetMilliseconds(candidate, timezone));

  if (!matchesLocalDateTime(candidate, localDateTime, timezone)) {
    throw new Error('Thời gian đã chọn không tồn tại trong múi giờ này.');
  }

  return candidate.toISOString();
}
