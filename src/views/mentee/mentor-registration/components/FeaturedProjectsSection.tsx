/**
 * @file FeaturedProjectsSection.tsx
 * @description Sub-component hiển thị Phần 4: Dự án tiêu biểu trong Hồ sơ Mentor.
 */

"use client";

import React from "react";
import type { UseFormRegister, FieldErrors, FieldArrayWithId, UseFieldArrayAppend, UseFieldArrayRemove } from "react-hook-form";
import type { MentorProfileFormValues } from "@/models/schemas/mentorProfileSchema";

interface FeaturedProjectsSectionProps {
  register: UseFormRegister<MentorProfileFormValues>;
  errors: FieldErrors<MentorProfileFormValues>;
  projectFields: FieldArrayWithId<MentorProfileFormValues, "projects", "id">[];
  appendProject: UseFieldArrayAppend<MentorProfileFormValues, "projects">;
  removeProject: UseFieldArrayRemove;
}

export function FeaturedProjectsSection({
  register,
  errors,
  projectFields,
  appendProject,
  removeProject,
}: FeaturedProjectsSectionProps) {
  return (
    <fieldset
      className="card mentor-reg-card"
      style={{ border: "1px solid #e2e8f0", display: "grid", gap: "16px" }}
    >
      <h2 className="mentor-section-title">4. Dự án tiêu biểu (Không bắt buộc)</h2>

      {projectFields.length === 0 && (
        <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
          Chưa có dự án nào được thêm. Nhấn nút bên dưới để thêm dự án thực tế nổi bật của bạn nếu muốn.
        </p>
      )}

      {projectFields.map((field, index) => (
        <div
          key={field.id}
          style={{
            padding: "14px",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            background: "#f8fafc",
            display: "grid",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <strong style={{ fontSize: "13px", color: "#334155" }}>Dự án #{index + 1}</strong>
            <button
              type="button"
              onClick={() => removeProject(index)}
              style={{
                border: "none",
                background: "transparent",
                color: "#ef4444",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              ✕ Xóa
            </button>
          </div>

          <div className="field">
            <label htmlFor={`projectTitle-${index}`}>
              Tên dự án <span className="required-asterisk">*</span>
            </label>
            <input
              id={`projectTitle-${index}`}
              placeholder="VD: SWP391 Booking Platform"
              {...register(`projects.${index}.title`)}
            />
            {errors.projects?.[index]?.title && (
              <p className="error">{errors.projects[index]?.title?.message}</p>
            )}
          </div>

          <div className="field">
            <label htmlFor={`projectContent-${index}`}>
              Vai trò, công nghệ hoặc điểm nổi bật <span className="required-asterisk">*</span>
            </label>
            <input
              id={`projectContent-${index}`}
              placeholder="VD: Fullstack Developer | Spring Boot, React, Tailwind"
              {...register(`projects.${index}.content`)}
            />
            {errors.projects?.[index]?.content && (
              <p className="error">{errors.projects[index]?.content?.message}</p>
            )}
          </div>

          <div className="field">
            <label htmlFor={`projectDescription-${index}`}>
              Mô tả dự án (Vấn đề, cách làm & kết quả)
            </label>
            <textarea
              id={`projectDescription-${index}`}
              rows={3}
              style={{ resize: "none" }}
              placeholder="Mô tả ngắn gọn kết quả dự án..."
              {...register(`projects.${index}.projectDescription`)}
            />
            {errors.projects?.[index]?.projectDescription && (
              <p className="error">{errors.projects[index]?.projectDescription?.message}</p>
            )}
          </div>

          <div className="field">
            <label htmlFor={`liveDemoUrl-${index}`}>
              Đường dẫn Live Demo / Repository (Không bắt buộc)
            </label>
            <input
              id={`liveDemoUrl-${index}`}
              placeholder="https://demo.example.com"
              {...register(`projects.${index}.liveDemoUrl`)}
            />
            {errors.projects?.[index]?.liveDemoUrl && (
              <p className="error">{errors.projects[index]?.liveDemoUrl?.message}</p>
            )}
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() =>
          appendProject({ title: "", content: "", projectDescription: "", liveDemoUrl: "" })
        }
        style={{
          justifySelf: "start",
          padding: "8px 16px",
          borderRadius: "10px",
          border: "1px dashed #0095f6",
          background: "#ebf5fe",
          color: "#0095f6",
          fontWeight: 700,
          fontSize: "13px",
          cursor: "pointer",
        }}
      >
        + Thêm dự án tiêu biểu
      </button>
    </fieldset>
  );
}
