/**
 * @file MentorServiceDetailView.tsx
 * @description Trang hiển thị và chỉnh sửa chi tiết dịch vụ thuộc sở hữu của Mentor hiện tại.
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
import {
  ArrowLeft,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FileText,
  MessageCircle,
  Pencil,
  Save,
  Target,
  UserRound,
  WalletCards,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';

const formatScoin = (value: number | null) =>
  value === null ? '—' : `${new Intl.NumberFormat('vi-VN').format(value)} S-coins`;

const fieldClassName =
  'mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-sky-300 focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500';

function ServiceFact({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50/80 p-2.5 transition hover:border-primary-border hover:bg-primary-light/40">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-primary shadow-xs">
        {icon}
      </span>
      <div className="min-w-0">
        <dt className="text-xs font-medium text-slate-500">{label}</dt>
        <dd className="mt-0.5 truncate text-sm font-semibold text-slate-900">{value}</dd>
      </div>
    </div>
  );
}

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

  const resetForm = useCallback(
    (detail: MentorServiceManagementResponse) => {
      form.reset({
        title: detail.title,
        description: detail.description,
        expectedOutcome: detail.expectedOutcome,
        isFree: detail.isFree,
        priceScoin: detail.publicPriceScoin ?? 0,
        maintainPostSessionChat: detail.maintainPostSessionChat,
      });
    },
    [form],
  );

  const loadService = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const detail = await mentorServiceRepo.getById(serviceId);
      setService(detail);
      resetForm(detail);
    } catch (reason) {
      setHasError(true);
      showError(reason, { title: 'Không thể tải chi tiết dịch vụ' });
    } finally {
      setIsLoading(false);
    }
  }, [resetForm, serviceId]);

  useEffect(() => {
    void loadService();
  }, [loadService]);

  const cancelEdit = () => {
    if (service) resetForm(service);
    setIsEditing(false);
  };

  const saveService = async (values: MentorServiceUpdateFormValues) => {
    if (!service) return;
    setIsSaving(true);
    try {
      const updated = await mentorServiceRepo.update(service.serviceId, {
        ...values,
        priceScoin: values.isFree ? 0 : values.priceScoin,
        expectedVersion: service.version,
      });
      setService(updated);
      resetForm(updated);
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
    <div className="mentor-service-detail-page mx-auto w-full max-w-6xl space-y-3 pb-4">
      <Link
        href={`/${locale}/mentor/schedule-manage`}
        className="mentor-service-detail-back group inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-slate-600 outline-none transition hover:text-primary focus-visible:ring-4 focus-visible:ring-primary/15"
      >
        <ArrowLeft
          className="h-4 w-4 transition-transform group-hover:-translate-x-1"
          aria-hidden="true"
        />
        Quay lại Dịch vụ &amp; Lịch dạy
      </Link>

      {isLoading ? (
        <div className="space-y-5" aria-label="Đang tải chi tiết dịch vụ" aria-busy="true">
          <div className="h-52 animate-pulse rounded-3xl border border-slate-200 bg-white" />
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="h-72 animate-pulse rounded-2xl border border-slate-200 bg-white" />
            <div className="h-72 animate-pulse rounded-2xl border border-slate-200 bg-white" />
          </div>
        </div>
      ) : hasError || !service ? (
        <div className="flex min-h-80 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white px-6 text-center shadow-xs">
          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
            <FileText className="h-7 w-7" aria-hidden="true" />
          </span>
          <h2 className="text-lg font-bold text-slate-900">Chưa thể tải chi tiết dịch vụ</h2>
          <p className="mt-1 max-w-md text-sm text-slate-500">
            Vui lòng thử lại để xem thông tin mới nhất.
          </p>
          <Button type="button" className="mt-5" onClick={() => void loadService()}>
            Thử lại
          </Button>
        </div>
      ) : (
        <>
          <article className="mentor-service-detail-hero overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-sm">
            <div className="relative bg-gradient-to-br from-sky-50 via-white to-indigo-50 px-5 py-4 sm:px-6 sm:py-5">
              <div
                className="absolute -right-12 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl"
                aria-hidden="true"
              />
              <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3.5">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-blue sm:h-14 sm:w-14">
                    <FileText className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-primary-light px-3 py-1 text-xs font-bold text-primary">
                        Dịch vụ tư vấn 1:1
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                          service.isActive
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${service.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}
                          aria-hidden="true"
                        />
                        {service.isActive ? 'Đang hoạt động' : 'Đang tạm dừng'}
                      </span>
                    </div>
                    <h1 className="text-xl font-extrabold tracking-tight text-slate-950 sm:text-2xl">
                      {service.title}
                    </h1>
                    <p className="mt-1 text-sm text-slate-600">
                      {service.durationMinutes} phút · Tư vấn cá nhân 1:1 ·{' '}
                      {service.isFree ? 'Miễn phí' : formatScoin(service.publicPriceScoin)}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  className="w-full sm:w-auto"
                  leftIcon={<Pencil className="h-4 w-4" />}
                  onClick={() => setIsEditing(true)}
                  disabled={isEditing}
                >
                  Chỉnh sửa dịch vụ
                </Button>
              </div>
            </div>
          </article>

          {isEditing ? (
            <form
              className="mentor-service-detail-form-enter rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
              onSubmit={form.handleSubmit(saveService)}
              noValidate
            >
              <div className="mb-3 flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Chỉnh sửa dịch vụ</h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Cập nhật nội dung mentee sẽ nhìn thấy khi xem dịch vụ.
                  </p>
                </div>
                <button
                  type="button"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Hủy chỉnh sửa"
                  onClick={cancelEdit}
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-semibold text-slate-700" htmlFor="service-title">
                    Tên dịch vụ <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="service-title"
                    className={fieldClassName}
                    {...form.register('title')}
                  />
                  {form.formState.errors.title && (
                    <span className="mt-1.5 block text-xs font-medium text-red-600" role="alert">
                      {form.formState.errors.title.message}
                    </span>
                  )}
                </div>

                <div className="grid gap-3 lg:grid-cols-2">
                  <div>
                    <label
                      className="text-sm font-semibold text-slate-700"
                      htmlFor="service-description"
                    >
                      Mô tả dịch vụ <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="service-description"
                      className={fieldClassName}
                      rows={3}
                      {...form.register('description')}
                    />
                    {form.formState.errors.description && (
                      <span className="mt-1.5 block text-xs font-medium text-red-600" role="alert">
                        {form.formState.errors.description.message}
                      </span>
                    )}
                  </div>
                  <div>
                    <label
                      className="text-sm font-semibold text-slate-700"
                      htmlFor="service-outcome"
                    >
                      Kết quả mong đợi <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="service-outcome"
                      className={fieldClassName}
                      rows={3}
                      {...form.register('expectedOutcome')}
                    />
                    {form.formState.errors.expectedOutcome && (
                      <span className="mt-1.5 block text-xs font-medium text-red-600" role="alert">
                        {form.formState.errors.expectedOutcome.message}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-semibold text-slate-700" htmlFor="service-price">
                      Giá công khai (S-coins)
                    </label>
                    <input
                      id="service-price"
                      type="number"
                      min="0"
                      disabled={isFree}
                      className={fieldClassName}
                      {...form.register('priceScoin')}
                    />
                    {form.formState.errors.priceScoin && (
                      <span className="mt-1.5 block text-xs font-medium text-red-600" role="alert">
                        {form.formState.errors.priceScoin.message}
                      </span>
                    )}
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5">
                    <span className="text-xs font-medium text-slate-500">Thời lượng cố định</span>
                    <strong className="mt-0.5 block text-sm text-slate-900">
                      {service.durationMinutes} phút
                    </strong>
                    <small className="mt-0.5 block text-xs leading-4 text-slate-500">
                      Thời lượng không thể đổi theo chính sách dịch vụ.
                    </small>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-slate-200 p-3 transition hover:border-primary-border hover:bg-primary-light/30">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 accent-primary"
                      {...form.register('isFree')}
                    />
                    <span>
                      <strong className="block text-sm text-slate-800">Dịch vụ miễn phí</strong>
                      <small className="mt-0.5 block text-xs text-slate-500">
                        Mentee không bị trừ S-coins.
                      </small>
                    </span>
                  </label>
                  <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-slate-200 p-3 transition hover:border-primary-border hover:bg-primary-light/30">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 accent-primary"
                      {...form.register('maintainPostSessionChat')}
                    />
                    <span>
                      <strong className="block text-sm text-slate-800">
                        Duy trì chat sau buổi học
                      </strong>
                      <small className="mt-0.5 block text-xs text-slate-500">
                        Cho phép tiếp tục trao đổi sau phiên.
                      </small>
                    </span>
                  </label>
                </div>
              </div>

              <div className="mt-4 flex flex-col-reverse gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" disabled={isSaving} onClick={cancelEdit}>
                  Hủy
                </Button>
                <Button type="submit" loading={isSaving} leftIcon={<Save className="h-4 w-4" />}>
                  Lưu thay đổi
                </Button>
              </div>
            </form>
          ) : (
            <div className="mentor-service-detail-layout grid items-start gap-3 lg:grid-cols-[minmax(0,1fr)_400px]">
              <div className="space-y-3">
                <section
                  className="mentor-service-detail-panel rounded-2xl border border-slate-200 bg-white p-4 shadow-xs"
                  aria-labelledby="service-description-heading"
                >
                  <div className="mb-2.5 flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-primary">
                      <FileText className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <h2
                      id="service-description-heading"
                      className="text-base font-bold text-slate-900"
                    >
                      Mô tả dịch vụ
                    </h2>
                  </div>
                  <p className="whitespace-pre-line text-sm leading-6 text-slate-600">
                    {service.description || '—'}
                  </p>
                </section>

                <section
                  className="mentor-service-detail-panel rounded-2xl border border-slate-200 bg-white p-4 shadow-xs"
                  aria-labelledby="service-outcome-heading"
                >
                  <div className="mb-2.5 flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                      <Target className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <h2 id="service-outcome-heading" className="text-base font-bold text-slate-900">
                      Kết quả mong đợi
                    </h2>
                  </div>
                  <div className="flex items-start gap-2.5 rounded-xl bg-emerald-50/60 p-3">
                    <CheckCircle2
                      className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"
                      aria-hidden="true"
                    />
                    <p className="whitespace-pre-line text-sm leading-6 text-slate-700">
                      {service.expectedOutcome || '—'}
                    </p>
                  </div>
                </section>
              </div>

              <aside className="mentor-service-detail-sidebar space-y-3 lg:sticky lg:top-20">
                <section
                  className="mentor-service-detail-panel rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  aria-labelledby="service-overview-heading"
                >
                  <h2 id="service-overview-heading" className="text-base font-bold text-slate-900">
                    Thông tin dịch vụ
                  </h2>
                  <dl className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <ServiceFact
                      icon={<Clock3 className="h-4.5 w-4.5" />}
                      label="Thời lượng"
                      value={`${service.durationMinutes} phút`}
                    />
                    <ServiceFact
                      icon={<MessageCircle className="h-4.5 w-4.5" />}
                      label="Chat sau buổi học"
                      value={service.maintainPostSessionChat ? 'Duy trì' : 'Không duy trì'}
                    />
                    <ServiceFact
                      icon={<UserRound className="h-4.5 w-4.5" />}
                      label="Hình thức"
                      value={service.deliveryMode === 'ONE_TO_ONE' ? 'Tư vấn 1:1' : '—'}
                    />
                    <ServiceFact
                      icon={<CircleDollarSign className="h-4.5 w-4.5" />}
                      label="Loại dịch vụ"
                      value={service.isFree ? 'Miễn phí' : 'Có phí'}
                    />
                  </dl>
                </section>

                <section
                  className="mentor-service-detail-panel overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                  aria-labelledby="service-pricing-heading"
                >
                  <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <WalletCards className="h-5 w-5 text-primary" aria-hidden="true" />
                      <h2
                        id="service-pricing-heading"
                        className="text-base font-bold text-slate-900"
                      >
                        Thông tin giá
                      </h2>
                    </div>
                  </div>
                  <dl className="divide-y divide-slate-100 px-4">
                    <div className="flex items-center justify-between gap-4 py-2.5">
                      <dt className="text-sm text-slate-500">Giá công khai</dt>
                      <dd className="text-sm font-bold text-primary">
                        {formatScoin(service.publicPriceScoin)}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-4 py-2.5">
                      <dt className="text-sm text-slate-500">Giá cơ sở</dt>
                      <dd className="text-sm font-semibold text-slate-800">
                        {formatScoin(service.basePriceScoin)}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-4 py-2.5">
                      <dt className="text-sm text-slate-500">Thu nhập dự kiến</dt>
                      <dd className="text-sm font-semibold text-emerald-600">
                        {formatScoin(service.estimatedMentorPayoutScoin)}
                      </dd>
                    </div>
                  </dl>
                </section>
              </aside>
            </div>
          )}
        </>
      )}
    </div>
  );
}
