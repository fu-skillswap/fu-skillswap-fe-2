/**
 * @file BookingCalendar.tsx
 * @description Component Lịch đặt giờ Mentoring (Booking Calendar Component).
 * Hiển thị ma trận ngày trong tuần và các khung giờ khả dụng cho phép Mentee click để chọn lịch hẹn.
 */

'use client';

import { Calendar } from 'lucide-react';
import { useBookingCalendar } from './useBookingCalendar';

/** Danh sách các ngày trong tuần mẫu cho lịch đặt */
const days = [
  { label: 'Mon', date: '2026-08-17' },
  { label: 'Tue', date: '2026-08-18' },
  { label: 'Wed', date: '2026-08-19' },
  { label: 'Thu', date: '2026-08-20' },
  { label: 'Fri', date: '2026-08-21' },
  { label: 'Sat', date: '2026-08-22' },
  { label: 'Sun', date: '2026-08-23' },
];

/** Danh sách các mốc giờ làm việc trong ngày */
const times = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00'];

/** Tập hợp các slot khung giờ rảnh khả dụng của Mentor */
const availableSlots = new Set([
  '2026-08-17T09:00',
  '2026-08-18T09:00',
  '2026-08-20T09:00',
  '2026-08-17T10:00',
  '2026-08-19T10:00',
  '2026-08-17T14:00',
  '2026-08-19T14:00',
  '2026-08-21T14:00',
  '2026-08-19T15:00',
  '2026-08-21T15:00',
]);

/** Props khởi tạo cho BookingCalendar Component */
interface BookingCalendarProps {
  /** Giá trị slot khung giờ đang được chọn */
  value?: string;
  /** Callback nhận khung giờ mới được chọn */
  onSelect: (value: string) => void;
}

/**
 * Component hiển thị ma trận chọn khung giờ tư vấn.
 */
export function BookingCalendar({ value, onSelect }: BookingCalendarProps) {
  const { slot, setSlot } = useBookingCalendar(value);
  const selectSlot = (nextSlot: string) => {
    setSlot(nextSlot);
    onSelect(nextSlot);
  };

  return (
    <section className="figma-booking-calendar" aria-label="Pick a time slot">
      <div className="figma-booking-calendar-heading">
        <span className="figma-booking-calendar-icon" aria-hidden="true">
          <Calendar aria-hidden="true" />
        </span>
        <div>
          <h3>Pick a Time Slot</h3>
          <p>August 2026 · Click an available slot to select</p>
        </div>
      </div>
      <div className="figma-booking-calendar-scroll">
        <div className="figma-booking-slot-grid">
          <span />
          {days.map((day) => (
            <strong key={day.date}>{day.label}</strong>
          ))}
          {times.flatMap((time) => [
            <span className="figma-booking-time" key={`${time}-label`}>
              {time}
            </span>,
            ...days.map((day) => {
              const nextSlot = `${day.date}T${time}`;
              const isAvailable = availableSlots.has(nextSlot);
              const isSelected = slot === nextSlot;
              return (
                <button
                  type="button"
                  key={nextSlot}
                  disabled={!isAvailable}
                  onClick={() => selectSlot(nextSlot)}
                  aria-label={`${day.label} ${time}${isAvailable ? ', available' : ', unavailable'}`}
                  className={
                    isSelected
                      ? 'figma-booking-slot figma-booking-slot-selected'
                      : isAvailable
                        ? 'figma-booking-slot figma-booking-slot-available'
                        : 'figma-booking-slot'
                  }
                />
              );
            }),
          ])}
        </div>
      </div>
      <div className="figma-booking-legend" aria-label="Slot legend">
        <span>
          <i className="figma-legend-available" />
          Available
        </span>
        <span>
          <i className="figma-legend-selected" />
          Selected
        </span>
        <span>
          <i />
          Unavailable
        </span>
      </div>
    </section>
  );
}
