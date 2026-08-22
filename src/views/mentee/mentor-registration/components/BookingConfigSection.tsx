/**
 * @file BookingConfigSection.tsx
 * @description Sub-component hiển thị Phần 6: Thời gian đặt lịch booking trong Hồ sơ Mentor.
 */

"use client";

import React from "react";
import type { UseFormRegister, FieldErrors } from "react-hook-form";
import type { MentorProfileFormValues } from "@/models/schemas/mentorProfileSchema";

interface BookingConfigSectionProps {
  register: UseFormRegister<MentorProfileFormValues>;
  errors: FieldErrors<MentorProfileFormValues>;
  isAvailable?: boolean;
  disabled?: boolean;
}

export function BookingConfigSection({
  register,
  errors,
  isAvailable,
  disabled,
}: BookingConfigSectionProps) {
  return (
    <fieldset
      className="card mentor-reg-card"
      disabled={disabled}
      style={{ border: "1px solid #e2e8f0", display: "grid", gap: "16px" }}
    >
      <h2 className="mentor-section-title">6. Thời gian đặt lịch booking</h2>

      <div className="field">
        <label
          htmlFor="isAvailable"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontWeight: 700,
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          <input
            type="checkbox"
            id="isAvailable"
            style={{ width: "18px", height: "18px" }}
            {...register("isAvailable")}
          />
          <span>
            Tôi sẵn sàng nhận lịch tư vấn từ Mentee <span className="required-asterisk">*</span>
          </span>
        </label>
        {errors.isAvailable && (
          <p className="error" style={{ marginTop: "4px" }}>
            {errors.isAvailable.message}
          </p>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "14px",
        }}
      >
        <div className="field">
          <label htmlFor="minimumBookingLeadTimeMinutes">
            Báo trước tối thiểu (Phút) <span className="required-asterisk">*</span>
          </label>
          <input
            id="minimumBookingLeadTimeMinutes"
            type="number"
            disabled={!isAvailable}
            placeholder="VD: 120"
            {...register("minimumBookingLeadTimeMinutes")}
          />
          {errors.minimumBookingLeadTimeMinutes && (
            <p className="error">{errors.minimumBookingLeadTimeMinutes.message}</p>
          )}
        </div>

        <div className="field">
          <label htmlFor="maximumBookingHorizonDays">
            Mở lịch tối đa (Ngày) <span className="required-asterisk">*</span>
          </label>
          <input
            id="maximumBookingHorizonDays"
            type="number"
            disabled={!isAvailable}
            placeholder="VD: 30"
            {...register("maximumBookingHorizonDays")}
          />
          {errors.maximumBookingHorizonDays && (
            <p className="error">{errors.maximumBookingHorizonDays.message}</p>
          )}
        </div>
      </div>
    </fieldset>
  );
}
