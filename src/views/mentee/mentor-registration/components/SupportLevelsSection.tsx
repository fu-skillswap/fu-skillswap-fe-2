/**
 * @file SupportLevelsSection.tsx
 * @description Sub-component hiển thị Phần 3: Cấp độ năng lực hỗ trợ trong Hồ sơ Mentor.
 */

'use client';

import React from 'react';
import { Controller } from 'react-hook-form';
import type { Control, FieldErrors } from 'react-hook-form';
import type { MentorProfileFormValues } from '@/models/schemas/mentorProfileSchema';
import { SelectField, SelectOption } from '@/components/ui/SelectField';

interface SupportLevelsSectionProps {
  control: Control<MentorProfileFormValues>;
  errors: FieldErrors<MentorProfileFormValues>;
  levelOptions: SelectOption[];
  disabled?: boolean;
}

export function SupportLevelsSection({
  control,
  errors,
  levelOptions,
  disabled,
}: SupportLevelsSectionProps) {
  return (
    <fieldset
      disabled={disabled}
      className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-5 disabled:opacity-75"
    >
      <h2 className="text-lg font-bold text-slate-900">
        3. Cấp độ năng lực hỗ trợ (Thang điểm 1 - 5)
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Controller
          name="foundationSupportLevel"
          control={control}
          render={({ field }) => (
            <SelectField
              id="foundationSupportLevel"
              label={<span className="text-sm font-semibold text-slate-700">Kiến thức căn bản (1-5)</span>}
              required
              disabled={disabled}
              error={errors.foundationSupportLevel?.message}
              placeholder="Chọn mức độ"
              value={
                field.value !== undefined && field.value !== null ? String(field.value) : undefined
              }
              onValueChange={(val) => field.onChange(Number(val))}
              options={levelOptions}
            />
          )}
        />

        <Controller
          name="outputReviewSupportLevel"
          control={control}
          render={({ field }) => (
            <SelectField
              id="outputReviewSupportLevel"
              label={<span className="text-sm font-semibold text-slate-700">Review Đồ án / Code (1-5)</span>}
              required
              disabled={disabled}
              error={errors.outputReviewSupportLevel?.message}
              placeholder="Chọn mức độ"
              value={
                field.value !== undefined && field.value !== null ? String(field.value) : undefined
              }
              onValueChange={(val) => field.onChange(Number(val))}
              options={levelOptions}
            />
          )}
        />

        <Controller
          name="directionSupportLevel"
          control={control}
          render={({ field }) => (
            <SelectField
              id="directionSupportLevel"
              label={<span className="text-sm font-semibold text-slate-700">Định hướng phát triển (1-5)</span>}
              required
              disabled={disabled}
              error={errors.directionSupportLevel?.message}
              placeholder="Chọn mức độ"
              value={
                field.value !== undefined && field.value !== null ? String(field.value) : undefined
              }
              onValueChange={(val) => field.onChange(Number(val))}
              options={levelOptions}
            />
          )}
        />
      </div>
    </fieldset>
  );
}
