/**
 * @file SubjectResultsSection.tsx
 * @description Sub-component hiển thị Phần 2: Môn học chuyên môn trong Hồ sơ Mentor.
 */

"use client";

import React from "react";
import type { UseFormRegister, FieldErrors, FieldArrayWithId, UseFieldArrayAppend, UseFieldArrayRemove } from "react-hook-form";
import type { MentorProfileFormValues } from "@/models/schemas/mentorProfileSchema";

interface SubjectResultsSectionProps {
  register: UseFormRegister<MentorProfileFormValues>;
  errors: FieldErrors<MentorProfileFormValues>;
  fields: FieldArrayWithId<MentorProfileFormValues, "subjectResults", "id">[];
  append: UseFieldArrayAppend<MentorProfileFormValues, "subjectResults">;
  remove: UseFieldArrayRemove;
}

export function SubjectResultsSection({
  register,
  errors,
  fields,
  append,
  remove,
}: SubjectResultsSectionProps) {
  return (
    <fieldset
      className="card mentor-reg-card"
      style={{ border: "1px solid #e2e8f0", display: "grid", gap: "16px" }}
    >
      <h2 className="mentor-section-title">2. Môn học chuyên môn</h2>

      {fields.length === 0 && (
        <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
          Chưa có môn học nào được đăng ký (không bắt buộc). Nhấn nút bên dưới để thêm môn học nếu muốn.
        </p>
      )}

      {fields.map((field, index) => (
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
            <strong style={{ fontSize: "13px", color: "#334155" }}>Môn học #{index + 1}</strong>
            <button
              type="button"
              onClick={() => remove(index)}
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

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
            <div className="field">
              <label htmlFor={`subjectCode-${index}`}>
                Mã môn học <span className="required-asterisk">*</span>
              </label>
              <input
                id={`subjectCode-${index}`}
                placeholder="VD: PRJ301"
                {...register(`subjectResults.${index}.subjectCode`)}
              />
              {errors.subjectResults?.[index]?.subjectCode && (
                <p className="error">{errors.subjectResults[index]?.subjectCode?.message}</p>
              )}
            </div>

            <div className="field">
              <label htmlFor={`subjectName-${index}`}>
                Tên môn học <span className="required-asterisk">*</span>
              </label>
              <input
                id={`subjectName-${index}`}
                placeholder="VD: Java Web Application Development"
                {...register(`subjectResults.${index}.subjectName`)}
              />
              {errors.subjectResults?.[index]?.subjectName && (
                <p className="error">{errors.subjectResults[index]?.subjectName?.message}</p>
              )}
            </div>

            <div className="field">
              <label htmlFor={`scoreValue-${index}`}>
                Điểm số <span className="required-asterisk">*</span>
              </label>
              <input
                id={`scoreValue-${index}`}
                type="number"
                step="0.1"
                placeholder="VD: 8.5"
                {...register(`subjectResults.${index}.scoreValue`)}
              />
              {errors.subjectResults?.[index]?.scoreValue && (
                <p className="error">{errors.subjectResults[index]?.scoreValue?.message}</p>
              )}
            </div>
          </div>
        </div>
      ))}

      {errors.subjectResults && typeof errors.subjectResults.message === "string" && (
        <p className="error">{errors.subjectResults.message}</p>
      )}

      <button
        type="button"
        onClick={() =>
          append({ subjectCode: "", subjectName: "", scoreValue: undefined as any })
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
        + Thêm môn học hướng dẫn
      </button>
    </fieldset>
  );
}
