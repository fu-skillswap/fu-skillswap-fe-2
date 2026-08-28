/**
 * @file AvailabilityTemplateFormModal.tsx
 * @description Modal form for creating and updating Weekly Availability Templates using SkillSwap UI Foundation primitives.
 */

'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { TextField } from '@/components/ui/TextField';
import { TextArea } from '@/components/ui/TextArea';
import { ToggleGroup } from '@/components/ui/ToggleGroup';
import { RadioGroup } from '@/components/ui/RadioGroup';
import { SelectableRow } from '@/components/ui/SelectableRow';
import type {
  AvailabilityTemplateResponse,
  CreateAvailabilityTemplateRequest,
  MentorServiceManagementResponse,
  UpdateAvailabilityTemplateRequest,
  WeekdayEnum,
} from '@/models/auth';
import {
  ALL_WEEKDAYS,
  WEEKDAY_SHORT_LABELS,
  formatLocalTime,
  parseLocalTimeToObject,
} from './mentorTemplateHelpers';

interface AvailabilityTemplateFormModalProps {
  open: boolean;
  template: AvailabilityTemplateResponse | null;
  activeServices: MentorServiceManagementResponse[];
  isSubmitting: boolean;
  staleNotice: string | null;
  onClose: () => void;
  onSubmitCreate: (data: CreateAvailabilityTemplateRequest) => Promise<void>;
  onSubmitUpdate: (
    templateId: string,
    data: UpdateAvailabilityTemplateRequest,
  ) => Promise<void>;
}

export function AvailabilityTemplateFormModal({
  open,
  template,
  activeServices,
  isSubmitting,
  staleNotice,
  onClose,
  onSubmitCreate,
  onSubmitUpdate,
}: AvailabilityTemplateFormModalProps) {
  const isEdit = Boolean(template);

  const [selectedWeekdays, setSelectedWeekdays] = useState<WeekdayEnum[]>(['MONDAY']);
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('12:00');
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [effectiveFrom, setEffectiveFrom] = useState<string>('');
  const [effectiveType, setEffectiveType] = useState<'UNLIMITED' | 'UNTIL_DATE'>('UNLIMITED');
  const [effectiveTo, setEffectiveTo] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (template) {
      setSelectedWeekdays(template.weekdays || []);
      setStartTime(formatLocalTime(template.startTime));
      setEndTime(formatLocalTime(template.endTime));
      setSelectedServiceIds((template.services || []).map((s) => s.serviceId));
      setEffectiveFrom(template.effectiveFrom || '');
      if (template.effectiveTo) {
        setEffectiveType('UNTIL_DATE');
        setEffectiveTo(template.effectiveTo);
      } else {
        setEffectiveType('UNLIMITED');
        setEffectiveTo('');
      }
      setNote(template.note || '');
    } else {
      setSelectedWeekdays(['MONDAY']);
      setStartTime('09:00');
      setEndTime('12:00');
      setSelectedServiceIds(activeServices.length > 0 ? [activeServices[0].serviceId] : []);
      const today = new Date().toISOString().split('T')[0];
      setEffectiveFrom(today);
      setEffectiveType('UNLIMITED');
      setEffectiveTo('');
      setNote('');
    }
    setErrors({});
  }, [template, open, activeServices]);

  const toggleService = (serviceId: string) => {
    if (selectedServiceIds.includes(serviceId)) {
      if (selectedServiceIds.length > 1) {
        setSelectedServiceIds(selectedServiceIds.filter((id) => id !== serviceId));
      }
    } else {
      setSelectedServiceIds([...selectedServiceIds, serviceId]);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (selectedWeekdays.length === 0) {
      newErrors.weekdays = 'Vui lòng chọn ít nhất 1 ngày trong tuần.';
    }
    if (!startTime) {
      newErrors.startTime = 'Vui lòng chọn giờ bắt đầu.';
    }
    if (!endTime) {
      newErrors.endTime = 'Vui lòng chọn giờ kết thúc.';
    }
    if (startTime && endTime && startTime >= endTime) {
      newErrors.endTime = 'Giờ kết thúc phải lớn hơn giờ bắt đầu.';
    }
    if (selectedServiceIds.length === 0) {
      newErrors.services = 'Vui lòng chọn ít nhất 1 dịch vụ áp dụng.';
    }
    if (!effectiveFrom) {
      newErrors.effectiveFrom = 'Vui lòng chọn ngày bắt đầu áp dụng.';
    }
    if (effectiveType === 'UNTIL_DATE') {
      if (!effectiveTo) {
        newErrors.effectiveTo = 'Vui lòng chọn ngày kết thúc.';
      } else if (effectiveFrom && effectiveTo < effectiveFrom) {
        newErrors.effectiveTo = 'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.';
      }
    }
    if (note && note.length > 200) {
      newErrors.note = 'Ghi chú tối đa 200 ký tự.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || isSubmitting) return;

    const formattedStartTime = parseLocalTimeToObject(startTime);
    const formattedEndTime = parseLocalTimeToObject(endTime);

    if (isEdit && template) {
      const payload: UpdateAvailabilityTemplateRequest = {
        startTime: formattedStartTime,
        endTime: formattedEndTime,
        weekdays: selectedWeekdays,
        effectiveFrom,
        effectiveTo: effectiveType === 'UNTIL_DATE' ? effectiveTo : null,
        serviceIds: selectedServiceIds,
        note: note.trim() || undefined,
        expectedVersion: template.configVersion,
      };
      await onSubmitUpdate(template.templateId, payload);
    } else {
      const payload: CreateAvailabilityTemplateRequest = {
        startTime: formattedStartTime,
        endTime: formattedEndTime,
        weekdays: selectedWeekdays,
        effectiveFrom,
        effectiveTo: effectiveType === 'UNTIL_DATE' ? effectiveTo : null,
        serviceIds: selectedServiceIds,
        note: note.trim() || undefined,
      };
      await onSubmitCreate(payload);
    }
  };

  const weekdayOptions = ALL_WEEKDAYS.map((d) => ({
    value: d,
    label: WEEKDAY_SHORT_LABELS[d],
  }));

  return (
    <Modal
      open={open}
      title={isEdit ? 'Chỉnh sửa lịch hàng tuần' : 'Tạo lịch hàng tuần'}
      onClose={() => !isSubmitting && onClose()}
      className="mentor-availability-slot-modal"
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {staleNotice && (
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs font-medium">
            {staleNotice}
          </div>
        )}

        {/* Ngày trong tuần */}
        <FormField label="Ngày trong tuần" required error={errors.weekdays}>
          <ToggleGroup
            options={weekdayOptions}
            value={selectedWeekdays}
            onChange={(val) => setSelectedWeekdays(val as WeekdayEnum[])}
          />
        </FormField>

        {/* Khung giờ 2 cột bằng nhau */}
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Bắt đầu" htmlFor="tpl-start-time" required error={errors.startTime}>
            <TextField
              id="tpl-start-time"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="font-semibold text-gray-800"
            />
          </FormField>

          <FormField label="Kết thúc" htmlFor="tpl-end-time" required error={errors.endTime}>
            <TextField
              id="tpl-end-time"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="font-semibold text-gray-800"
            />
          </FormField>
        </div>

        {/* Dịch vụ áp dụng */}
        <FormField label="Dịch vụ áp dụng" required error={errors.services}>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {activeServices.map((service) => {
              const isSelected = selectedServiceIds.includes(service.serviceId);
              const priceText = service.isFree
                ? 'Miễn phí'
                : `${new Intl.NumberFormat('vi-VN').format(service.publicPriceScoin ?? 0)} S-coins`;
              return (
                <SelectableRow
                  key={service.serviceId}
                  selected={isSelected}
                  onSelect={() => toggleService(service.serviceId)}
                  title={service.title}
                  description={`${service.durationMinutes} phút · ${priceText}`}
                />
              );
            })}
          </div>
        </FormField>

        {/* Effective Dates */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <FormField label="Áp dụng từ" htmlFor="tpl-effective-from" required error={errors.effectiveFrom}>
            <TextField
              id="tpl-effective-from"
              type="date"
              value={effectiveFrom}
              onChange={(e) => setEffectiveFrom(e.target.value)}
            />
          </FormField>

          <FormField label="Thời hạn kết thúc">
            <div className="space-y-2">
              <RadioGroup
                name="effectiveType"
                value={effectiveType}
                onChange={(val) => setEffectiveType(val as 'UNLIMITED' | 'UNTIL_DATE')}
                options={[
                  { value: 'UNLIMITED', label: 'Không giới hạn' },
                  { value: 'UNTIL_DATE', label: 'Đến ngày' },
                ]}
              />

              {effectiveType === 'UNTIL_DATE' && (
                <div className="pt-1">
                  <TextField
                    type="date"
                    value={effectiveTo}
                    min={effectiveFrom}
                    onChange={(e) => setEffectiveTo(e.target.value)}
                    error={errors.effectiveTo}
                  />
                </div>
              )}
            </div>
          </FormField>
        </div>

        {/* Note */}
        <div className="pt-2 border-t border-slate-100">
          <FormField label="Ghi chú" htmlFor="tpl-note" error={errors.note}>
            <TextArea
              id="tpl-note"
              rows={2}
              maxLength={200}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ghi chú cho lịch này..."
            />
          </FormField>
        </div>

        {/* Modal Footer */}
        <div className="form-modal-footer pt-4 border-t border-slate-200 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isSubmitting}
            onClick={onClose}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            loading={isSubmitting}
          >
            {isEdit ? 'Lưu thay đổi' : 'Tạo lịch hàng tuần'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
