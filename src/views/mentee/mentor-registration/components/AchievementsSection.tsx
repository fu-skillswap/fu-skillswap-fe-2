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
  UseFieldArrayRemove,
} from 'react-hook-form';
import type { MentorProfileFormValues } from '@/models/schemas/mentorProfileSchema';

interface AchievementsSectionProps {
  register: UseFormRegister<MentorProfileFormValues>;
  errors: FieldErrors<MentorProfileFormValues>;
  achievementFields: FieldArrayWithId<MentorProfileFormValues, 'achievements', 'id'>[];
  appendAchievement: UseFieldArrayAppend<MentorProfileFormValues, 'achievements'>;
  removeAchievement: UseFieldArrayRemove;
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
      className="card mentor-reg-card"
      disabled={disabled}
      style={{ border: '1px solid #e2e8f0', display: 'grid', gap: '16px' }}
    >
      <h2 className="mentor-section-title">5. Học vấn & Giải thưởng nổi bật (Không bắt buộc)</h2>

      {achievementFields.length === 0 && (
        <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
          Chưa có học vấn hoặc giải thưởng nào được thêm. Nhấn nút bên dưới để thêm thành tích tiêu
          biểu của bạn nếu muốn.
        </p>
      )}

      {achievementFields.map((field, index) => (
        <div
          key={field.id}
          style={{
            padding: '14px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            background: '#f8fafc',
            display: 'grid',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ fontSize: '13px', color: '#334155' }}>
              Giải thưởng / Thành tích #{index + 1}
            </strong>
            <button
              type="button"
              onClick={() => removeAchievement(index)}
              style={{
                border: 'none',
                background: 'transparent',
                color: '#ef4444',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 700,
              }}
            >
              ✕ Xóa
            </button>
          </div>

          <div className="field">
            <label htmlFor={`achievementTitle-${index}`}>
              Tên giải thưởng / thành tích <span className="required-asterisk">*</span>
            </label>
            <input
              id={`achievementTitle-${index}`}
              placeholder="VD: Top 10 Hackathon FPTU"
              {...register(`achievements.${index}.title`)}
            />
            {errors.achievements?.[index]?.title && (
              <p className="error">{errors.achievements[index]?.title?.message}</p>
            )}
          </div>

          <div className="field">
            <label htmlFor={`awardDescription-${index}`}>
              Mô tả giải thưởng / thành tích <span className="required-asterisk">*</span>
            </label>
            <textarea
              id={`awardDescription-${index}`}
              rows={2}
              style={{ resize: 'none' }}
              placeholder="Mô tả ngắn giải thưởng hoặc thành tích..."
              {...register(`achievements.${index}.awardDescription`)}
            />
            {errors.achievements?.[index]?.awardDescription && (
              <p className="error">{errors.achievements[index]?.awardDescription?.message}</p>
            )}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
            }}
          >
            <div className="field">
              <label htmlFor={`achievedAt-${index}`}>
                Thời điểm đạt được <span className="required-asterisk">*</span>
              </label>
              <input
                id={`achievedAt-${index}`}
                type="date"
                {...register(`achievements.${index}.achievedAt`)}
              />
              {errors.achievements?.[index]?.achievedAt && (
                <p className="error">{errors.achievements[index]?.achievedAt?.message}</p>
              )}
            </div>

            <div className="field">
              <label htmlFor={`productHeader-${index}`}>
                Tiêu đề sản phẩm / Case study <span className="required-asterisk">*</span>
              </label>
              <input
                id={`productHeader-${index}`}
                placeholder="VD: Case study: Growth campaign"
                {...register(`achievements.${index}.productHeader`)}
              />
              {errors.achievements?.[index]?.productHeader && (
                <p className="error">{errors.achievements[index]?.productHeader?.message}</p>
              )}
            </div>
          </div>

          <div className="field">
            <label htmlFor={`achievementProductDescription-${index}`}>
              Mô tả sản phẩm / Case study đi kèm <span className="required-asterisk">*</span>
            </label>
            <textarea
              id={`achievementProductDescription-${index}`}
              rows={2}
              style={{ resize: 'none' }}
              placeholder="Mô tả sản phẩm/case đi kèm thành tích..."
              {...register(`achievements.${index}.productDescription`)}
            />
            {errors.achievements?.[index]?.productDescription && (
              <p className="error">{errors.achievements[index]?.productDescription?.message}</p>
            )}
          </div>

          <div className="field">
            <label htmlFor={`achievementDemoUrl-${index}`}>
              Đường dẫn Demo / Chứng nhận (Không bắt buộc)
            </label>
            <input
              id={`achievementDemoUrl-${index}`}
              placeholder="https://demo.example.com"
              {...register(`achievements.${index}.demoUrl`)}
            />
            {errors.achievements?.[index]?.demoUrl && (
              <p className="error">{errors.achievements[index]?.demoUrl?.message}</p>
            )}
          </div>
        </div>
      ))}

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
        style={{
          justifySelf: 'start',
          padding: '8px 16px',
          borderRadius: '10px',
          border: '1px dashed #0095f6',
          background: '#ebf5fe',
          color: '#0095f6',
          fontWeight: 700,
          fontSize: '13px',
          cursor: 'pointer',
        }}
      >
        + Thêm học vấn / giải thưởng
      </button>
    </fieldset>
  );
}
