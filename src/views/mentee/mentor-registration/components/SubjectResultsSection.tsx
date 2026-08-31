/**
 * @file SubjectResultsSection.tsx
 * @description Sub-component hiển thị Phần 2: Môn học chuyên môn trong Hồ sơ Mentor.
 */

'use client';

import React from 'react';
import type {
  UseFormRegister,
  FieldErrors,
  FieldArrayWithId,
  UseFieldArrayAppend,
  UseFieldArrayRemove,
} from 'react-hook-form';
import type { MentorProfileFormValues } from '@/models/schemas/mentorProfileSchema';

interface SubjectResultsSectionProps {
  register: UseFormRegister<MentorProfileFormValues>;
  errors: FieldErrors<MentorProfileFormValues>;
  fields: FieldArrayWithId<MentorProfileFormValues, 'subjectResults', 'id'>[];
  append: UseFieldArrayAppend<MentorProfileFormValues, 'subjectResults'>;
  remove: UseFieldArrayRemove;
  disabled?: boolean;
}

export function SubjectResultsSection({
  register,
  errors,
  fields,
  append,
  remove,
  disabled,
}: SubjectResultsSectionProps) {
  return (
    <fieldset
      disabled={disabled}
      className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-5 disabled:opacity-75"
    >
      <h2 className="text-lg font-bold text-slate-900">2. Môn học chuyên môn</h2>

      {fields.length === 0 && (
        <p className="text-sm text-slate-500">
          Môn học chuyên môn không bắt buộc. Nếu bạn chọn thêm môn học hướng dẫn, vui lòng điền đầy
          đủ Mã môn, Tên môn và Điểm số.
        </p>
      )}

      {fields.map((field, index) => (
        <div
          key={field.id}
          className="bg-slate-50/80 border border-slate-200/70 rounded-xl p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <strong className="text-sm font-bold text-slate-700">Môn học #{index + 1}</strong>
            <button
              type="button"
              onClick={() => remove(index)}
              className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors flex items-center gap-1 cursor-pointer bg-transparent border-0"
            >
              ✕ Xóa
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label
                htmlFor={`subjectCode-${index}`}
                className="block text-sm font-semibold text-slate-700"
              >
                Mã môn học <span className="text-red-500 font-bold ml-0.5">*</span>
              </label>
              <input
                id={`subjectCode-${index}`}
                placeholder="VD: PRJ301"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all outline-none shadow-sm disabled:bg-slate-50"
                {...register(`subjectResults.${index}.subjectCode`)}
              />
              {errors.subjectResults?.[index]?.subjectCode && (
                <p className="text-xs font-medium text-red-500 mt-1">
                  {errors.subjectResults[index]?.subjectCode?.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor={`subjectName-${index}`}
                className="block text-sm font-semibold text-slate-700"
              >
                Tên môn học <span className="text-red-500 font-bold ml-0.5">*</span>
              </label>
              <input
                id={`subjectName-${index}`}
                placeholder="VD: Java Web Application Development"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all outline-none shadow-sm disabled:bg-slate-50"
                {...register(`subjectResults.${index}.subjectName`)}
              />
              {errors.subjectResults?.[index]?.subjectName && (
                <p className="text-xs font-medium text-red-500 mt-1">
                  {errors.subjectResults[index]?.subjectName?.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor={`scoreValue-${index}`}
                className="block text-sm font-semibold text-slate-700"
              >
                Điểm số <span className="text-red-500 font-bold ml-0.5">*</span>
              </label>
              <input
                id={`scoreValue-${index}`}
                type="number"
                step="0.1"
                placeholder="VD: 8.5"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all outline-none shadow-sm disabled:bg-slate-50"
                {...register(`subjectResults.${index}.scoreValue`)}
              />
              {errors.subjectResults?.[index]?.scoreValue && (
                <p className="text-xs font-medium text-red-500 mt-1">
                  {errors.subjectResults[index]?.scoreValue?.message}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}

      {errors.subjectResults && typeof errors.subjectResults.message === 'string' && (
        <p className="text-xs font-medium text-red-500">{errors.subjectResults.message}</p>
      )}

      <div>
        <button
          type="button"
          onClick={() => append({ subjectCode: '', subjectName: '', scoreValue: undefined as any })}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-50 text-sky-600 border border-sky-200 hover:bg-sky-100 text-xs font-bold transition-colors cursor-pointer"
        >
          + Thêm môn học hướng dẫn
        </button>
      </div>
    </fieldset>
  );
}
