'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { BookingCalendar } from '@/components/domain/booking-calendar/BookingCalendar';
import { BookingGoalModal } from './BookingGoalModal';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import type { CandidateSegmentResponse, CreateBookingRequest } from '@/models/auth';
import type { Mentor, MentorService } from '@/models/entities';
import { mentorRepo } from '@/repositories/mentorRepo';
import { CheckCircle2, FileText, Calendar as CalendarIcon, Clock, Sparkles } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

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
function slotLabel(slot?: string, slotObj?: any) {
  if (slotObj?.startTime) {
    const d = new Date(slotObj.startTime);
    const startStr = d.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const endD = slotObj.endTime ? new Date(slotObj.endTime) : d;
    const endStr = endD.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const dateStr = d.toLocaleDateString('vi-VN', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    return `${startStr} - ${endStr}, ${dateStr}`;
  }
  if (!slot) return 'Chưa chọn khung giờ';
  try {
    const date = new Date(slot);
    if (isNaN(date.getTime())) return slot;
    return date.toLocaleString('vi-VN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return slot;
  }
}

/** Chuyển đổi mốc thời gian sang định dạng chuẩn ISO-8601 (bỏ ký tự Z ở cuối) cho Backend Spring Boot */
function formatIso8601(input?: string): string {
  if (!input) return new Date().toISOString().replace(/Z$/, '');
  try {
    const trimmed = input.trim();
    const hasOffset = /[+-]\d{2}:\d{2}$/.test(trimmed);
    const isoCandidate = trimmed.includes('Z') || hasOffset ? trimmed : `${trimmed}Z`;
    const d = new Date(isoCandidate);
    if (!isNaN(d.getTime())) {
      return d.toISOString().replace(/Z$/, '');
    }
  } catch {
    // fallback
  }
  return new Date().toISOString().replace(/Z$/, '');
}

function getCurrentWeekRange() {
  const current = new Date();
  const dayOfWeek = current.getDay();
  const monday = new Date(current);
  monday.setDate(current.getDate() + (dayOfWeek === 0 ? -6 : 1 - dayOfWeek));

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return { fromDate: formatDate(monday), toDate: formatDate(sunday) };
}

/** Props của BookingFlow Component */
interface BookingFlowProps {
  /** Thông tin Mentor được chọn */
  mentor: Mentor;
  /** Thông tin Dịch vụ tư vấn được chọn */
  service: MentorService;
  /** Mốc thời gian slot ISO đã chọn */
  slot?: string;
  /** Callback khi đổi slot khung giờ */
  onSlotChange: (slot: string, slotObject?: any) => void;
  /** Callback xác nhận đặt lịch */
  onConfirm: () => void;
  /** Callback xác nhận kèm payload tạo booking */
  onConfirmWithPayload?: (payload: CreateBookingRequest) => void;
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
  onConfirmWithPayload,
  isSubmitting,
  error,
  success,
  onClose,
}: BookingFlowProps) {
  const params = useParams();
  const locale = (params?.locale as string) || 'vi';
  const [candidateSegments, setCandidateSegments] = useState<CandidateSegmentResponse[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState<boolean>(true);
  const [selectedSlotObj, setSelectedSlotObj] = useState<any>(null);

  // Trạng thái bật/tắt Pop-up Modal xác nhận nhập tiêu đề & mô tả
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [learningGoalTitle, setLearningGoalTitle] = useState('');
  const [learningGoalDescription, setLearningGoalDescription] = useState('');

  // Hàm tải candidate segments của Mentor cho selected service
  const loadSlotsAndCandidates = useCallback(
    async (query?: { fromDate?: string; toDate?: string }) => {
      const mentorUserId = mentor.mentorUserId || mentor.id;
      if (!mentorUserId || !service?.id) return;

      setIsLoadingSlots(true);
      try {
        const candidates = await mentorRepo.getMentorCandidates(mentorUserId, service.id, query);
        setCandidateSegments(candidates);
      } catch {
        setCandidateSegments([]);
      } finally {
        setIsLoadingSlots(false);
      }
    },
    [mentor, service?.id],
  );

  useEffect(() => {
    loadSlotsAndCandidates(getCurrentWeekRange());
  }, [loadSlotsAndCandidates]);

  // Tự động refresh tải lại danh sách slot khi có lỗi (ví dụ slot bị trùng/người khác chọn mất)
  useEffect(() => {
    if (error) {
      void loadSlotsAndCandidates();
      onSlotChange('', null);
    }
  }, [error, loadSlotsAndCandidates, onSlotChange]);

  // Click nút Đặt lịch trên lịch -> Bật pop-up modal
  const handleOpenConfirmModal = () => {
    if (!slot) return;
    setIsConfirmModalOpen(true);
  };

  // Submit từ trong Pop-up Modal -> Gọi API POST /api/bookings
  const handleConfirmBookingSubmit = () => {
    if (!slot || !selectedSlotObj) {
      onConfirm();
      setIsConfirmModalOpen(false);
      return;
    }

    const rawStartAt = selectedSlotObj.startTime || selectedSlotObj.startAt || slot;
    const rawEndAt = selectedSlotObj.endTime || selectedSlotObj.endAt || slot;
    const slotId =
      selectedSlotObj.slotId || selectedSlotObj.segmentId || selectedSlotObj.candidateId || slot;

    const payload: CreateBookingRequest = {
      slotId,
      serviceId: service.id,
      startAt: formatIso8601(rawStartAt),
      learningGoalTitle:
        learningGoalTitle.trim() || 'Review lộ trình học Spring Boot và chuẩn bị phỏng vấn intern',
      learningGoalDescription:
        learningGoalDescription.trim() ||
        'Em muốn được góp ý CV backend, định hướng học PRJ301 và cách làm project REST API với PostgreSQL.',
    };

    if (onConfirmWithPayload) {
      onConfirmWithPayload(payload);
    } else {
      onConfirm();
    }
    setIsConfirmModalOpen(false);
  };

  if (success)
    return (
      <section className="figma-booking-success" aria-live="polite">
        <span className="figma-booking-success-icon" aria-hidden="true">
          <CheckCircle2 aria-hidden="true" />
        </span>
        <h2>Tạo yêu cầu đặt lịch thành công!</h2>
        <p>
          Yêu cầu đặt lịch của bạn đã được gửi ở trạng thái <strong>PENDING</strong>. Mentor sẽ phản
          hồi lại thông báo đặt lịch của bạn.
        </p>
        <div
          style={{
            display: 'flex',
            gap: '12px',
            marginTop: '20px',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Link
            href={`/${locale}/my-bookings`}
            className="ui-btn ui-btn-primary"
            onClick={onClose}
            style={{
              height: '44px',
              padding: '0 26px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '600',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            Xem Booking của tôi
          </Link>
          <Button
            variant="secondary"
            onClick={onClose}
            style={{
              height: '44px',
              padding: '0 24px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '500',
            }}
          >
            Đóng
          </Button>
        </div>
      </section>
    );

  return (
    <section className="figma-booking-flow" aria-label="Booking flow">
      {/* Tóm tắt thông tin Mentor */}
      <article className="figma-booking-mentor-summary">
        {mentor.avatarUrl ? (
          <img src={mentor.avatarUrl} alt={mentor.name} className="figma-booking-mentor-avatar" />
        ) : (
          <span className="figma-booking-mentor-avatar" aria-hidden="true">
            {initials(mentor.name)}
          </span>
        )}
        <div>
          <h2>{mentor.name}</h2>
          <p>{mentor.headline || mentor.organization || 'Mentor'}</p>
        </div>
      </article>

      {/* Lịch đặt dạng Google Calendar Tuần hiển thị Candidate Segments từ API GET /api/mentors/{mentorUserId}/availability-slots/{slotId}/candidates */}
      <BookingCalendar
        candidates={candidateSegments}
        selectedServiceId={service.id}
        selectedServiceName={service.name}
        value={slot}
        isLoading={isLoadingSlots}
        onRangeChange={(fromDate, toDate) => {
          loadSlotsAndCandidates({ fromDate, toDate });
        }}
        onSelectSlot={(candidateObj, slotTimeStr) => {
          setSelectedSlotObj(candidateObj);
          onSlotChange(
            candidateObj.segmentId ||
              candidateObj.candidateId ||
              candidateObj.slotId ||
              slotTimeStr,
            candidateObj,
          );
        }}
      />

      <section
        className="figma-booking-summary"
        aria-label="Booking summary"
        style={{ marginTop: '16px' }}
      >
        <h3>Tóm tắt lịch đặt</h3>
        <dl>
          <div>
            <dt>Dịch vụ</dt>
            <dd>{service.name}</dd>
          </div>
          <div>
            <dt>Thời lượng</dt>
            <dd>{service.durationMinutes} phút</dd>
          </div>
          <div>
            <dt>Thời gian</dt>
            <dd>{slotLabel(slot, selectedSlotObj)}</dd>
          </div>
          <div>
            <dt>Tổng cộng</dt>
            <dd>{priceLabel(service.priceScoins)} S-coins</dd>
          </div>
        </dl>
      </section>

      {error && (
        <p className="figma-booking-error" role="alert">
          {error}
        </p>
      )}

      {/* Nút bật Pop-up Modal xác nhận */}
      <Button
        className="figma-booking-confirm"
        disabled={!slot || isSubmitting}
        onClick={handleOpenConfirmModal}
      >
        {isSubmitting ? 'Đang xử lý...' : `Đặt lịch — ${service.name}`}
      </Button>

      {/* POP-UP MODAL RIÊNG BIỆT: Nhập Tiêu đề buổi học & Mô tả mong muốn */}
      <BookingGoalModal
        open={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        service={service}
        slotTimeLabel={slotLabel(slot, selectedSlotObj)}
        learningGoalTitle={learningGoalTitle}
        onTitleChange={setLearningGoalTitle}
        learningGoalDescription={learningGoalDescription}
        onDescriptionChange={setLearningGoalDescription}
        isSubmitting={isSubmitting}
        onConfirm={handleConfirmBookingSubmit}
      />
    </section>
  );
}
