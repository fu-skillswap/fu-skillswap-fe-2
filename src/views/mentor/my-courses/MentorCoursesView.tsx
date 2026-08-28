/**
 * @file MentorCoursesView.tsx
 * @description Màn hình Quản lý Khóa học & Dịch vụ tư vấn 1-1 dành cho Mentor.
 * Thiết kế giao diện cao cấp chuẩn Figma, sử dụng Lucide React icons.
 */

'use client';

import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import {
  mentorServiceSchema,
  type MentorServiceFormValues,
} from '@/models/schemas/mentorServiceSchema';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  BookOpen,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  MessageSquare,
  PauseCircle,
  PlayCircle,
  Plus,
  Sparkles,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMentorServices } from './useMentorServices';

const formatPrice = (isFree: boolean, priceScoin: number | null) => {
  if (isFree) return 'Miễn phí';
  return `${new Intl.NumberFormat('vi-VN').format(priceScoin ?? 0)} S-coin`;
};

export function MentorCoursesView() {
  const [openModal, setOpenModal] = useState(false);
  const { constraints, create, error, isLoading, isSaving, services, toggleActive } =
    useMentorServices();

  const form = useForm<MentorServiceFormValues>({
    resolver: yupResolver(mentorServiceSchema),
    defaultValues: {
      title: 'Review CV & Mock Interview Java',
      description: 'Hướng dẫn tối ưu CV và phỏng vấn thử 1-1 cho lập trình viên Java',
      expectedOutcome: 'Có checklist cải thiện CV chi tiết và định hướng lộ trình rõ ràng',
      durationMinutes: 60,
      isFree: false,
      priceScoin: 30000,
      maintainPostSessionChat: true,
    },
  });

  const isFreeWatched = form.watch('isFree');

  const onSubmitForm = async (values: MentorServiceFormValues) => {
    const success = await create({
      ...values,
      priceScoin: values.isFree ? 0 : values.priceScoin,
      deliveryMode: 'ONE_TO_ONE',
    });
    if (success) {
      form.reset();
      setOpenModal(false);
    }
  };

  const activeCount = services.filter((s) => s.isActive).length;

  return (
    <div className="mentor-courses-container">
      {/* Top Header */}
      <header className="mentor-courses-header">
        <div className="mentor-courses-header-text">
          <div className="mentor-courses-title-row">
            <h1>Khóa học của tôi</h1>
            <span className="mentor-courses-badge">{services.length} Khóa học</span>
          </div>
          <p>
            Quản lý các dịch vụ tư vấn 1:1, tùy chỉnh thời lượng, nội dung và mức phí S-coin của bạn.
          </p>
        </div>
        <button
          type="button"
          className="mentor-courses-create-btn"
          onClick={() => setOpenModal(true)}
        >
          <Plus className="w-5 h-5" />
          <span>Tạo khóa học mới</span>
        </button>
      </header>

      {/* Top Stat Metrics */}
      <div className="mentor-courses-stats-grid">
        <div className="mentor-courses-stat-card">
          <div className="mentor-stat-icon-wrapper bg-blue">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div className="mentor-stat-info">
            <strong className="mentor-stat-number">—</strong>
            <span className="mentor-stat-label">Tổng học viên đã tư vấn</span>
          </div>
        </div>

        <div className="mentor-courses-stat-card">
          <div className="mentor-stat-icon-wrapper bg-amber">
            <CircleDollarSign className="w-6 h-6 text-amber-600" />
          </div>
          <div className="mentor-stat-info">
            <strong className="mentor-stat-number">—</strong>
            <span className="mentor-stat-label">Tổng thu nhập S-coin</span>
          </div>
        </div>

        <div className="mentor-courses-stat-card">
          <div className="mentor-stat-icon-wrapper bg-indigo">
            <BookOpen className="w-6 h-6 text-indigo-600" />
          </div>
          <div className="mentor-stat-info">
            <strong className="mentor-stat-number">{services.length}</strong>
            <span className="mentor-stat-label">
              Khóa học ({activeCount} đang hoạt động)
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {error && (
        <div className="mentor-error-alert" role="alert">
          <p>{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="mentor-loading-box">
          <div className="mentor-spinner" />
          <p>Đang tải danh sách khóa học...</p>
        </div>
      ) : services.length > 0 ? (
        <div className="mentor-courses-grid-list">
          {services.map((service) => (
            <article className="mentor-course-card" key={service.serviceId}>
              <div className="mentor-course-card-top">
                <div className="mentor-course-type-icon">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <div className="mentor-course-header-content">
                  <div className="mentor-course-heading">
                    <h2>{service.title}</h2>
                    <span
                      className={`mentor-status-tag ${
                        service.isActive ? 'active' : 'inactive'
                      }`}
                    >
                      {service.isActive ? 'Đã đăng' : 'Tạm dừng'}
                    </span>
                  </div>
                  <p className="mentor-course-description">{service.description}</p>
                  {service.expectedOutcome && (
                    <div className="mentor-course-outcome">
                      <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      <span>{service.expectedOutcome}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mentor-course-card-meta-bar">
                <div className="mentor-meta-items">
                  <span className="mentor-meta-item">
                    <Clock3 className="w-4 h-4" />
                    {service.durationMinutes} phút
                  </span>
                  <span className="mentor-meta-item price-item">
                    <CircleDollarSign className="w-4 h-4 text-amber-500" />
                    <strong>{formatPrice(service.isFree, service.publicPriceScoin)}</strong>
                  </span>
                  {service.maintainPostSessionChat && (
                    <span className="mentor-meta-item chat-item">
                      <MessageSquare className="w-4 h-4 text-blue-500" />
                      Hỗ trợ chat sau buổi học
                    </span>
                  )}
                </div>

                <div className="mentor-course-card-actions">
                  <button
                    type="button"
                    className={`mentor-toggle-btn ${
                      service.isActive ? 'btn-pause' : 'btn-activate'
                    }`}
                    disabled={isSaving}
                    onClick={() => void toggleActive(service)}
                  >
                    {service.isActive ? (
                      <>
                        <PauseCircle className="w-4 h-4" />
                        <span>Tạm dừng</span>
                      </>
                    ) : (
                      <>
                        <PlayCircle className="w-4 h-4" />
                        <span>Kích hoạt</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mentor-empty-courses">
          <BookOpen className="w-12 h-12 text-slate-300" />
          <h3>Chưa có khóa học nào</h3>
          <p>Hãy tạo dịch vụ tư vấn 1:1 đầu tiên để mentee có thể tìm thấy và đăng ký với bạn.</p>
          <button
            type="button"
            className="mentor-courses-create-btn"
            onClick={() => setOpenModal(true)}
          >
            <Plus className="w-4 h-4" />
            <span>Tạo khóa học ngay</span>
          </button>
        </div>
      )}

      {/* Create Course Modal */}
      <Modal
        open={openModal}
        title="Tạo mới Khóa học / Dịch vụ tư vấn"
        onClose={() => setOpenModal(false)}
        className="mentor-service-modal-custom"
      >
        <form className="mentor-modal-form" onSubmit={form.handleSubmit(onSubmitForm)} noValidate>
          <div className="form-field-group">
            <label className="form-label" htmlFor="course-title">
              Tên khóa học / Dịch vụ <span className="text-red-500">*</span>
            </label>
            <input
              id="course-title"
              className="form-input"
              placeholder="VD: Phỏng vấn thử & Review CV Software Engineer"
              {...form.register('title')}
            />
            {form.formState.errors.title && (
              <span className="form-error-msg">{form.formState.errors.title.message}</span>
            )}
          </div>

          <div className="form-field-group">
            <label className="form-label" htmlFor="course-desc">
              Mô tả dịch vụ <span className="text-red-500">*</span>
            </label>
            <textarea
              id="course-desc"
              className="form-textarea"
              rows={3}
              placeholder="Mô tả nội dung các phần bạn sẽ làm việc trực tiếp với mentee..."
              {...form.register('description')}
            />
            {form.formState.errors.description && (
              <span className="form-error-msg">{form.formState.errors.description.message}</span>
            )}
          </div>

          <div className="form-field-group">
            <label className="form-label" htmlFor="course-outcome">
              Kết quả Mentee đạt được sau buổi học
            </label>
            <textarea
              id="course-outcome"
              className="form-textarea"
              rows={2}
              placeholder="VD: Định hướng rõ lộ trình học tập, checklist cải thiện CV..."
              {...form.register('expectedOutcome')}
            />
          </div>

          <div className="form-grid-2">
            <div className="form-field-group">
              <label className="form-label" htmlFor="course-duration">
                Thời lượng tư vấn <span className="text-red-500">*</span>
              </label>
              <select id="course-duration" className="form-select" {...form.register('durationMinutes')}>
                <option value="">Chọn thời lượng</option>
                {constraints?.allowedDurationMinutes.map((mins) => (
                  <option key={mins} value={mins}>
                    {mins} phút
                  </option>
                ))}
              </select>
              {form.formState.errors.durationMinutes && (
                <span className="form-error-msg">{form.formState.errors.durationMinutes.message}</span>
              )}
            </div>

            <div className="form-field-group">
              <label className="form-label" htmlFor="course-price">
                Học phí (S-coin)
              </label>
              <input
                id="course-price"
                type="number"
                disabled={isFreeWatched}
                className="form-input"
                placeholder="VD: 30000"
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

          <div className="form-checkbox-row">
            <label className="form-checkbox-label">
              <input
                type="checkbox"
                className="form-checkbox"
                {...form.register('maintainPostSessionChat')}
              />
              <span>Duy trì kênh chat trao đổi sau buổi học</span>
            </label>
          </div>

          <div className="form-modal-footer">
            <button
              type="button"
              className="btn-modal-cancel"
              onClick={() => setOpenModal(false)}
            >
              Hủy bỏ
            </button>
            <Button type="submit" disabled={isSaving} className="btn-modal-submit">
              {isSaving ? 'Đang tạo khóa học...' : 'Xác nhận tạo khóa học'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
