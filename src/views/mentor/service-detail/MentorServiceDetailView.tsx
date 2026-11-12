/**
 * @file MentorServiceDetailView.tsx
 * @description Trang hiển thị và chỉnh sửa chi tiết dịch vụ thuộc sở hữu của Mentor hiện tại.
 */

'use client';

import { ServiceDescriptionDetail } from '@/components/domain/mentor-service/ServiceDescriptionDetail';
import { ServiceEditor } from '@/components/domain/mentor-service/ServiceEditor';
import { ServiceCouponPill } from '@/components/domain/mentor-service/coupons/ServiceCouponPill';
import { ServiceCouponPriceNote } from '@/components/domain/mentor-service/coupons/ServiceCouponPriceNote';
import { ServiceCouponsCard } from '@/components/domain/mentor-service/coupons/ServiceCouponsCard';
import {
  couponsForService,
  useMyMentorCoupons,
} from '@/components/domain/mentor-service/coupons/useMentorServiceCoupons';
import { parseServiceDescription } from '@/components/domain/mentor-service/serviceDescription';
import {
  serviceToEditorDefaults,
  type ServiceEditorPayload,
} from '@/components/domain/mentor-service/useServiceEditor';
import { Button } from '@/components/ui/Button';
import { ApiClientError } from '@/models/apiClient';
import type { MentorServiceManagementResponse } from '@/models/auth';
import { mentorServiceRepo } from '@/repositories/mentorServiceRepo';
import { showError, showSuccess } from '@/utils/toast';
import {
  ArrowLeft,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FileText,
  MessageCircle,
  Pencil,
  Target,
  UserRound,
  WalletCards,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

const formatScoin = (value: number | null) =>
  value === null ? '—' : `${new Intl.NumberFormat('vi-VN').format(value)} S-coins`;

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
  // Coupons from GET /api/me/coupons: empty while loading or when the request fails.
  const mentorCoupons = useMyMentorCoupons();
  const serviceCoupons =
    service && !service.isFree ? couponsForService(mentorCoupons, service) : [];
  /** Bumped to remount the editor with fresh data (after a reload or a cancel). */
  const [editorKey, setEditorKey] = useState(0);
  const editorDefaults = useMemo(
    () => (service ? serviceToEditorDefaults(service) : undefined),
    [service],
  );
  const parsedDescription = useMemo(
    () => parseServiceDescription(service?.description),
    [service?.description],
  );
  const displayedOutcome = service?.expectedOutcome?.trim() || parsedDescription.legacyOutcome;

  const loadService = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const detail = await mentorServiceRepo.getById(serviceId);
      setService(detail);
      setEditorKey((key) => key + 1);
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
    setEditorKey((key) => key + 1);
    setIsEditing(false);
  };

  const saveService = async (payload: ServiceEditorPayload) => {
    if (!service) return;
    setIsSaving(true);
    try {
      const updated = await mentorServiceRepo.update(service.serviceId, {
        title: payload.title,
        description: payload.description,
        expectedOutcome: payload.expectedOutcome,
        isFree: payload.isFree,
        priceScoin: payload.priceScoin,
        maintainPostSessionChat: payload.maintainPostSessionChat,
        expectedVersion: service.version,
        ...(payload.coverAssetId ? { coverAssetId: payload.coverAssetId } : {}),
        ...(payload.removeCoverImage ? { removeCoverImage: true } : {}),
      });
      setService(updated);
      setEditorKey((key) => key + 1);
      setIsEditing(false);
      showSuccess({
        title: 'Đã cập nhật dịch vụ',
        description: 'Thông tin dịch vụ đã được lưu.',
      });
    } catch (reason) {
      if (reason instanceof ApiClientError && reason.status === 409) {
        await loadService();
        showError('Dịch vụ đã thay đổi. Dữ liệu đã được tải lại, vui lòng thử lại.');
      } else {
        showError(reason, { title: 'Không thể cập nhật dịch vụ' });
      }
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
                      <ServiceCouponPill count={serviceCoupons.length} />
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

          <ServiceCouponsCard
            coupons={serviceCoupons}
            priceScoin={service.publicPriceScoin ?? 0}
            incomeNote={`Bạn vẫn nhận đủ ${formatScoin(service.publicPriceScoin)} mỗi buổi. SkillSwap chi trả phần giảm.`}
            footer={
              <Link
                href={`/${locale}/mentor/schedule-manage?coupons=how`}
                className="mt-3 inline-flex min-h-9 items-center text-sm font-semibold text-[#0077c8] underline underline-offset-2 focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Cơ chế hoạt động
              </Link>
            }
          />

          {isEditing && editorDefaults ? (
            <section
              className="mentor-service-detail-form-enter rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
              aria-labelledby="service-edit-heading"
            >
              <div className="mb-4 flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
                <div>
                  <h2 id="service-edit-heading" className="text-lg font-bold text-slate-900">
                    Chỉnh sửa dịch vụ
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Cập nhật nội dung mentee sẽ nhìn thấy khi xem dịch vụ.
                  </p>
                </div>
                <button
                  type="button"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-4 focus-visible:ring-primary/20"
                  aria-label="Hủy chỉnh sửa"
                  onClick={cancelEdit}
                  disabled={isSaving}
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
              <ServiceEditor
                key={editorKey}
                mode="edit"
                defaults={editorDefaults}
                priceNote={<ServiceCouponPriceNote count={serviceCoupons.length} />}
                isSaving={isSaving}
                submitLabel="Lưu thay đổi"
                onSubmit={(payload) => void saveService(payload)}
                onCancel={cancelEdit}
              />
            </section>
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
                  <ServiceDescriptionDetail
                    title={service.title}
                    coverImageUrl={service.coverImageUrl}
                    parsed={parsedDescription}
                  />
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
                      {displayedOutcome || '—'}
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
