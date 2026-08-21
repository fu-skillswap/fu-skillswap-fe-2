/**
 * @file SupportLevelsSection.tsx
 * @description Sub-component hiển thị Phần 3: Cấp độ năng lực hỗ trợ trong Hồ sơ Mentor.
 */

"use client";

import React from "react";
import { Controller } from "react-hook-form";
import type { Control, FieldErrors } from "react-hook-form";
import type { MentorProfileFormValues } from "@/models/schemas/mentorProfileSchema";
import { SelectField, SelectOption } from "@/components/ui/SelectField";

interface SupportLevelsSectionProps {
  control: Control<MentorProfileFormValues>;
  errors: FieldErrors<MentorProfileFormValues>;
  levelOptions: SelectOption[];
}

export function SupportLevelsSection({
  control,
  errors,
  levelOptions,
}: SupportLevelsSectionProps) {
  return (
    <fieldset
      className="card mentor-reg-card"
      style={{ border: "1px solid #e2e8f0", display: "grid", gap: "16px" }}
    >
      <h2 className="mentor-section-title">3. Cấp độ năng lực hỗ trợ (Thang điểm 1 - 5)</h2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
        <Controller
          name="foundationSupportLevel"
          control={control}
          render={({ field }) => (
            <SelectField
              id="foundationSupportLevel"
              label="Kiến thức căn bản (1-5)"
              required
              error={errors.foundationSupportLevel?.message}
              placeholder="Chọn mức độ"
              value={field.value !== undefined && field.value !== null ? String(field.value) : undefined}
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
              label="Review Đồ án / Code (1-5)"
              required
              error={errors.outputReviewSupportLevel?.message}
              placeholder="Chọn mức độ"
              value={field.value !== undefined && field.value !== null ? String(field.value) : undefined}
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
              label="Định hướng phát triển (1-5)"
              required
              error={errors.directionSupportLevel?.message}
              placeholder="Chọn mức độ"
              value={field.value !== undefined && field.value !== null ? String(field.value) : undefined}
              onValueChange={(val) => field.onChange(Number(val))}
              options={levelOptions}
            />
          )}
        />
      </div>
    </fieldset>
  );
}
