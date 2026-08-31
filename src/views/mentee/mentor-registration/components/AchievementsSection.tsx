/**
 * @file AchievementsSection.tsx
 * @description Sub-component hiển thị Phần 5: Học vấn & Giải thưởng nổi bật trong Hồ sơ Mentor.
 */

'use client';

import React from 'react';
import type {
  UseFormRegister,
  FieldErrors,
  FieldArrayWithId,
  UseFieldArrayAppend,
} from 'react-hook-form';
import type { MentorProfileFormValues } from '@/models/schemas/mentorProfileSchema';

interface AchievementsSectionProps {
  register: UseFormRegister<MentorProfileFormValues>;
  errors: FieldErrors<MentorProfileFormValues>;
  achievementFields: FieldArrayWithId<MentorProfileFormValues, 'achievements', 'id'>[];
  appendAchievement: UseFieldArrayAppend<MentorProfileFormValues, 'achievements'>;
  removeAchievement: (index: number) => void;
  disabled?: boolean;
}

export function AchievementsSection({
  register,
  errors,
  achievementFields,
  appendAchievement,
  removeAchievement,
  disabled,
}: AchievementsSectionProps) {
  return (
    <fieldset
      disabled={disabled}
      className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-5 disabled:opacity-75"
    >
      <h2 className="text-lg font-bold text-slate-900">
        5. Học vấn & Giải thưởng nổi bật (Không bắt buộc)
      </h2>

      {achievementFields.length === 0 && (
        <p className="text-sm text-slate-500">
          Chưa có học vấn hoặc giải thưởng nào được thêm. Nhấn nút bên dưới để thêm thành tích tiêu
          biểu của bạn nếu muốn.
        </p>
      )}

      {achievementFields.map((field, index) => (
        <div
          key={field.id}
          className="bg-slate-50/80 border border-slate-200/70 rounded-xl p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <strong className="text-sm font-bold text-slate-700">
              Giải thưởng / Thành tích #{index + 1}
            </strong>
            <button
              type="button"
              onClick={() => removeAchievement(index)}
              className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors flex items-center gap-1 cursor-pointer bg-transparent border-0"
            >
              ✕ Xóa
            </button>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor={`achievementTitle-${index}`}
              className="block text-sm font-semibold text-slate-700"
            >
              Tên giải thưởng / thành tích <span className="text-red-500 font-bold ml-0.5">*</span>
            </label>
            <input
              id={`achievementTitle-${index}`}
              placeholder="VD: Top 10 Hackathon FPTU"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all outline-none shadow-sm disabled:bg-slate-50"
              {...register(`achievements.${index}.title`)}
            />
            {errors.achievements?.[index]?.title && (
              <p className="text-xs font-medium text-red-500 mt-1">
                {errors.achievements[index]?.title?.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor={`awardDescription-${index}`}
              className="block text-sm font-semibold text-slate-700"
            >
              Mô tả giải thưởng / thành tích <span className="text-red-500 font-bold ml-0.5">*</span>
            </label>
            <textarea
              id={`awardDescription-${index}`}
              rows={2}
              placeholder="Mô tả ngắn giải thưởng hoặc thành tích..."
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all outline-none shadow-sm resize-none disabled:bg-slate-50"
              {...register(`achievements.${index}.awardDescription`)}
            />
            {errors.achievements?.[index]?.awardDescription && (
              <p className="text-xs font-medium text-red-500 mt-1">
                {errors.achievements[index]?.awardDescription?.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label
                htmlFor={`achievedAt-${index}`}
                className="block text-sm font-semibold text-slate-700"
              >
                Thời điểm đạt được <span className="text-red-500 font-bold ml-0.5">*</span>
              </label>
              <input
                id={`achievedAt-${index}`}
                type="date"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all outline-none shadow-sm disabled:bg-slate-50"
                {...register(`achievements.${index}.achievedAt`)}
              />
              {errors.achievements?.[index]?.achievedAt && (
                <p className="text-xs font-medium text-red-500 mt-1">
                  {errors.achievements[index]?.achievedAt?.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor={`productHeader-${index}`}
                className="block text-sm font-semibold text-slate-700"
              >
                Tiêu đề sản phẩm / Case study <span className="text-red-500 font-bold ml-0.5">*</span>
              </label>
              <input
                id={`productHeader-${index}`}
                placeholder="VD: Case study: Growth campaign"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all outline-none shadow-sm disabled:bg-slate-50"
                {...register(`achievements.${index}.productHeader`)}
              />
              {errors.achievements?.[index]?.productHeader && (
                <p className="text-xs font-medium text-red-500 mt-1">
                  {errors.achievements[index]?.productHeader?.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor={`achievementProductDescription-${index}`}
              className="block text-sm font-semibold text-slate-700"
            >
              Mô tả sản phẩm / Case study đi kèm <span className="text-red-500 font-bold ml-0.5">*</span>
            </label>
            <textarea
              id={`achievementProductDescription-${index}`}
              rows={2}
              placeholder="Mô tả sản phẩm/case đi kèm thành tích..."
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all outline-none shadow-sm resize-none disabled:bg-slate-50"
              {...register(`achievements.${index}.productDescription`)}
            />
            {errors.achievements?.[index]?.productDescription && (
              <p className="text-xs font-medium text-red-500 mt-1">
                {errors.achievements[index]?.productDescription?.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor={`achievementDemoUrl-${index}`}
              className="block text-sm font-semibold text-slate-700"
            >
              Đường dẫn Demo / Chứng nhận (Không bắt buộc)
            </label>
            <input
              id={`achievementDemoUrl-${index}`}
              placeholder="https://demo.example.com"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all outline-none shadow-sm disabled:bg-slate-50"
              {...register(`achievements.${index}.demoUrl`)}
            />
            {errors.achievements?.[index]?.demoUrl && (
              <p className="text-xs font-medium text-red-500 mt-1">
                {errors.achievements[index]?.demoUrl?.message}
              </p>
            )}
          </div>
        </div>
      ))}

      <div>
        <button
          type="button"
          onClick={() =>
            appendAchievement({
              title: '',
              awardDescription: '',
              achievedAt: '',
              productHeader: '',
              productDescription: '',
              demoUrl: '',
            })
          }
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-50 text-sky-600 border border-sky-200 hover:bg-sky-100 text-xs font-bold transition-colors cursor-pointer"
        >
          + Thêm học vấn / giải thưởng
        </button>
      </div>
    </fieldset>
  );
}
