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
        className="weekly-schedule-detail-modal"
      >
        <div className="weekly-schedule-detail-content">
          <header className="weekly-schedule-detail-header">
            <h2>Chi tiết lịch lặp hàng tuần</h2>
            <button
              type="button"
              className="weekly-schedule-detail-close"
              aria-label="Đóng"
              onClick={onClose}
            >
              <X aria-hidden="true" />
            </button>
          </header>

          <section className="weekly-schedule-detail-grid" aria-label="Thông tin lịch lặp">
            <div className="weekly-schedule-detail-item">
              <span className="weekly-schedule-detail-icon" aria-hidden="true">
                <Globe />
              </span>
              <div>
                <span className="weekly-schedule-detail-label">Múi giờ</span>
                <strong>{template.timezone}</strong>
              </div>
            </div>

            <div className="weekly-schedule-detail-item">
              <span className="weekly-schedule-detail-icon" aria-hidden="true">
                <Calendar />
              </span>
              <div>
                <span className="weekly-schedule-detail-label">Ngày lặp</span>
                <strong>{formatWeekdays(template.weekdays)}</strong>
              </div>
            </div>

            <div className="weekly-schedule-detail-item">
              <span className="weekly-schedule-detail-icon" aria-hidden="true">
                <Clock />
              </span>
              <div>
                <span className="weekly-schedule-detail-label">Thời gian</span>
                <strong>
                  {formatLocalTime(template.startTime)} – {formatLocalTime(template.endTime)}
                </strong>
              </div>
            </div>

            <div className="weekly-schedule-detail-item">
              <span className="weekly-schedule-detail-icon" aria-hidden="true">
                <FileText />
              </span>
              <div>
                <span className="weekly-schedule-detail-label">Dịch vụ áp dụng</span>
                <strong className="weekly-schedule-detail-services">
                  {template.services.map((service) => service.title).join(', ') ||
                    'Chưa gắn dịch vụ'}
                </strong>
              </div>
            </div>

            <div className="weekly-schedule-detail-item is-full-width">
              <span className="weekly-schedule-detail-icon" aria-hidden="true">
                <Calendar />
              </span>
              <div>
                <span className="weekly-schedule-detail-label">Thời gian áp dụng</span>
                <strong>
                  {formatDateVi(template.effectiveFrom)} →{' '}
                  {template.effectiveTo ? formatDateVi(template.effectiveTo) : 'Không giới hạn'}
                </strong>
              </div>
            </div>
          </section>

          {template.generationBlockedReason && (
            <div className="weekly-schedule-detail-warning">
              <AlertTriangle aria-hidden="true" />
              <div>
                <strong>Lý do không thể tạo lịch tự động:</strong>
                <p>{template.generationBlockedReason}</p>
              </div>
            </div>
          )}

          <section className="weekly-schedule-exception-section">
            <h3>
              <Calendar aria-hidden="true" />
              <span>Ngày ngoại lệ</span>
            </h3>
            <Button
              variant="outline"
              size="lg"
              leftIcon={<Plus aria-hidden="true" />}
              onClick={handleOpenSkipModal}
            >
              Bỏ qua một ngày
            </Button>

            {!template.skippedDates || template.skippedDates.length === 0 ? (
              <div className="weekly-schedule-exception-empty">
                <Calendar aria-hidden="true" />
                <span>Chưa có ngày ngoại lệ.</span>
              </div>
            ) : (
              <div className="weekly-schedule-exception-list">
                {template.skippedDates.map((dateStr) => (
                  <div key={dateStr} className="weekly-schedule-exception-row">
                    <div>
                      <strong>{formatDateVi(dateStr)}</strong>
                      <Badge variant="info">Đã bỏ qua</Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<RotateCcw aria-hidden="true" />}
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
            <section className="weekly-schedule-blocked-section">
              <h3>
                <AlertTriangle aria-hidden="true" />
                Không thể tạo lịch tự động ({template.blockedOccurrences.length})
              </h3>
              {template.blockedOccurrences.map((blocked) => (
                <div className="weekly-schedule-blocked-row" key={blocked.date}>
                  <div>
                    <strong>{formatDateVi(blocked.date)}</strong>
                    {blocked.reason && <p>{blocked.reason}</p>}
                  </div>
                  <Badge variant="warning">Bị chặn</Badge>
                </div>
              ))}
            </section>
          )}

          <footer className="weekly-schedule-detail-footer">
            <Button variant="secondary" size="lg" onClick={onClose}>
              Đóng
            </Button>

            {!isArchived && (
              <div className="weekly-schedule-detail-actions">
                <Button
                  variant="outline"
                  size="lg"
                  leftIcon={<Archive aria-hidden="true" />}
                  onClick={() => onArchive(template)}
                >
                  Lưu trữ
                </Button>
                {isPaused ? (
                  <Button variant="outline" size="lg" onClick={() => onResume(template)}>
                    Tiếp tục
                  </Button>
                ) : (
                  <Button variant="outline" size="lg" onClick={() => onPause(template)}>
                    Tạm dừng
                  </Button>
                )}
                <Button
                  size="lg"
                  onClick={() => {
                    onClose();
                    onOpenEdit(template);
                  }}
                >
                  Chỉnh sửa
                </Button>
              </div>
            )}
          </footer>
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
