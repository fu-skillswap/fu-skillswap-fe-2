/**
 * @file BookingConfigSection.tsx
 * @description Sub-component hiển thị Phần 6: Thời gian đặt lịch booking trong Hồ sơ Mentor.
 */

'use client';

import React from 'react';
import type { UseFormRegister, FieldErrors } from 'react-hook-form';
import type { MentorProfileFormValues } from '@/models/schemas/mentorProfileSchema';

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
      disabled={disabled}
      className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-5 disabled:opacity-75"
    >
      <h2 className="text-lg font-bold text-slate-900">6. Thời gian đặt lịch booking</h2>

      <div className="space-y-1">
        <label
          htmlFor="isAvailable"
          className="inline-flex items-center gap-2.5 cursor-pointer text-sm font-semibold text-slate-800"
        >
          <input
            type="checkbox"
            id="isAvailable"
            className="w-4.5 h-4.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500 accent-sky-600 cursor-pointer"
            {...register('isAvailable')}
          />
          <span>
            Tôi sẵn sàng nhận lịch tư vấn từ Mentee <span className="text-red-500 font-bold ml-0.5">*</span>
          </span>
        </label>
        {errors.isAvailable && (
          <p className="text-xs font-medium text-red-500 mt-1">
            {errors.isAvailable.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label
            htmlFor="minimumBookingLeadTimeMinutes"
            className="block text-sm font-semibold text-slate-700"
          >
            Báo trước tối thiểu (Phút) <span className="text-red-500 font-bold ml-0.5">*</span>
          </label>
          <input
            id="minimumBookingLeadTimeMinutes"
            type="number"
            disabled={!isAvailable}
            placeholder="VD: 120"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all outline-none shadow-sm disabled:bg-slate-50 disabled:text-slate-400"
            {...register('minimumBookingLeadTimeMinutes')}
          />
          {errors.minimumBookingLeadTimeMinutes && (
            <p className="text-xs font-medium text-red-500 mt-1">
              {errors.minimumBookingLeadTimeMinutes.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="maximumBookingHorizonDays"
            className="block text-sm font-semibold text-slate-700"
          >
            Mở lịch tối đa (Ngày) <span className="text-red-500 font-bold ml-0.5">*</span>
          </label>
          <input
            id="maximumBookingHorizonDays"
            type="number"
            disabled={!isAvailable}
            placeholder="VD: 30"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all outline-none shadow-sm disabled:bg-slate-50 disabled:text-slate-400"
            {...register('maximumBookingHorizonDays')}
          />
          {errors.maximumBookingHorizonDays && (
            <p className="text-xs font-medium text-red-500 mt-1">
              {errors.maximumBookingHorizonDays.message}
            </p>
          )}
        </div>
      </div>
    </fieldset>
  );
}
