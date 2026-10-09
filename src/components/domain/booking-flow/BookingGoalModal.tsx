/**
 * @file BookingGoalModal.tsx
 * @description Pop-up Modal cho phép Mentee điền Tiêu đề buổi học & Mô tả mong muốn trước khi xác nhận tạo Booking.
 * Tận dụng các lớp CSS utility và biến theme chuẩn trong globals.css.
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import type { MentorService } from '@/models/entities';
import { Clock, CreditCard, FileText, Sparkles, AlertCircle } from 'lucide-react';

interface BookingGoalModalProps {
  /** Trạng thái hiển thị modal */
  open: boolean;
  /** Callback đóng modal */
  onClose: () => void;
  /** Dịch vụ được chọn */
  service: MentorService;
  /** Chuỗi thời gian đã chọn hiển thị trên UI */
  slotTimeLabel: string;
  /** Tiêu đề buổi học (field learningGoalTitle) */
  learningGoalTitle: string;
  /** Callback cập nhật tiêu đề */
  onTitleChange: (val: string) => void;
  /** Mô tả mong muốn (field learningGoalDescription) */
  learningGoalDescription: string;
  /** Callback cập nhật mô tả */
  onDescriptionChange: (val: string) => void;
  /** Cờ trạng thái đang gửi request API */
  isSubmitting: boolean;
  /** Callback khi người dùng nhấn Xác nhận đặt lịch */
  onConfirm: () => void;
  /** Field error returned by the server for the title (shown under the input). */
  titleServerError?: string;
}

const TITLE_MAX_LENGTH = 200;
const DESCRIPTION_MAX_LENGTH = 2000;

function formatPrice(price?: number) {
  return price ? new Intl.NumberFormat('en-US').format(price) : '—';
}

export function BookingGoalModal({
  open,
  onClose,
  service,
  slotTimeLabel,
  learningGoalTitle,
  onTitleChange,
  learningGoalDescription,
  onDescriptionChange,
  isSubmitting,
  onConfirm,
  titleServerError,
}: BookingGoalModalProps) {
  const titleRef = useRef<HTMLInputElement>(null);
  const [titleError, setTitleError] = useState<string>();

  useEffect(() => {
    if (!open) setTitleError(undefined);
  }, [open]);

  useEffect(() => {
    if (open && titleServerError && !learningGoalTitle.trim()) {
      setTitleError(titleServerError);
      titleRef.current?.focus();
    }
    // Only when the modal opens or a new server error arrives, not on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, titleServerError]);

  const submit = () => {
    if (!learningGoalTitle.trim()) {
      setTitleError('Vui lòng nhập tiêu đề buổi học.');
      titleRef.current?.focus();
      return;
    }
    setTitleError(undefined);
    onConfirm();
  };

  return (
    <Modal
      open={open}
      title="Thông tin đặt lịch & Mục tiêu buổi học"
      onClose={onClose}
      className="booking-goal-popup-modal"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '10px 0 4px' }}>
        {/* Hộp tóm tắt thông tin buổi học dạng Card */}
        <div
          className="card"
          style={{
            background: 'var(--surface-subtle)',
            border: '1px solid var(--border-color)',
            borderRadius: '14px',
            padding: '18px 22px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '13px',
            }}
          >
            <span style={{ color: 'var(--text-muted)', fontWeight: '500' }}>Gói dịch vụ:</span>
            <strong style={{ color: 'var(--text-main)', fontSize: '14px', textAlign: 'right' }}>
              {service.name}
            </strong>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '13px',
            }}
          >
            <span
              style={{
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: '500',
              }}
            >
              <Clock className="w-4 h-4 text-[var(--primary)] flex-shrink-0" /> Khung giờ tư vấn:
            </span>
            <strong
              style={{
                color: 'var(--primary)',
                fontSize: '13.5px',
                fontWeight: '700',
                textAlign: 'right',
              }}
            >
              {slotTimeLabel}
            </strong>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '13px',
              borderTop: '1px dashed var(--border-color)',
              paddingTop: '10px',
            }}
          >
            <span
              style={{
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: '500',
              }}
            >
              <CreditCard className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0" /> Chi phí tư
              vấn:
            </span>
            <strong style={{ color: 'var(--text-main)', fontSize: '14px', textAlign: 'right' }}>
              {formatPrice(service.priceScoins)} S-coins
            </strong>
          </div>
        </div>

        {/* Form Field 1: Tiêu đề buổi học (learningGoalTitle) */}
        <div className="ui-form-field" style={{ gap: '8px' }}>
          <label
            htmlFor="booking-goal-title"
            className="ui-form-label"
            style={{
              fontWeight: '700',
              fontSize: '13px',
              color: 'var(--text-main)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            Tiêu đề buổi học
            <span className="font-bold text-danger" aria-hidden="true">
              *
            </span>
          </label>
          <input
            ref={titleRef}
            id="booking-goal-title"
            type="text"
            required
            aria-required="true"
            aria-invalid={Boolean(titleError)}
            aria-describedby="booking-goal-title-hint"
            maxLength={TITLE_MAX_LENGTH}
            className={`ui-input w-full focus:!ring-primary ${titleError ? '!border-danger focus:!border-danger' : '!border-gray-300 focus:!border-primary'}`}
            value={learningGoalTitle}
            onChange={(e) => {
              onTitleChange(e.target.value);
              if (titleError && e.target.value.trim()) setTitleError(undefined);
            }}
            placeholder="Review lộ trình học Spring Boot và chuẩn bị phỏng vấn intern"
            style={{ fontSize: '13px', padding: '0 16px', height: '44px', borderRadius: '10px' }}
          />
          <p
            id="booking-goal-title-hint"
            className={`ui-form-helper ${titleError ? 'font-medium text-danger' : ''}`}
            role={titleError ? 'alert' : undefined}
            style={{
              marginTop: '2px',
              fontSize: '11.5px',
              color: titleError ? undefined : 'var(--text-muted)',
            }}
          >
            {titleError || 'Nội dung chủ đề chính bạn mong muốn Mentor giải đáp'}
          </p>
        </div>

        {/* Form Field 2: Mô tả mong muốn (learningGoalDescription) */}
        <div className="ui-form-field" style={{ gap: '8px' }}>
          <label
            htmlFor="booking-goal-description"
            className="ui-form-label"
            style={{
              fontWeight: '700',
              fontSize: '13px',
              color: 'var(--text-main)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            Mô tả mong muốn
            <span className="text-xs font-medium text-text-muted">(không bắt buộc)</span>
          </label>
          <textarea
            id="booking-goal-description"
            maxLength={DESCRIPTION_MAX_LENGTH}
            rows={4}
            className="ui-textarea w-full !border-gray-300 focus:!border-primary focus:!ring-primary"
            value={learningGoalDescription}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Em muốn được góp ý CV backend, định hướng học PRJ301 và cách làm project REST API với PostgreSQL."
            style={{
              fontSize: '13px',
              padding: '12px 16px',
              lineHeight: '1.55',
              borderRadius: '10px',
            }}
          />
          <p
            className="ui-form-helper"
            style={{ marginTop: '2px', fontSize: '11.5px', color: 'var(--text-muted)' }}
          >
            Chi tiết các câu hỏi hoặc dự án cần góp ý
          </p>
        </div>

        {/* Thông báo nhắc nhở */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'var(--primary-light)',
            border: '1px solid var(--primary-border)',
            padding: '12px 16px',
            borderRadius: '12px',
            fontSize: '12.5px',
            color: '#0369a1',
            lineHeight: '1.4',
          }}
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-[var(--primary)]" />
          <span>
            Buổi tư vấn sẽ gửi yêu cầu tới Mentor để chờ phản hồi. Xin vui lòng theo dõi trạng thái
            booking trong mục Bookings của tôi
          </span>
        </div>

        {/* Nút thao tác */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              height: '44px',
              padding: '0 24px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '500',
            }}
          >
            Hủy
          </Button>
          <Button
            variant="primary"
            disabled={isSubmitting}
            onClick={submit}
            style={{
              height: '44px',
              padding: '0 28px',
              borderRadius: '12px',
              minWidth: '160px',
              fontSize: '14px',
              fontWeight: '600',
            }}
          >
            {isSubmitting ? 'Đang gửi...' : 'Xác nhận đặt lịch'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
