/**
 * @file AvailabilityTemplateDetailModal.tsx
 * @description Detail Modal for Weekly Availability Template with Skip & Restore Exception flows, using SkillSwap UI primitives.
 */

'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { FormField } from '@/components/ui/FormField';
import { TextField } from '@/components/ui/TextField';
import {
  AlertTriangle,
  Archive,
  Calendar,
  Clock,
  FileText,
  Globe,
  Pause,
  Pencil,
  Play,
  Plus,
  RotateCcw,
  X,
} from 'lucide-react';
import type { AvailabilityTemplateResponse } from '@/models/auth';
import {
  formatDateVi,
  formatLocalTime,
  formatWeekdays,
  validateOccurrenceDateForTemplate,
} from './mentorTemplateHelpers';

interface AvailabilityTemplateDetailModalProps {
  open: boolean;
  template: AvailabilityTemplateResponse | null;
  isSubmittingException: boolean;
  onClose: () => void;
  onOpenEdit: (template: AvailabilityTemplateResponse) => void;
  onPause: (template: AvailabilityTemplateResponse) => void;
  onResume: (template: AvailabilityTemplateResponse) => void;
  onArchive: (template: AvailabilityTemplateResponse) => void;
  onSubmitSkipDate: (
    templateId: string,
    occurrenceDate: string,
    expectedVersion: number,
  ) => Promise<void>;
  onSubmitRestoreDate: (
    templateId: string,
    occurrenceDate: string,
    expectedVersion: number,
  ) => Promise<void>;
}

export function AvailabilityTemplateDetailModal({
  open,
  template,
  isSubmittingException,
  onClose,
  onOpenEdit,
  onPause,
  onResume,
  onArchive,
  onSubmitSkipDate,
  onSubmitRestoreDate,
}: AvailabilityTemplateDetailModalProps) {
  const [isSkipModalOpen, setIsSkipModalOpen] = useState(false);
  const [skipDate, setSkipDate] = useState('');
  const [skipError, setSkipError] = useState<string | null>(null);

  const [restoreConfirmDate, setRestoreConfirmDate] = useState<string | null>(null);

  if (!template) return null;

  const isPaused = template.configuredStatus === 'PAUSED' || template.effectiveStatus === 'PAUSED';
  const isArchived =
    template.configuredStatus === 'ARCHIVED' || template.effectiveStatus === 'ARCHIVED';

  const handleOpenSkipModal = () => {
    setSkipDate('');
    setSkipError(null);
    setIsSkipModalOpen(true);
  };

  const handleConfirmSkip = async () => {
    if (!template) return;
    const errorMsg = validateOccurrenceDateForTemplate(skipDate, template);
    if (errorMsg) {
      setSkipError(errorMsg);
      return;
    }

    setSkipError(null);
    try {
      await onSubmitSkipDate(template.templateId, skipDate, template.configVersion);
      setIsSkipModalOpen(false);
      setSkipDate('');
    } catch (err: any) {
      setSkipError(err.message || 'Không thể bỏ qua ngày đã chọn.');
    }
  };

  const handleConfirmRestore = async () => {
    if (!template || !restoreConfirmDate) return;
    try {
      await onSubmitRestoreDate(template.templateId, restoreConfirmDate, template.configVersion);
      setRestoreConfirmDate(null);
    } catch {
      // Error handled by parent
    }
  };

  return (
    <>
      <Modal
        open={open}
        title="Chi tiết lịch lặp hàng tuần"
        hideHeader
        onClose={onClose}
        className="max-w-2xl"
      >
        <div className="-m-4 sm:-m-6">
          <header className="flex items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/70 px-5 py-3.5">
            <div>
              <h2 className="text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl">
                Chi tiết lịch lặp hàng tuần
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Thông tin cấu hình và các ngày ngoại lệ của lịch.
              </p>
            </div>
            <button
              type="button"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 outline-none transition hover:bg-slate-200/70 hover:text-slate-800 focus-visible:ring-4 focus-visible:ring-[#119CF7]/20"
              aria-label="Đóng"
              onClick={onClose}
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </header>

          <div className="mx-auto max-h-[calc(90vh-74px)] w-full max-w-2xl overflow-y-auto px-5 py-4">
            <section
              className="grid grid-cols-1 gap-2.5 sm:grid-cols-2"
              aria-label="Thông tin lịch lặp"
            >
              <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-3">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-[#119CF7]"
                  aria-hidden="true"
                >
                  <Globe className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Múi giờ
                  </span>
                  <strong className="mt-1 block break-words text-sm text-slate-900">
                    {template.timezone}
                  </strong>
                </div>
              </div>

              <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-3">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-[#119CF7]"
                  aria-hidden="true"
                >
                  <Calendar className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Ngày lặp
                  </span>
                  <strong className="mt-1 block text-sm text-slate-900">
                    {formatWeekdays(template.weekdays)}
                  </strong>
                </div>
              </div>

              <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-3">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-[#119CF7]"
                  aria-hidden="true"
                >
                  <Clock className="h-5 w-5" />
                </span>
                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Thời gian
                  </span>
                  <strong className="mt-0.5 block text-sm text-slate-900">
                    {formatLocalTime(template.startTime)} – {formatLocalTime(template.endTime)}
                  </strong>
                </div>
              </div>

              <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-3">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-[#119CF7]"
                  aria-hidden="true"
                >
                  <FileText className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Dịch vụ áp dụng
                  </span>
                  <strong className="mt-1 block break-words text-sm leading-5 text-slate-900">
                    {template.services.map((service) => service.title).join(', ') ||
                      'Chưa gắn dịch vụ'}
                  </strong>
                </div>
              </div>

              <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-3 sm:col-span-2">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-[#119CF7]"
                  aria-hidden="true"
                >
                  <Calendar className="h-5 w-5" />
                </span>
                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Thời gian áp dụng
                  </span>
                  <strong className="mt-1 block text-sm text-slate-900">
                    {formatDateVi(template.effectiveFrom)}
                    <span className="mx-2 text-slate-300">→</span>
                    {template.effectiveTo
                      ? formatDateVi(template.effectiveTo)
                      : 'Không giới hạn ngày kết thúc'}
                  </strong>
                </div>
              </div>
            </section>

            {template.generationBlockedReason && (
              <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                <div>
                  <strong>Lý do không thể tạo lịch tự động</strong>
                  <p className="mt-1 leading-5">{template.generationBlockedReason}</p>
                </div>
              </div>
            )}

            <section className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                    <Calendar className="h-4 w-4 text-[#119CF7]" aria-hidden="true" />
                    Ngày ngoại lệ
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Những ngày lịch lặp sẽ tạm thời không được tạo.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-[#119CF7]/40 text-[#119CF7] hover:border-[#119CF7] hover:bg-sky-50"
                  leftIcon={<Plus className="h-4 w-4" aria-hidden="true" />}
                  onClick={handleOpenSkipModal}
                >
                  Bỏ qua một ngày
                </Button>
              </div>

              {!template.skippedDates || template.skippedDates.length === 0 ? (
                <div className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-3.5 text-sm text-slate-500">
                  <Calendar className="h-4 w-4 text-slate-400" aria-hidden="true" />
                  <span>Chưa có ngày ngoại lệ.</span>
                </div>
              ) : (
                <div className="mt-4 space-y-2">
                  {template.skippedDates.map((dateStr) => (
                    <div
                      key={dateStr}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3"
                    >
                      <div className="flex items-center gap-2">
                        <strong className="text-sm text-slate-900">{formatDateVi(dateStr)}</strong>
                        <Badge variant="info">Đã bỏ qua</Badge>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />}
                        onClick={() => setRestoreConfirmDate(dateStr)}
                      >
                        Khôi phục
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {template.blockedOccurrences && template.blockedOccurrences.length > 0 && (
              <section className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/60 p-4 sm:p-5">
                <h3 className="flex items-center gap-2 text-sm font-bold text-amber-900">
                  <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                  Không thể tạo lịch tự động ({template.blockedOccurrences.length})
                </h3>
                <div className="mt-3 space-y-2">
                  {template.blockedOccurrences.map((blocked) => (
                    <div
                      className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-amber-200 bg-white px-4 py-3"
                      key={blocked.date}
                    >
                      <div>
                        <strong className="text-sm text-slate-900">
                          {formatDateVi(blocked.date)}
                        </strong>
                        {blocked.reason && (
                          <p className="mt-1 text-xs text-slate-500">{blocked.reason}</p>
                        )}
                      </div>
                      <Badge variant="warning">Bị chặn</Badge>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {isArchived && (
              <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-xs leading-5 text-slate-600">
                Lịch này đã được lưu trữ nên không thể chỉnh sửa. Bạn có thể tạo một lịch lặp mới
                với khung giờ mong muốn.
              </p>
            )}

            <footer className="mt-4 flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <Button variant="secondary" className="h-10 sm:min-w-24" onClick={onClose}>
                Đóng
              </Button>

              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
                {!isArchived && (
                  <>
                    <Button
                      variant="outline"
                      className="h-10 border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                      leftIcon={<Archive className="h-4 w-4" aria-hidden="true" />}
                      onClick={() => onArchive(template)}
                    >
                      Lưu trữ
                    </Button>
                    <Button
                      variant="outline"
                      className="h-10 border-slate-300 text-slate-700 hover:border-[#119CF7] hover:bg-sky-50 hover:text-[#119CF7]"
                      leftIcon={
                        isPaused ? (
                          <Play className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <Pause className="h-4 w-4" aria-hidden="true" />
                        )
                      }
                      onClick={() => (isPaused ? onResume(template) : onPause(template))}
                    >
                      {isPaused ? 'Tiếp tục' : 'Tạm dừng'}
                    </Button>
                  </>
                )}
                <Button
                  className="h-10 border-[#119CF7] bg-[#119CF7] hover:bg-[#0789dc] disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 sm:min-w-28"
                  leftIcon={<Pencil className="h-4 w-4" aria-hidden="true" />}
                  disabled={isArchived}
                  title={
                    isArchived
                      ? 'Lịch đã lưu trữ không thể chỉnh sửa. Hãy tạo một lịch lặp mới.'
                      : undefined
                  }
                  onClick={() => {
                    onClose();
                    onOpenEdit(template);
                  }}
                >
                  Chỉnh sửa
                </Button>
              </div>
            </footer>
          </div>
        </div>
      </Modal>

      {/* SUB-MODAL 1: Bỏ qua một ngày */}
      <Modal
        open={isSkipModalOpen}
        title="Bỏ qua một ngày"
        onClose={() => !isSubmittingException && setIsSkipModalOpen(false)}
        className="mentor-availability-slot-modal"
      >
        <div className="space-y-4">
          <div className="p-3 bg-sky-50 border border-sky-100 rounded-xl text-xs space-y-1">
            <div className="font-bold text-sky-900">{formatWeekdays(template.weekdays)}</div>
            <div className="text-sky-700">
              {formatLocalTime(template.startTime)} – {formatLocalTime(template.endTime)}
            </div>
          </div>

          <FormField label="Ngày cần bỏ qua" required error={skipError ?? undefined}>
            <TextField
              type="date"
              value={skipDate}
              min={template.effectiveFrom}
              max={template.effectiveTo ?? undefined}
              onChange={(e) => {
                setSkipDate(e.target.value);
                setSkipError(null);
              }}
            />
          </FormField>

          <p className="text-xs text-slate-500 italic">
            Hệ thống sẽ không mở lịch rảnh từ mẫu này vào ngày đã chọn.
          </p>

          <div className="form-modal-footer pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSubmittingException}
              onClick={() => setIsSkipModalOpen(false)}
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              loading={isSubmittingException}
              onClick={handleConfirmSkip}
            >
              Bỏ qua ngày này
            </Button>
          </div>
        </div>
      </Modal>

      {/* SUB-MODAL 2: Khôi phục ngày đã chọn */}
      <Modal
        open={Boolean(restoreConfirmDate)}
        title="Khôi phục ngày này?"
        onClose={() => !isSubmittingException && setRestoreConfirmDate(null)}
        className="mentor-availability-slot-modal"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Backend sẽ có thể tiếp tục tạo lịch rảnh từ mẫu lịch này vào ngày{' '}
            <strong className="text-slate-900 font-bold">
              {formatDateVi(restoreConfirmDate ?? '')}
            </strong>
            .
          </p>

          <div className="form-modal-footer pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSubmittingException}
              onClick={() => setRestoreConfirmDate(null)}
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              loading={isSubmittingException}
              onClick={handleConfirmRestore}
            >
              Khôi phục
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
