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
      className="card mentor-reg-card"
      disabled={disabled}
      style={{ border: '1px solid #e2e8f0', display: 'grid', gap: '16px' }}
    >
      <h2 className="mentor-section-title">1. Thông tin cơ bản</h2>

      <div className="field">
        <label htmlFor="headline">
          Tiêu đề vị trí / Chuyên môn <span className="required-asterisk">*</span>
        </label>
        <input
          id="headline"
          placeholder="VD: Senior Fullstack Engineer | Java & React Expert"
          {...register('headline')}
        />
        {errors.headline && <p className="error">{errors.headline.message}</p>}
      </div>

      <div className="field">
        <label htmlFor="expertiseDescription">
          Mô tả kinh nghiệm chuyên môn <span className="required-asterisk">*</span>
        </label>
        <textarea
          id="expertiseDescription"
          rows={4}
          style={{ resize: 'none' }}
          placeholder="Chia sẻ kinh nghiệm làm việc, các dự án thực tế và thế mạnh tư vấn của bạn..."
          {...register('expertiseDescription')}
        />
        {errors.expertiseDescription && (
          <p className="error">{errors.expertiseDescription.message}</p>
        )}
      </div>

      <div className="field">
        <label htmlFor="phoneNumber">
          Số điện thoại liên hệ <span className="required-asterisk">*</span>
        </label>
        <input id="phoneNumber" placeholder="VD: 0912345678" {...register('phoneNumber')} />
        {errors.phoneNumber && <p className="error">{errors.phoneNumber.message}</p>}
      </div>

      <div className="field">
        <label htmlFor="githubUrl">Đường dẫn GitHub (Không bắt buộc)</label>
        <input
          id="githubUrl"
          placeholder="https://github.com/your-username"
          {...register('githubUrl')}
        />
        {errors.githubUrl && <p className="error">{errors.githubUrl.message}</p>}
      </div>

      <div className="field">
        <label htmlFor="portfolioUrl">Đường dẫn Portfolio / Website cá nhân (Không bắt buộc)</label>
        <input
          id="portfolioUrl"
          placeholder="https://your-portfolio.dev"
          {...register('portfolioUrl')}
        />
        {errors.portfolioUrl && <p className="error">{errors.portfolioUrl.message}</p>}
      </div>
    </fieldset>
  );
}
