'use client';
import { Lightbulb, X } from 'lucide-react';
import { useState } from 'react';
import type { FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import type { MentorProfileFormValues } from '@/models/schemas/mentorProfileSchema';
import { TITLE_EXAMPLES } from '../mentorRegistration.constants';

interface Props {
  register: UseFormRegister<MentorProfileFormValues>;
  errors: FieldErrors<MentorProfileFormValues>;
  watch: UseFormWatch<MentorProfileFormValues>;
  setValue: UseFormSetValue<MentorProfileFormValues>;
  disabled?: boolean;
}
const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 disabled:bg-slate-50';

export function BasicInfoSection({ register, errors, watch, setValue, disabled }: Props) {
  const [showExamples, setShowExamples] = useState(true);
  const headline = watch('headline') || '';
  const description = watch('expertiseDescription') || '';
  const error = (message?: string) =>
    message ? (
      <p role="alert" className="m-0 text-xs font-semibold text-red-600">
        {message}
      </p>
    ) : null;
  return (
    <fieldset
      disabled={disabled}
      className="space-y-5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-7"
    >
      <div className="space-y-1.5">
        <label htmlFor="headline" className="block text-sm font-semibold text-slate-800">
          Tiêu đề mentor <span className="text-red-600">*</span>
        </label>
        <input
          id="headline"
          maxLength={120}
          placeholder="VD: Sinh viên năm 3 | Web Developer | React & Node.js"
          aria-invalid={Boolean(errors.headline)}
          className={inputClass}
          {...register('headline')}
        />
        <div className="flex justify-between gap-3 text-xs leading-5 text-slate-600">
          <span>Hãy viết ngắn gọn về vai trò, công nghệ hoặc lĩnh vực bạn có thể tư vấn.</span>
          <span className="shrink-0">{headline.length}/120</span>
        </div>
        {error(errors.headline?.message)}
      </div>
      {showExamples && (
        <div className="relative rounded-xl bg-sky-50 p-3 pr-10 text-xs text-sky-900">
          <div className="flex items-center gap-2 font-bold">
            <Lightbulb className="h-4 w-4" /> Ví dụ cho sinh viên FPT:
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {TITLE_EXAMPLES.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() =>
                  setValue('headline', value, { shouldDirty: true, shouldValidate: true })
                }
                className="min-h-8 cursor-pointer rounded-lg border border-sky-200 bg-white px-2.5 text-[11px] font-semibold text-sky-800 hover:bg-sky-100"
              >
                {value}
              </button>
            ))}
          </div>
          <button
            type="button"
            aria-label="Ẩn gợi ý"
            onClick={() => setShowExamples(false)}
            className="absolute right-2 top-2 grid h-7 w-7 cursor-pointer place-items-center border-0 bg-transparent text-sky-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      <div className="space-y-1.5">
        <label
          htmlFor="expertiseDescription"
          className="block text-sm font-semibold text-slate-800"
        >
          Giới thiệu ngắn về bản thân <span className="text-red-600">*</span>
        </label>
        <textarea
          id="expertiseDescription"
          rows={5}
          maxLength={1500}
          placeholder="Chia sẻ hành trình học tập, dự án, kinh nghiệm hoặc những chủ đề bạn muốn hỗ trợ cho các bạn mentee."
          aria-invalid={Boolean(errors.expertiseDescription)}
          className={`${inputClass} resize-y`}
          {...register('expertiseDescription')}
        />
        <div className="flex justify-end text-xs text-slate-600">{description.length}/1500</div>
        {error(errors.expertiseDescription?.message)}
      </div>
      <div className="space-y-1.5">
        <label htmlFor="phoneNumber" className="block text-sm font-semibold text-slate-800">
          Số điện thoại liên hệ <span className="text-red-600">*</span>
        </label>
        <input
          id="phoneNumber"
          placeholder="0912 345 678"
          aria-invalid={Boolean(errors.phoneNumber)}
          className={inputClass}
          {...register('phoneNumber')}
        />
        <p className="m-0 text-xs text-slate-600">Dùng để mentee liên hệ đặt lịch tư vấn.</p>
        {error(errors.phoneNumber?.message)}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="githubUrl" className="block text-sm font-semibold text-slate-800">
            GitHub (không bắt buộc)
          </label>
          <input
            id="githubUrl"
            placeholder="https://github.com/your-username"
            className={inputClass}
            {...register('githubUrl')}
          />
          {error(errors.githubUrl?.message)}
        </div>
        <div className="space-y-1.5">
          <label htmlFor="portfolioUrl" className="block text-sm font-semibold text-slate-800">
            Portfolio (không bắt buộc)
          </label>
          <input
            id="portfolioUrl"
            placeholder="https://your-portfolio.dev"
            className={inputClass}
            {...register('portfolioUrl')}
          />
          {error(errors.portfolioUrl?.message)}
        </div>
      </div>
    </fieldset>
  );
}
