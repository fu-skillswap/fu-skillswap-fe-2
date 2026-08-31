/**
 * @file FeaturedProjectsSection.tsx
 * @description Sub-component hiển thị Phần 4: Dự án tiêu biểu trong Hồ sơ Mentor.
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

interface FeaturedProjectsSectionProps {
  register: UseFormRegister<MentorProfileFormValues>;
  errors: FieldErrors<MentorProfileFormValues>;
  projectFields: FieldArrayWithId<MentorProfileFormValues, 'projects', 'id'>[];
  appendProject: UseFieldArrayAppend<MentorProfileFormValues, 'projects'>;
  removeProject: (index: number) => void;
  disabled?: boolean;
}

export function FeaturedProjectsSection({
  register,
  errors,
  projectFields,
  appendProject,
  removeProject,
  disabled,
}: FeaturedProjectsSectionProps) {
  return (
    <fieldset
      disabled={disabled}
      className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-5 disabled:opacity-75"
    >
      <h2 className="text-lg font-bold text-slate-900">4. Dự án tiêu biểu (Không bắt buộc)</h2>

      {projectFields.length === 0 && (
        <p className="text-sm text-slate-500">
          Chưa có dự án nào được thêm. Nhấn nút bên dưới để thêm dự án thực tế nổi bật của bạn nếu
          muốn.
        </p>
      )}

      {projectFields.map((field, index) => (
        <div
          key={field.id}
          className="bg-slate-50/80 border border-slate-200/70 rounded-xl p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <strong className="text-sm font-bold text-slate-700">Dự án #{index + 1}</strong>
            <button
              type="button"
              onClick={() => removeProject(index)}
              className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors flex items-center gap-1 cursor-pointer bg-transparent border-0"
            >
              ✕ Xóa
            </button>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor={`projectTitle-${index}`}
              className="block text-sm font-semibold text-slate-700"
            >
              Tên dự án <span className="text-red-500 font-bold ml-0.5">*</span>
            </label>
            <input
              id={`projectTitle-${index}`}
              placeholder="VD: SWP391 Booking Platform"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all outline-none shadow-sm disabled:bg-slate-50"
              {...register(`projects.${index}.title`)}
            />
            {errors.projects?.[index]?.title && (
              <p className="text-xs font-medium text-red-500 mt-1">
                {errors.projects[index]?.title?.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor={`projectContent-${index}`}
              className="block text-sm font-semibold text-slate-700"
            >
              Vai trò, công nghệ hoặc điểm nổi bật <span className="text-red-500 font-bold ml-0.5">*</span>
            </label>
            <input
              id={`projectContent-${index}`}
              placeholder="VD: Fullstack Developer | Spring Boot, React, Tailwind"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all outline-none shadow-sm disabled:bg-slate-50"
              {...register(`projects.${index}.content`)}
            />
            {errors.projects?.[index]?.content && (
              <p className="text-xs font-medium text-red-500 mt-1">
                {errors.projects[index]?.content?.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor={`projectDescription-${index}`}
              className="block text-sm font-semibold text-slate-700"
            >
              Mô tả dự án (Vấn đề, cách làm & kết quả)
            </label>
            <textarea
              id={`projectDescription-${index}`}
              rows={3}
              placeholder="Mô tả ngắn gọn kết quả dự án..."
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all outline-none shadow-sm resize-none disabled:bg-slate-50"
              {...register(`projects.${index}.projectDescription`)}
            />
            {errors.projects?.[index]?.projectDescription && (
              <p className="text-xs font-medium text-red-500 mt-1">
                {errors.projects[index]?.projectDescription?.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor={`liveDemoUrl-${index}`}
              className="block text-sm font-semibold text-slate-700"
            >
              Đường dẫn Live Demo / Repository (Không bắt buộc)
            </label>
            <input
              id={`liveDemoUrl-${index}`}
              placeholder="https://demo.example.com"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all outline-none shadow-sm disabled:bg-slate-50"
              {...register(`projects.${index}.liveDemoUrl`)}
            />
            {errors.projects?.[index]?.liveDemoUrl && (
              <p className="text-xs font-medium text-red-500 mt-1">
                {errors.projects[index]?.liveDemoUrl?.message}
              </p>
            )}
          </div>
        </div>
      ))}

      <div>
        <button
          type="button"
          onClick={() =>
            appendProject({ title: '', content: '', projectDescription: '', liveDemoUrl: '' })
          }
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-50 text-sky-600 border border-sky-200 hover:bg-sky-100 text-xs font-bold transition-colors cursor-pointer"
        >
          + Thêm dự án tiêu biểu
        </button>
      </div>
    </fieldset>
  );
}
