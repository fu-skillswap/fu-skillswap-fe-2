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
import { AlertTriangle, Plus, Calendar, RotateCcw } from 'lucide-react';
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
  onSubmitSkipDate: (templateId: string, occurrenceDate: string, expectedVersion: number) => Promise<void>;
  onSubmitRestoreDate: (templateId: string, occurrenceDate: string, expectedVersion: number) => Promise<void>;
}

export function AvailabilityTemplateDetailModal({
  open,
  template,
  isSubmittingException,
  onClose,
  onOpenEdit,
  onSubmitSkipDate,
  onSubmitRestoreDate,
}: AvailabilityTemplateDetailModalProps) {
  const [isSkipModalOpen, setIsSkipModalOpen] = useState(false);
  const [skipDate, setSkipDate] = useState('');
  const [skipError, setSkipError] = useState<string | null>(null);

  const [restoreConfirmDate, setRestoreConfirmDate] = useState<string | null>(null);

  if (!template) return null;

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
        onClose={onClose}
        className="mentor-availability-slot-modal"
      >
        <div className="space-y-4">
          {/* Header Version Info */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs text-slate-500">
            <span>Múi giờ: {template.timezone}</span>
            <span className="font-semibold text-slate-700">
              Config Version: {template.configVersion}
            </span>
          </div>

          {/* Core Configuration Details */}
          <div className="space-y-2.5 text-xs text-slate-700">
            <div>
              <span className="text-slate-500 font-medium">Ngày lặp: </span>
              <strong className="text-slate-900 font-bold">{formatWeekdays(template.weekdays)}</strong>
            </div>

            <div>
              <span className="text-slate-500 font-medium">Thời gian: </span>
              <strong className="text-sky-700 font-bold">
                {formatLocalTime(template.startTime)} – {formatLocalTime(template.endTime)}
              </strong>
            </div>

            <div>
              <span className="text-slate-500 font-medium">Dịch vụ áp dụng: </span>
              <span className="text-slate-900 font-semibold">
                {template.services.map((s) => s.title).join(', ') || 'Chưa gắn dịch vụ'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 font-medium">Thời gian áp dụng: </span>
              <span className="text-slate-900 font-medium">
                {formatDateVi(template.effectiveFrom)} →{' '}
                {template.effectiveTo ? formatDateVi(template.effectiveTo) : 'Không giới hạn'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 font-medium">Trạng thái cấu hình: </span>
              <span className="font-semibold text-slate-800">{template.configuredStatus}</span>
            </div>

            <div>
              <span className="text-slate-500 font-medium">Trạng thái thực tế: </span>
              <span className="font-bold text-sky-800">{template.effectiveStatus}</span>
            </div>

            {template.note?.trim() && (
              <div>
                <span className="text-slate-500 font-medium">Ghi chú: </span>
                <span className="text-slate-700 italic">{template.note}</span>
              </div>
            )}
          </div>

          {/* Warning: Generation Blocked Reason */}
          {template.generationBlockedReason && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 font-medium flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Lý do không thể tạo lịch tự động:</p>
                <p className="text-[11px] mt-0.5">{template.generationBlockedReason}</p>
              </div>
            </div>
          )}

          {/* SECTION 1: Ngày ngoại lệ (Skipped Dates) */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-sky-600" />
                <span>Ngày ngoại lệ</span>
              </h4>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={handleOpenSkipModal}
              >
                Bỏ qua một ngày
              </Button>
            </div>

            {!template.skippedDates || template.skippedDates.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-1">Chưa có ngày ngoại lệ.</p>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {template.skippedDates.map((dateStr) => (
                  <div
                    key={dateStr}
                    className="flex items-center justify-between gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800 font-mono">
                        {formatDateVi(dateStr)}
                      </span>
                      <Badge variant="info">Đã bỏ qua</Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<RotateCcw className="w-3 h-3 text-sky-600" />}
                      onClick={() => setRestoreConfirmDate(dateStr)}
                    >
                      Khôi phục
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 2: Không thể tạo lịch tự động (Blocked Occurrences) */}
          {template.blockedOccurrences && template.blockedOccurrences.length > 0 && (
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <h4 className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Không thể tạo lịch tự động ({template.blockedOccurrences.length})</span>
              </h4>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {template.blockedOccurrences.map((blocked, idx) => (
                  <div
                    key={idx}
                    className="flex items-start justify-between gap-2 p-2 bg-amber-50/60 border border-amber-200 rounded-lg text-xs"
                  >
                    <div className="space-y-0.5">
                      <span className="font-bold text-slate-900">{formatDateVi(blocked.date)}</span>
                      {blocked.reason && (
                        <p className="text-[11px] text-amber-800 font-medium">{blocked.reason}</p>
                      )}
                    </div>
                    <Badge variant="warning">Bị chặn</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="form-modal-footer pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Đóng
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                onClose();
                onOpenEdit(template);
              }}
            >
              Chỉnh sửa mẫu lịch
            </Button>
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
