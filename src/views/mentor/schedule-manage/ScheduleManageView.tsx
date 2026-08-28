/**
 * @file ScheduleManageView.tsx
 * @description Màn hình Quản lý Dịch vụ & Lịch dạy dành riêng cho Mentor.
 * Tích hợp API Backend (`/api/me/mentor-services`) và thiết kế chuẩn 100% theo UI mẫu.
 */

'use client';

import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ApiClientError } from '@/models/apiClient';
import type { MentorServiceManagementResponse } from '@/models/auth';
import {
  mentorServiceSchema,
  type MentorServiceFormValues,
} from '@/models/schemas/mentorServiceSchema';
import { mentorServiceRepo } from '@/repositories/mentorServiceRepo';
import { showError } from '@/utils/toast';
import { yupResolver } from '@hookform/resolvers/yup';
import { BookOpen, CheckCircle2, Compass, FileText, Plus, Target, X } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

/** Danh sách các thứ trong tuần */
const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** Danh sách mốc thời gian từ 09:00 đến 17:00 */
const TIME_SLOTS = [
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
];

/** Helper chọn Icon phù hợp với tên dịch vụ */
function getServiceIcon(title: string) {
  const lower = title.toLowerCase();
  if (lower.includes('cv') || lower.includes('resume')) {
    return <FileText className="w-5 h-5 text-blue-600" />;
  }
  if (lower.includes('interview') || lower.includes('phỏng vấn')) {
    return <Target className="w-5 h-5 text-blue-600" />;
  }
  if (lower.includes('career') || lower.includes('định hướng') || lower.includes('strategy')) {
    return <Compass className="w-5 h-5 text-blue-600" />;
  }
  return <BookOpen className="w-5 h-5 text-blue-600" />;
}

function showServiceStatusSuccess(isActive: boolean) {
  toast.custom(
    (toastItem) => (
      <div className="mentor-service-status-toast" role="status">
        <span className="mentor-service-status-toast-icon" aria-hidden="true">
          <CheckCircle2 size={19} />
        </span>
        <p>{isActive ? 'Đã bật dịch vụ.' : 'Đã tắt dịch vụ.'}</p>
        <button
          type="button"
          onClick={() => toast.dismiss(toastItem.id)}
          aria-label="Đóng thông báo"
        >
          <X size={16} />
        </button>
      </div>
    ),
    { duration: 3500, position: 'top-right' },
  );
}

export function ScheduleManageView() {
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();
  const [services, setServices] = useState<MentorServiceManagementResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [pendingStatusChange, setPendingStatusChange] =
    useState<MentorServiceManagementResponse | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [constraints, setConstraints] = useState<{ allowedDurationMinutes: number[] }>();

  // TODO: Đồng bộ các khung giờ với API khi backend cung cấp endpoint lịch dạy của Mentor.
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(() => new Set());

  // Form tạo dịch vụ mới
  const form = useForm<MentorServiceFormValues>({
    resolver: yupResolver(mentorServiceSchema),
    defaultValues: {
      title: 'Review CV & Career Path',
      description: 'Tư vấn chỉnh sửa CV chuẩn ATS và định hướng phát triển sự nghiệp 1-1',
      expectedOutcome: 'Sở hữu bản CV ấn tượng và rõ định hướng nghề nghiệp',
      durationMinutes: 60,
      isFree: false,
      priceScoin: 150000,
      maintainPostSessionChat: true,
    },
  });

  const isFreeWatched = form.watch('isFree');

  // Fetch danh sách dịch vụ từ API backend
  const loadServices = async () => {
    try {
      setLoading(true);
      const [list, cons] = await Promise.all([
        mentorServiceRepo.list(),
        mentorServiceRepo.getConstraints(),
      ]);
      setServices(list);
      setConstraints(cons);
    } catch (reason) {
      showError(
        reason instanceof ApiClientError
          ? reason.message
          : 'Không thể tải danh sách dịch vụ. Vui lòng thử lại sau.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadServices();
  }, []);

  // Xử lý Bật/Tắt trạng thái kích hoạt Dịch vụ qua API
  const handleToggleService = async (service: MentorServiceManagementResponse) => {
    const newActiveState = !service.isActive;
    setTogglingId(service.serviceId);

    try {
      const updated = await mentorServiceRepo.setActive(service.serviceId, {
        isActive: newActiveState,
        expectedVersion: service.version,
        rejectPendingBookings: false,
      });
      setServices((prev) =>
        prev.map((item) => (item.serviceId === updated.serviceId ? updated : item)),
      );
      showServiceStatusSuccess(newActiveState);
    } catch (reason) {
      if (reason instanceof ApiClientError && reason.status === 409) {
        await loadServices();
        showError('Dịch vụ đã thay đổi. Danh sách đã được tải lại, vui lòng thử lại.');
      } else {
        showError(
          reason instanceof ApiClientError
            ? reason.message
            : 'Không thể cập nhật trạng thái dịch vụ. Vui lòng thử lại.',
        );
      }
    } finally {
      setTogglingId(null);
    }
  };

  const confirmStatusChange = () => {
    if (!pendingStatusChange) {
      return;
    }

    const service = pendingStatusChange;
    setPendingStatusChange(null);
    void handleToggleService(service);
  };

  // Xử lý Submit Tạo mới Dịch vụ qua API
  const onSubmitCreateService = async (values: MentorServiceFormValues) => {
    setIsSaving(true);
    try {
      await mentorServiceRepo.create({
        ...values,
        priceScoin: values.isFree ? 0 : values.priceScoin,
        deliveryMode: 'ONE_TO_ONE',
      });
      await loadServices();
      form.reset();
      setOpenModal(false);
    } catch (reason) {
      showError(
        reason instanceof ApiClientError
          ? reason.message
          : 'Không thể tạo dịch vụ. Vui lòng thử lại.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Xử lý click chọn/bỏ chọn ô thời khóa biểu
  const toggleSlot = (day: string, time: string) => {
    const slotKey = `${day}-${time}`;
    setSelectedSlots((prev) => {
      const next = new Set(prev);
      if (next.has(slotKey)) {
        next.delete(slotKey);
      } else {
        next.add(slotKey);
      }
      return next;
    });
  };

  return (
    <div className="schedule-page-wrapper">
      {/* SECTION 1: Dịch vụ của tôi */}
      <section className="schedule-section">
        <div className="schedule-section-header">
          <div>
            <h2 className="schedule-section-title">Dịch vụ của tôi</h2>
            <p className="schedule-section-subtitle">Bật/tắt dịch vụ và quản lý giá</p>
          </div>
          <button
            type="button"
            className="schedule-add-service-btn"
            onClick={() => setOpenModal(true)}
          >
            <Plus className="w-4 h-4" />
            <span>Thêm dịch vụ</span>
          </button>
        </div>

        {loading ? (
          <div className="schedule-loading-card">
            <div className="mentor-spinner" />
            <p>Đang tải danh sách dịch vụ...</p>
          </div>
        ) : (
          <div className="schedule-services-grid">
            {services.map((service) => {
              const isToggling = togglingId === service.serviceId;
              const priceText = service.isFree
                ? 'Miễn phí'
                : `${new Intl.NumberFormat('vi-VN').format(service.publicPriceScoin ?? 0)} S-coins`;

              return (
                <div
                  key={service.serviceId}
                  className={`schedule-service-card ${service.isActive ? 'card-active' : 'card-inactive'}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/${locale}/mentor/services/${service.serviceId}`)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      router.push(`/${locale}/mentor/services/${service.serviceId}`);
                    }
                  }}
                >
                  <div className="service-card-top">
                    <div className="service-icon-box">{getServiceIcon(service.title)}</div>
                    <div className="service-info-box">
                      <h3 className="service-card-title">{service.title}</h3>
                      <p className="service-card-meta">
                        {service.durationMinutes} min ·{' '}
                        {service.description?.includes('sessions')
                          ? (service.description.split('·')[1]?.trim() ?? '0 sessions')
                          : '0 sessions'}
                      </p>
                    </div>

                    {/* iOS Style Switch Button */}
                    <button
                      type="button"
                      disabled={isToggling}
                      className={`ios-toggle-switch ${service.isActive ? 'switch-on' : 'switch-off'}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        setPendingStatusChange(service);
                      }}
                      aria-label={`Toggle ${service.title}`}
                    >
                      <span className="ios-toggle-thumb" />
                    </button>
                  </div>

                  <div className="service-card-bottom">
                    <span className="service-price-text">{priceText}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* SECTION 2: Lịch dạy của tôi (Weekly Timetable Grid) */}
      <section className="schedule-section margin-top-32">
        <div className="schedule-section-header-simple">
          <h2 className="schedule-section-title">Lịch dạy của tôi</h2>
          <p className="schedule-section-subtitle">
            Nhấn vào ô để bật/tắt lịch rảnh. Màu xanh = có thể đặt lịch.
          </p>
        </div>

        <div className="timetable-card">
          <div className="timetable-grid">
            {/* Header row: Days of Week */}
            <div className="timetable-header-cell empty-corner" />
            {DAYS_OF_WEEK.map((day) => (
              <div key={day} className="timetable-header-cell">
                {day}
              </div>
            ))}

            {/* Matrix Time Slots Rows */}
            {TIME_SLOTS.map((time) => (
              <div key={time} className="timetable-row-group">
                <div className="timetable-time-label">{time}</div>
                {DAYS_OF_WEEK.map((day) => {
                  const slotKey = `${day}-${time}`;
                  const isSelected = selectedSlots.has(slotKey);

                  return (
                    <button
                      key={slotKey}
                      type="button"
                      className={`timetable-slot-cell ${isSelected ? 'cell-selected' : 'cell-unselected'}`}
                      onClick={() => toggleSlot(day, time)}
                      aria-label={`${day} ${time} - ${isSelected ? 'Có sẵn' : 'Đã chặn'}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          {/* Bottom Legend */}
          <div className="timetable-legend">
            <div className="legend-item">
              <span className="legend-box box-available" />
              <span>Có sẵn</span>
            </div>
            <div className="legend-item">
              <span className="legend-box box-blocked" />
              <span>Đã chặn</span>
            </div>
          </div>
        </div>
      </section>

      {/* Modal "+ Thêm dịch vụ" */}
      <Modal
        open={pendingStatusChange !== null}
        title={pendingStatusChange?.isActive ? 'Tắt dịch vụ' : 'Bật dịch vụ'}
        onClose={() => setPendingStatusChange(null)}
        className="mentor-service-status-modal"
      >
        {pendingStatusChange && (
          <div className="mentor-service-status-modal-content">
            <p>
              {pendingStatusChange.isActive
                ? `Bạn có muốn tắt dịch vụ “${pendingStatusChange.title}” không?`
                : `Bạn có muốn bật dịch vụ “${pendingStatusChange.title}” không?`}
            </p>
            <div className="form-modal-footer">
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => setPendingStatusChange(null)}
              >
                Hủy
              </button>
              <Button type="button" className="btn-modal-submit" onClick={confirmStatusChange}>
                {pendingStatusChange.isActive ? 'Tắt dịch vụ' : 'Bật dịch vụ'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={openModal}
        title="Tạo mới Khóa học / Dịch vụ tư vấn"
        onClose={() => setOpenModal(false)}
        className="mentor-service-modal-custom"
      >
        <form
          className="mentor-modal-form"
          onSubmit={form.handleSubmit(onSubmitCreateService)}
          noValidate
        >
          <div className="form-field-group">
            <label className="form-label" htmlFor="new-service-title">
              Tên dịch vụ / Khóa học <span className="text-red-500">*</span>
            </label>
            <input
              id="new-service-title"
              className="form-input"
              placeholder="VD: CV Review & Career Strategy"
              {...form.register('title')}
            />
            {form.formState.errors.title && (
              <span className="form-error-msg">{form.formState.errors.title.message}</span>
            )}
          </div>

          <div className="form-field-group">
            <label className="form-label" htmlFor="new-service-desc">
              Mô tả dịch vụ <span className="text-red-500">*</span>
            </label>
            <textarea
              id="new-service-desc"
              className="form-textarea"
              rows={3}
              placeholder="Mô tả nội dung các phần bạn sẽ tư vấn trực tiếp cho mentee..."
              {...form.register('description')}
            />
            {form.formState.errors.description && (
              <span className="form-error-msg">{form.formState.errors.description.message}</span>
            )}
          </div>

          <div className="form-grid-2">
            <div className="form-field-group">
              <label className="form-label" htmlFor="new-service-duration">
                Thời lượng tư vấn <span className="text-red-500">*</span>
              </label>
              <select
                id="new-service-duration"
                className="form-select"
                {...form.register('durationMinutes')}
              >
                <option value="">Chọn thời lượng</option>
                {(constraints?.allowedDurationMinutes ?? []).map((mins) => (
                  <option key={mins} value={mins}>
                    {mins} phút
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field-group">
              <label className="form-label" htmlFor="new-service-price">
                Học phí (S-coins)
              </label>
              <input
                id="new-service-price"
                type="number"
                disabled={isFreeWatched}
                className="form-input"
                placeholder="VD: 150000"
                {...form.register('priceScoin')}
              />
            </div>
          </div>

          <div className="form-checkbox-row">
            <label className="form-checkbox-label">
              <input type="checkbox" className="form-checkbox" {...form.register('isFree')} />
              <span>Miễn phí dịch vụ này cho mentee</span>
            </label>
          </div>

          <div className="form-modal-footer">
            <button type="button" className="btn-modal-cancel" onClick={() => setOpenModal(false)}>
              Hủy bỏ
            </button>
            <Button type="submit" disabled={isSaving} className="btn-modal-submit">
              {isSaving ? 'Đang tạo...' : 'Xác nhận tạo dịch vụ'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
