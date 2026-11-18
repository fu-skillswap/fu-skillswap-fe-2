/**
 * @file BookingTimeBlock.tsx
 * @description Date tile + time range + date line of a booking, shared by the booking detail
 * dialogs. Times are formatted in the given IANA time zone (Vietnam time by default).
 */

export const VIETNAM_TIME_ZONE = 'Asia/Ho_Chi_Minh';

const WEEKDAY_LONG = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
const WEEKDAY_SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

interface ZonedParts {
  year: number;
  month: number;
  day: number;
  weekday: number;
  time: string;
}

const pad = (value: number) => String(value).padStart(2, '0');

/** Calendar parts of `date` as seen in `timeZone`. */
export function zonedParts(date: Date, timeZone = VIETNAM_TIME_ZONE): ZonedParts {
  const values: Record<string, string> = {};
  new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  })
    .formatToParts(date)
    .forEach((part) => {
      values[part.type] = part.value;
    });
  const year = Number(values.year);
  const month = Number(values.month);
  const day = Number(values.day);
  return {
    year,
    month,
    day,
    weekday: new Date(Date.UTC(year, month - 1, day)).getUTCDay(),
    time: `${values.hour}:${values.minute}`,
  };
}

/** "20:30" in the given time zone. */
export const formatZonedTime = (date: Date, timeZone = VIETNAM_TIME_ZONE) =>
  zonedParts(date, timeZone).time;

/** "20:30, 17/11" in the given time zone. */
export function formatZonedTimeDay(date: Date, timeZone = VIETNAM_TIME_ZONE) {
  const parts = zonedParts(date, timeZone);
  return `${parts.time}, ${pad(parts.day)}/${pad(parts.month)}`;
}

interface BookingTimeBlockProps {
  start: Date;
  end?: Date;
  durationMinutes?: number | null;
  /** Last item of the date line: "giờ Việt Nam" for upcoming sessions, the platform after. */
  trailing?: string;
  /** Past session: grey background instead of the blue tint. */
  past?: boolean;
  timeZone?: string;
}

export function BookingTimeBlock({
  start,
  end,
  durationMinutes,
  trailing,
  past = false,
  timeZone = VIETNAM_TIME_ZONE,
}: BookingTimeBlockProps) {
  const from = zonedParts(start, timeZone);
  const to = end ? zonedParts(end, timeZone) : undefined;
  const minutes =
    durationMinutes || (end ? Math.round((end.getTime() - start.getTime()) / 60_000) : 0);
  const dateLine = [
    `${WEEKDAY_LONG[from.weekday]}, ${pad(from.day)}/${pad(from.month)}/${from.year}`,
    minutes > 0 ? `${minutes} phút` : '',
    trailing ?? '',
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div
      className={`flex items-center gap-4 rounded-2xl p-4 ${past ? 'bg-border-light' : 'bg-primary-light'}`}
    >
      <div
        className="flex h-[68px] w-[60px] shrink-0 flex-col items-center justify-center rounded-xl bg-white text-text-main shadow-xs"
        aria-hidden="true"
      >
        <span className="text-xs font-semibold text-text-secondary">
          {WEEKDAY_SHORT[from.weekday]}
        </span>
        <span className="text-2xl leading-none font-bold">{from.day}</span>
        <span className="text-xs text-text-secondary">Th{from.month}</span>
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        <strong className="text-lg leading-tight font-bold text-text-main">
          {to ? `${from.time} – ${to.time}` : from.time}
        </strong>
        <span className="text-sm text-text-secondary">{dateLine}</span>
      </div>
    </div>
  );
}
