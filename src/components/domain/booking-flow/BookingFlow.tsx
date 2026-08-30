'use client';

import { BookingCalendar } from '@/components/domain/booking-calendar/BookingCalendar';
import { Button } from '@/components/ui/Button';
import type { PublicAvailabilitySlotResponse } from '@/models/auth';
import type { Mentor, MentorService } from '@/models/entities';
import { mentorRepo } from '@/repositories/mentorRepo';
import { CheckCircle2, FileText } from 'lucide-react';
import { useEffect, useState } from 'react';

/** Tạo chữ cái viết tắt từ tên người dùng cho avatar */
function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('');
}

/** Định dạng hiển thị giá điểm S-Coins */
function priceLabel(price?: number) {
  return price ? new Intl.NumberFormat('en-US').format(price) : '—';
}

/** Định dạng hiển thị chuỗi ngày giờ từ slot ISO hoặc đối tượng slot */
function slotLabel(slot?: string, selectedSlotObj?: PublicAvailabilitySlotResponse | null) {
  if (selectedSlotObj && selectedSlotObj.startTime) {
    const startD = new Date(selectedSlotObj.startTime);
    const dateStr = `${String(startD.getDate()).padStart(2, '0')}/${String(startD.getMonth() + 1).padStart(2, '0')}/${startD.getFullYear()}`;
    const startH = String(startD.getHours()).padStart(2, '0');
    const startM = String(startD.getMinutes()).padStart(2, '0');
    let timeStr = `${startH}:${startM}`;
    if (selectedSlotObj.endTime) {
      const endD = new Date(selectedSlotObj.endTime);
      const endH = String(endD.getHours()).padStart(2, '0');
      const endM = String(endD.getMinutes()).padStart(2, '0');
      timeStr += ` – ${endH}:${endM}`;
    }
    return `${dateStr} · ${timeStr}`;
  }

  if (!slot) return 'Chưa chọn khung giờ';
  if (slot.includes('T') && !slot.includes('-')) {
    const [date, time] = slot.split('T');
    return `${date.split('-').reverse().join('/')} · ${time}`;
  }
  return slot;
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
  onSlotChange: (slot: string, slotObject?: PublicAvailabilitySlotResponse) => void;
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
  const [slots, setSlots] = useState<PublicAvailabilitySlotResponse[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState<boolean>(true);
  const [selectedSlotObj, setSelectedSlotObj] = useState<PublicAvailabilitySlotResponse | null>(
    null,
  );

  // Tải danh sách availability-slots công khai từ Backend API GET /api/mentors/{mentorUserId}/availability-slots
  useEffect(() => {
    let isMounted = true;
    const mentorUserId = mentor.mentorUserId || mentor.id;
    if (!mentorUserId) return;

    setIsLoadingSlots(true);
    mentorRepo
      .getAvailabilitySlots(mentorUserId)
      .then((data) => {
        if (isMounted) setSlots(data);
      })
      .catch(() => {
        if (isMounted) setSlots([]);
      })
      .finally(() => {
        if (isMounted) setIsLoadingSlots(false);
      });

    return () => {
      isMounted = false;
    };
  }, [mentor]);

  if (success)
    return (
      <section className="figma-booking-success" aria-live="polite">
        <span className="figma-booking-success-icon" aria-hidden="true">
          <CheckCircle2 aria-hidden="true" />
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
            <dd>{slotLabel(slot, selectedSlotObj)}</dd>
          </div>
        </dl>
        <Button className="figma-booking-confirm" onClick={onClose}>
          Done
        </Button>
      </section>
    );

  return (
    <section className="figma-booking-flow" aria-label="Book a mentoring session">
      <div className="figma-booking-mentor-summary">
        <span className="figma-booking-mentor-avatar">{initials(mentor.name)}</span>
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
          <FileText className="w-5 h-5 text-[var(--figma-blue)]" />
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

      {/* Lịch đặt dạng Google Calendar Tuần sử dụng dữ liệu từ GET /api/mentors/{mentorUserId}/availability-slots */}
      <BookingCalendar
        slots={slots}
        selectedServiceId={service.id}
        selectedServiceName={service.name}
        value={slot}
        isLoading={isLoadingSlots}
        onRangeChange={(fromDate, toDate) => {
          const mentorUserId = mentor.mentorUserId || mentor.id;
          if (!mentorUserId) return;
          setIsLoadingSlots(true);
          mentorRepo
            .getAvailabilitySlots(mentorUserId, { fromDate, toDate })
            .then(setSlots)
            .catch(() => setSlots([]))
            .finally(() => setIsLoadingSlots(false));
        }}
        onSelectSlot={(slotObj, slotTimeStr) => {
          setSelectedSlotObj(slotObj);
          onSlotChange(slotObj.slotId || slotTimeStr, slotObj);
        }}
      />

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
            <dd>{slotLabel(slot, selectedSlotObj)}</dd>
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
        {isSubmitting ? 'Confirming...' : `Book — ${service.name}`}
      </Button>
    </section>
  );
}
