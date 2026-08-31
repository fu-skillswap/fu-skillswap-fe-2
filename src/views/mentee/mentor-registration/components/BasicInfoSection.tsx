/**
 * @file BasicInfoSection.tsx
 * @description Sub-component hiển thị Phần 1: Thông tin cơ bản trong Hồ sơ Mentor.
 */

'use client';

import React from 'react';
import type { UseFormRegister, FieldErrors } from 'react-hook-form';
import type { MentorProfileFormValues } from '@/models/schemas/mentorProfileSchema';

interface BasicInfoSectionProps {
  register: UseFormRegister<MentorProfileFormValues>;
  errors: FieldErrors<MentorProfileFormValues>;
  disabled?: boolean;
}

export function BasicInfoSection({ register, errors, disabled }: BasicInfoSectionProps) {
  return (
    <fieldset
      disabled={disabled}
      className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-5 disabled:opacity-75"
    >
      <h2 className="text-lg font-bold text-slate-900">1. Thông tin cơ bản</h2>

      <div className="space-y-1.5">
        <label htmlFor="headline" className="block text-sm font-semibold text-slate-700">
          Tiêu đề vị trí / Chuyên môn <span className="text-red-500 font-bold ml-0.5">*</span>
        </label>
        <input
          id="headline"
          placeholder="VD: Senior Fullstack Engineer | Java & React Expert"
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all outline-none shadow-sm disabled:bg-slate-50"
          {...register('headline')}
        />
        {errors.headline && (
          <p className="text-xs font-medium text-red-500 mt-1">{errors.headline.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="expertiseDescription" className="block text-sm font-semibold text-slate-700">
          Mô tả kinh nghiệm chuyên môn <span className="text-red-500 font-bold ml-0.5">*</span>
        </label>
        <textarea
          id="expertiseDescription"
          rows={4}
          placeholder="Chia sẻ kinh nghiệm làm việc, các dự án thực tế và thế mạnh tư vấn của bạn..."
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all outline-none shadow-sm resize-none disabled:bg-slate-50"
          {...register('expertiseDescription')}
        />
        {errors.expertiseDescription && (
          <p className="text-xs font-medium text-red-500 mt-1">
            {errors.expertiseDescription.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="phoneNumber" className="block text-sm font-semibold text-slate-700">
          Số điện thoại liên hệ <span className="text-red-500 font-bold ml-0.5">*</span>
        </label>
        <input
          id="phoneNumber"
          placeholder="VD: 0912345678"
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all outline-none shadow-sm disabled:bg-slate-50"
          {...register('phoneNumber')}
        />
        {errors.phoneNumber && (
          <p className="text-xs font-medium text-red-500 mt-1">{errors.phoneNumber.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="githubUrl" className="block text-sm font-semibold text-slate-700">
          Đường dẫn GitHub (Không bắt buộc)
        </label>
        <input
          id="githubUrl"
          placeholder="https://github.com/your-username"
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all outline-none shadow-sm disabled:bg-slate-50"
          {...register('githubUrl')}
        />
        {errors.githubUrl && (
          <p className="text-xs font-medium text-red-500 mt-1">{errors.githubUrl.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="portfolioUrl" className="block text-sm font-semibold text-slate-700">
          Đường dẫn Portfolio / Website cá nhân (Không bắt buộc)
        </label>
        <input
          id="portfolioUrl"
          placeholder="https://your-portfolio.dev"
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all outline-none shadow-sm disabled:bg-slate-50"
          {...register('portfolioUrl')}
        />
        {errors.portfolioUrl && (
          <p className="text-xs font-medium text-red-500 mt-1">{errors.portfolioUrl.message}</p>
        )}
      </div>
    </fieldset>
  );
}
