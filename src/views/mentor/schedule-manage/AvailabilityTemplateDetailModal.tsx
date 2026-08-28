/**
 * @file AvailabilityTemplateDetailModal.tsx
 * @description Detail Modal for Weekly Availability Template showing full configuration, skipped dates, and blocked occurrences.
 */

'use client';

import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, Calendar, Clock, CheckCircle2, PauseCircle, Archive } from 'lucide-react';
import type { AvailabilityTemplateResponse } from '@/models/auth';
import {
  formatDateVi,
  formatLocalTime,
  formatWeekdays,
} from './mentorTemplateHelpers';

interface AvailabilityTemplateDetailModalProps {
  open: boolean;
  template: AvailabilityTemplateResponse | null;
  onClose: () => void;
  onOpenEdit: (template: AvailabilityTemplateResponse) => void;
}

export function AvailabilityTemplateDetailModal({
  open,
  template,
  onClose,
  onOpenEdit,
}: AvailabilityTemplateDetailModalProps) {
  if (!template) return null;

  return (
    <Modal
      open={open}
      title="Chi tiết lịch lặp hàng tuần"
      onClose={onClose}
      className="mentor-availability-slot-modal"
    >
      <div className="space-y-4">
        {/* Header Badges */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <span className="text-xs text-gray-500">Múi giờ: {template.timezone}</span>
          <span className="text-xs font-medium text-gray-500">
            Config Version: {template.configVersion}
          </span>
        </div>

        {/* Content Details */}
        <div className="space-y-2.5 text-sm">
          <div>
            <span className="text-gray-500 font-medium">Ngày lặp: </span>
            <strong className="text-gray-900">{formatWeekdays(template.weekdays)}</strong>
          </div>

          <div>
            <span className="text-gray-500 font-medium">Thời gian: </span>
            <strong className="text-sky-700 font-bold">
              {formatLocalTime(template.startTime)} – {formatLocalTime(template.endTime)}
            </strong>
          </div>

          <div>
            <span className="text-gray-500 font-medium">Dịch vụ áp dụng: </span>
            <span className="text-gray-900 font-semibold">
              {template.services.map((s) => s.title).join(', ') || 'Chưa gắn dịch vụ'}
            </span>
          </div>

          <div>
            <span className="text-gray-500 font-medium">Thời gian áp dụng: </span>
            <span className="text-gray-900 font-medium">
              {formatDateVi(template.effectiveFrom)} →{' '}
              {template.effectiveTo ? formatDateVi(template.effectiveTo) : 'Không giới hạn'}
            </span>
          </div>

          <div>
            <span className="text-gray-500 font-medium">Trạng thái cấu hình: </span>
            <span className="font-semibold text-gray-800">{template.configuredStatus}</span>
          </div>

          <div>
            <span className="text-gray-500 font-medium">Trạng thái thực tế: </span>
            <span className="font-bold text-sky-800">{template.effectiveStatus}</span>
          </div>

          <div>
            <span className="text-gray-500 font-medium">Ghi chú: </span>
            <span className="text-gray-700 italic">
              {template.note?.trim() ? template.note : 'Không có ghi chú'}
            </span>
          </div>
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

        {/* Skipped Dates Section (Read-only) */}
        {template.skippedDates && template.skippedDates.length > 0 && (
          <div className="pt-2 border-t border-gray-100 space-y-1.5">
            <h4 className="text-xs font-bold text-gray-800 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-gray-500" />
              <span>Các ngày đã bỏ qua ({template.skippedDates.length}):</span>
            </h4>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-gray-50 rounded-lg border border-gray-200">
              {template.skippedDates.map((date) => (
                <span key={date} className="px-2 py-0.5 bg-white border border-gray-200 rounded text-[11px] text-gray-700 font-mono">
                  {formatDateVi(date)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Blocked Occurrences Section (Read-only) */}
        {template.blockedOccurrences && template.blockedOccurrences.length > 0 && (
          <div className="pt-2 border-t border-gray-100 space-y-1.5">
            <h4 className="text-xs font-bold text-amber-800 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>Không thể tạo lịch tự động ({template.blockedOccurrences.length}):</span>
            </h4>
            <div className="space-y-1 max-h-32 overflow-y-auto p-2 bg-amber-50/50 rounded-lg border border-amber-200 text-[11px]">
              {template.blockedOccurrences.map((b, idx) => (
                <div key={idx} className="flex flex-col border-b border-amber-100 pb-1 last:border-b-0 last:pb-0">
                  <span className="font-semibold text-gray-900">{formatDateVi(b.date)}</span>
                  {b.reason && <span className="text-amber-800">{b.reason}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal Footer Actions */}
        <div className="form-modal-footer pt-3 border-t border-gray-200 flex justify-end gap-2">
          <button type="button" className="btn-modal-cancel" onClick={onClose}>
            Đóng
          </button>
          <Button
            type="button"
            className="btn-modal-submit bg-sky-600 hover:bg-sky-700 text-white"
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
  );
}
