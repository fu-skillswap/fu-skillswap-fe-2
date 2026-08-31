/**
 * @file MentorServiceDetailView.tsx
 * @description Trang hiển thị chi tiết dịch vụ thuộc sở hữu của Mentor hiện tại.
 */

'use client';

import { Button } from '@/components/ui/Button';
import type { MentorServiceManagementResponse } from '@/models/auth';
import {
  mentorServiceUpdateSchema,
  type MentorServiceUpdateFormValues,
} from '@/models/schemas/mentorServiceUpdateSchema';
import { mentorServiceRepo } from '@/repositories/mentorServiceRepo';
import { showError, showSuccess } from '@/utils/toast';
import { yupResolver } from '@hookform/resolvers/yup';
import { ArrowLeft, CircleDollarSign, Clock3, MessageCircle, Pencil, Save } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

const formatScoin = (value: number | null) =>
  value === null ? '—' : `${new Intl.NumberFormat('vi-VN').format(value)} S-coins`;

export function MentorServiceDetailView({
  locale,
  serviceId,
}: {
  locale: string;
  serviceId: string;
}) {
  const [service, setService] = useState<MentorServiceManagementResponse>();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const form = useForm<MentorServiceUpdateFormValues>({
    resolver: yupResolver(mentorServiceUpdateSchema),
  });
  const isFree = form.watch('isFree');

  const loadService = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const detail = await mentorServiceRepo.getById(serviceId);
      setService(detail);
      form.reset({
        title: detail.title,
        description: detail.description,
        expectedOutcome: detail.expectedOutcome,
        isFree: detail.isFree,
        priceScoin: detail.publicPriceScoin ?? 0,
        maintainPostSessionChat: detail.maintainPostSessionChat,
      });
    } catch (reason) {
      setHasError(true);
      showError(reason, { title: 'Không thể tải chi tiết dịch vụ' });
    } finally {
      setIsLoading(false);
    }
  }, [serviceId]);

  useEffect(() => {
    void loadService();
  }, [loadService]);

  const cancelEdit = () => {
    if (service) {
      form.reset({
        title: service.title,
        description: service.description,
        expectedOutcome: service.expectedOutcome,
        isFree: service.isFree,
        priceScoin: service.publicPriceScoin ?? 0,
        maintainPostSessionChat: service.maintainPostSessionChat,
      });
    }
    setIsEditing(false);
  };

  const saveService = async (values: MentorServiceUpdateFormValues) => {
    if (!service) {
      return;
    }

    setIsSaving(true);
    try {
      const updated = await mentorServiceRepo.update(service.serviceId, {
        ...values,
        priceScoin: values.isFree ? 0 : values.priceScoin,
        expectedVersion: service.version,
      });
      setService(updated);
      form.reset({
        title: updated.title,
        description: updated.description,
        expectedOutcome: updated.expectedOutcome,
        isFree: updated.isFree,
        priceScoin: updated.publicPriceScoin ?? 0,
        maintainPostSessionChat: updated.maintainPostSessionChat,
      });
      setIsEditing(false);
      showSuccess({
        title: 'Đã cập nhật dịch vụ',
        description: 'Thông tin dịch vụ đã được lưu.',
      });
    } catch (reason) {
      showError(reason, { title: 'Không thể cập nhật dịch vụ' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mentor-service-detail-page">
      <Link href={`/${locale}/mentor/schedule-manage`} className="mentor-service-detail-back">
        <ArrowLeft size={18} aria-hidden="true" /> Quay lại Dịch vụ & Lịch dạy
      </Link>

      {isLoading ? (
        <div className="mentor-service-detail-page-loading">
          <div className="mentor-spinner" />
          <p>Đang tải chi tiết dịch vụ...</p>
        </div>
      ) : hasError || !service ? (
        <div className="mentor-service-detail-page-empty">
          <h2>Chưa thể tải chi tiết dịch vụ</h2>
          <p>Vui lòng thử lại để xem thông tin mới nhất.</p>
          <Button type="button" onClick={() => void loadService()}>
            Thử lại
          </Button>
        </div>
      ) : (
        <article className="mentor-service-detail-page-card">
          <header className="mentor-service-detail-page-header">
            <div>
              <span className="mentor-service-detail-eyebrow">Dịch vụ tư vấn 1:1</span>
              <h1>{service.title}</h1>
              <span
                className={`mentor-service-detail-status ${service.isActive ? 'is-active' : 'is-inactive'}`}
              >
                {service.isActive ? 'Đang hoạt động' : 'Đang tạm dừng'}
              </span>
            </div>
            <div className="mentor-service-detail-page-actions">
              <Button
                type="button"
                className="mentor-service-detail-edit"
                onClick={() => setIsEditing(true)}
                disabled={isEditing}
              >
                <Pencil size={16} aria-hidden="true" /> Chỉnh sửa
              </Button>
            </div>
          </header>

          {isEditing ? (
            <form
              className="mentor-service-detail-form"
              onSubmit={form.handleSubmit(saveService)}
              noValidate
            >
              <div className="form-field-group">
                <label className="form-label" htmlFor="service-title">
                  Tên dịch vụ <span className="text-red-500">*</span>
                </label>
                <input id="service-title" className="form-input" {...form.register('title')} />
                {form.formState.errors.title && (
                  <span className="form-error-msg">{form.formState.errors.title.message}</span>
                )}
              </div>

              <div className="form-field-group">
                <label className="form-label" htmlFor="service-description">
                  Mô tả dịch vụ <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="service-description"
                  className="form-textarea"
                  rows={4}
                  {...form.register('description')}
                />
                {form.formState.errors.description && (
                  <span className="form-error-msg">
                    {form.formState.errors.description.message}
                  </span>
                )}
              </div>

              <div className="form-field-group">
                <label className="form-label" htmlFor="service-outcome">
                  Kết quả mong đợi <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="service-outcome"
                  className="form-textarea"
                  rows={3}
                  {...form.register('expectedOutcome')}
                />
                {form.formState.errors.expectedOutcome && (
                  <span className="form-error-msg">
                    {form.formState.errors.expectedOutcome.message}
                  </span>
                )}
              </div>

              <div className="form-grid-2">
                <div className="form-field-group">
                  <label className="form-label" htmlFor="service-price">
                    Giá công khai (S-coins)
                  </label>
                  <input
                    id="service-price"
                    type="number"
                    min="0"
                    disabled={isFree}
                    className="form-input"
                    {...form.register('priceScoin')}
                  />
                  {form.formState.errors.priceScoin && (
                    <span className="form-error-msg">
                      {form.formState.errors.priceScoin.message}
                    </span>
                  )}
                </div>
                <div className="mentor-service-detail-readonly-field">
                  <span>Thời lượng</span>
                  <strong>{service.durationMinutes} phút</strong>
                  <small>Thời lượng không thể đổi theo chính sách dịch vụ.</small>
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
                  <span>Duy trì chat trao đổi sau buổi học</span>
                </label>
              </div>

              <div className="mentor-service-detail-form-actions">
                <button type="button" className="btn-modal-cancel" onClick={cancelEdit}>
                  Hủy
                </button>
                <Button type="submit" className="btn-modal-submit" disabled={isSaving}>
                  <Save size={16} aria-hidden="true" /> {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Button>
              </div>
            </form>
          ) : (
            <>
              <section className="mentor-service-detail-page-section">
                <h2>Mô tả dịch vụ</h2>
                <p>{service.description || '—'}</p>
              </section>
              <section className="mentor-service-detail-page-section">
                <h2>Kết quả mong đợi</h2>
                <p>{service.expectedOutcome || '—'}</p>
              </section>

              <dl className="mentor-service-detail-grid">
                <div>
                  <dt>
                    <Clock3 size={16} aria-hidden="true" /> Thời lượng
                  </dt>
                  <dd>{service.durationMinutes} phút</dd>
                </div>
                <div>
                  <dt>
                    <MessageCircle size={16} aria-hidden="true" /> Chat sau buổi học
                  </dt>
                  <dd>{service.maintainPostSessionChat ? 'Duy trì' : 'Không duy trì'}</dd>
                </div>
                <div>
                  <dt>Hình thức</dt>
                  <dd>{service.deliveryMode === 'ONE_TO_ONE' ? 'Tư vấn 1:1' : '—'}</dd>
                </div>
                <div>
                  <dt>Loại dịch vụ</dt>
                  <dd>{service.isFree ? 'Miễn phí' : 'Có phí'}</dd>
                </div>
                <div>
                  <dt>
                    <CircleDollarSign size={16} aria-hidden="true" /> Giá công khai
                  </dt>
                  <dd>{formatScoin(service.publicPriceScoin)}</dd>
                </div>
                <div>
                  <dt>Giá cơ sở</dt>
                  <dd>{formatScoin(service.basePriceScoin)}</dd>
                </div>
                <div>
                  <dt>Thu nhập dự kiến</dt>
                  <dd>{formatScoin(service.estimatedMentorPayoutScoin)}</dd>
                </div>
              </dl>
            </>
          )}
        </article>
      )}
    </div>
  );
}
