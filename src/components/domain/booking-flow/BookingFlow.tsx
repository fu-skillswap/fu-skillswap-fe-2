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
      learningGoalTitle: learningGoalTitle.trim(),
      learningGoalDescription: learningGoalDescription.trim(),
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
      <section className="flex flex-col items-center text-center p-6 space-y-4" aria-live="polite">
        <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900 m-0">Tạo yêu cầu đặt lịch thành công!</h2>
        <p className="text-xs sm:text-sm text-slate-600 max-w-md m-0 leading-relaxed">
          Yêu cầu đặt lịch của bạn đã được gửi ở trạng thái <strong className="text-slate-900">PENDING</strong>. Mentor sẽ phản hồi lại thông báo đặt lịch của bạn.
        </p>
        <div className="flex items-center gap-3 pt-4">
          <Link
            href={`/${locale}/my-bookings`}
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-primary text-white font-bold text-xs sm:text-sm hover:bg-primary-hover shadow-sm transition-all decoration-0 inline-flex items-center justify-center"
          >
            Xem Booking của tôi
          </Link>
          <Button
            variant="secondary"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold"
          >
            Đóng
          </Button>
        </div>
      </section>
    );

  return (
    <div className="space-y-5 max-w-full overflow-x-hidden">
      {/* Tóm tắt thông tin Mentor */}
      <article className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl flex items-center gap-3.5">
        {mentor.avatarUrl ? (
          <img src={mentor.avatarUrl} alt={mentor.name} className="w-12 h-12 rounded-full object-cover border border-slate-200 shrink-0" />
        ) : (
          <span className="w-12 h-12 rounded-full bg-sky-100 text-sky-600 font-extrabold text-sm flex items-center justify-center shrink-0">
            {initials(mentor.name)}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold text-slate-900 m-0 leading-tight truncate">{mentor.name}</h2>
          <p className="text-xs text-slate-500 m-0 mt-0.5 truncate">{mentor.headline || mentor.organization || 'Mentor'}</p>
        </div>
      </article>

      {/* Lịch đặt dạng Google Calendar */}
      <div className="w-full overflow-x-auto">
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
      </div>

      {/* Tóm tắt lịch đặt */}
      <section className="bg-sky-50/60 border border-sky-100 p-4 sm:p-5 rounded-2xl space-y-3">
        <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 uppercase tracking-wider m-0">Tóm tắt lịch đặt</h3>
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs sm:text-sm m-0">
          <div>
            <dt className="text-slate-400 font-medium">Dịch vụ</dt>
            <dd className="font-bold text-slate-900 m-0 mt-0.5">{service.name}</dd>
          </div>
          <div>
            <dt className="text-slate-400 font-medium">Thời lượng</dt>
            <dd className="font-bold text-slate-900 m-0 mt-0.5">{service.durationMinutes} phút</dd>
          </div>
          <div>
            <dt className="text-slate-400 font-medium">Thời gian</dt>
            <dd className="font-bold text-sky-600 m-0 mt-0.5">{slotLabel(slot, selectedSlotObj)}</dd>
          </div>
          <div>
            <dt className="text-slate-400 font-medium">Tổng cộng</dt>
            <dd className="font-black text-slate-900 m-0 mt-0.5">{priceLabel(service.priceScoins)} S-coins</dd>
          </div>
        </dl>
      </section>

      {error && (
        <p className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs sm:text-sm font-medium m-0" role="alert">
          {error}
        </p>
      )}

      {/* Nút đặt lịch */}
      <Button
        className="w-full h-11 rounded-xl bg-[#0088cc] hover:bg-[#0077b5] text-white font-bold text-sm shadow-sm transition-all border-0"
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
    </div>
  );
}
