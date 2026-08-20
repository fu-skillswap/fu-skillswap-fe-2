/**
 * @file BookingFlow.tsx
 * @description Component quy trình Đặt lịch tư vấn Mentoring (Booking Flow Component).
 * Bao gồm tóm tắt thông tin Mentor, gói dịch vụ, bảng chọn khung giờ và xác nhận đặt lịch hẹn.
 */

"use client";

import type { Mentor, MentorService } from "@/models/entities";
import { Button } from "@/components/ui/Button";
import { BookingCalendar } from "@/components/domain/booking-calendar/BookingCalendar";

/** Tạo chữ cái viết tắt từ tên người dùng cho avatar */
function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");
}

/** Định dạng hiển thị giá điểm S-Coins */
function priceLabel(price?: number) {
  return price ? new Intl.NumberFormat("en-US").format(price) : "—";
}

/** Định dạng hiển thị chuỗi ngày giờ từ slot ISO */
function slotLabel(slot?: string) {
  if (!slot) return "Select an available time slot";
  const [date, time] = slot.split("T");
  return `${date.split("-").reverse().join("/")} · ${time}`;
}

/** Props của BookingFlow Component */
interface BookingFlowProps {
  /** Thông tin Mentor */
  mentor: Mentor;
  /** Thông tin gói dịch vụ Mentoring được chọn */
  service: MentorService;
  /** Slot khung giờ đã chọn */
  slot?: string;
  /** Callback khi đổi slot khung giờ */
  onSlotChange: (slot: string) => void;
  /** Callback xác nhận đặt lịch */
  onConfirm: () => void;
  /** Cờ trạng thái đang gửi request xác nhận */
  isSubmitting: boolean;
  /** Thông báo lỗi nếu có */
  error?: string;
  /** Cờ đánh dấu đã đặt thành công */
  success: boolean;
  /** Callback đóng modal quy trình đặt */
  onClose: () => void;
}

/**
 * Component hiển thị form giao diện các bước đặt lịch hẹn tư vấn.
 */
export function BookingFlow({
  mentor,
  service,
  slot,
  onSlotChange,
  onConfirm,
  isSubmitting,
  error,
  success,
  onClose,
}: BookingFlowProps) {
  if (success)
    return (
      <section className="figma-booking-success" aria-live="polite">
        <span className="figma-booking-success-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="m5 12 4.2 4.2L19 6.5" />
          </svg>
        </span>
        <h3>Booking confirmed</h3>
        <p>
          Your session with <strong>{mentor.name}</strong> has been confirmed.
        </p>
        <dl className="figma-booking-success-summary">
          <div>
            <dt>Service</dt>
            <dd>{service.name}</dd>
          </div>
          <div>
            <dt>Time</dt>
            <dd>{slotLabel(slot)}</dd>
          </div>
        </dl>
        <Button className="figma-booking-confirm" onClick={onClose}>
          Done
        </Button>
      </section>
    );

  return (
    <section
      className="figma-booking-flow"
      aria-label="Book a mentoring session"
    >
      <div className="figma-booking-mentor-summary">
        <span className="figma-booking-mentor-avatar">
          {initials(mentor.name)}
        </span>
        <div>
          <span>Booking with</span>
          <strong>{mentor.name}</strong>
          {mentor.headline && (
            <small>
              {mentor.headline}
              {mentor.organization && ` @ ${mentor.organization}`}
            </small>
          )}
        </div>
      </div>
      <article className="figma-booking-service-summary">
        <span className="figma-booking-service-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <rect x="5" y="4" width="14" height="16" rx="2" />
            <path d="M8 8h8M8 12h8M8 16h5" />
          </svg>
        </span>
        <div>
          <span>Selected service</span>
          <h3>{service.name}</h3>
          <p>{service.description}</p>
        </div>
        <div className="figma-booking-service-price">
          <strong>{priceLabel(service.priceScoins)}</strong>
          <small>S-coins</small>
          <em>{service.durationMinutes} min</em>
        </div>
      </article>
      <BookingCalendar value={slot} onSelect={onSlotChange} />
      <section className="figma-booking-summary" aria-label="Booking summary">
        <h3>Booking summary</h3>
        <dl>
          <div>
            <dt>Service</dt>
            <dd>{service.name}</dd>
          </div>
          <div>
            <dt>Duration</dt>
            <dd>{service.durationMinutes} min</dd>
          </div>
          <div>
            <dt>Date &amp; time</dt>
            <dd>{slotLabel(slot)}</dd>
          </div>
          <div>
            <dt>Total</dt>
            <dd>{priceLabel(service.priceScoins)} S-coins</dd>
          </div>
        </dl>
      </section>
      {error && (
        <p className="figma-booking-error" role="alert">
          {error}
        </p>
      )}
      <Button
        className="figma-booking-confirm"
        disabled={!slot || isSubmitting}
        onClick={onConfirm}
      >
        {isSubmitting ? "Confirming..." : `Book — ${service.name}`}
      </Button>
    </section>
  );
}
