/**
 * @file MentorRegistrationView.tsx
 * @description Giao diện Đăng ký / Cập nhật Hồ sơ Mentor (Mentor Registration View).
 * Đã refactor mô hình Clean Architecture: sử dụng sub-components cho từng Section.
 */

"use client";

import Link from "next/link";
import React from "react";
import { Button } from "@/components/ui/Button";
import { SelectOption } from "@/components/ui/SelectField";
import { useMentorRegistration } from "./useMentorRegistration";
import { BasicInfoSection } from "./components/BasicInfoSection";
import { SubjectResultsSection } from "./components/SubjectResultsSection";
import { SupportLevelsSection } from "./components/SupportLevelsSection";
import { FeaturedProjectsSection } from "./components/FeaturedProjectsSection";
import { AchievementsSection } from "./components/AchievementsSection";
import { BookingConfigSection } from "./components/BookingConfigSection";

const levelOptions: SelectOption[] = [
  { value: "1", label: "Mức 1" },
  { value: "2", label: "Mức 2" },
  { value: "3", label: "Mức 3" },
  { value: "4", label: "Mức 4" },
  { value: "5", label: "Mức 5" },
];

interface MentorRegistrationViewProps {
  /** Mã locale ngôn ngữ hiện tại */
  locale: string;
}

export function MentorRegistrationView({ locale }: MentorRegistrationViewProps) {
  const {
    register,
    control,
    watch,
    errors,
    isSubmitting,
    isLoading,
    isExistingProfile,
    serverError,
    successMessage,
    fields,
    append,
    remove,
    projectFields,
    appendProject,
    removeProject,
    achievementFields,
    appendAchievement,
    removeAchievement,
    submitProfile,
  } = useMentorRegistration();

  const isAvailable = watch("isAvailable");

  if (isLoading) {
    return (
      <main className="page-shell narrow">
        <div style={{ textAlign: "center", padding: "60px 0", color: "#64748b" }}>
          Đang tải dữ liệu hồ sơ Mentor...
        </div>
      </main>
    );
  }

  return (
    <main className="page-shell narrow">
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a", marginBottom: "6px" }}>
          {isExistingProfile ? "Cập nhật Hồ sơ Mentor" : "Đăng ký trở thành Mentor"}
        </h1>
        <p style={{ color: "#64748b", fontSize: "14px", margin: 0 }}>
          {isExistingProfile
            ? "Chỉnh sửa thông tin năng lực, kinh nghiệm chuyên môn và thời gian nhận lịch của bạn."
            : "Chia sẻ kinh nghiệm, chuyên môn và thiết lập thời gian nhận lịch tư vấn cho Mentee."}
        </p>
      </div>

      {serverError && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "10px",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#ef4444",
            fontSize: "14px",
            marginBottom: "20px",
          }}
        >
          {serverError}
        </div>
      )}

      {successMessage && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "10px",
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            color: "#16a34a",
            fontSize: "14px",
            marginBottom: "20px",
          }}
        >
          {successMessage}
        </div>
      )}

      <form onSubmit={submitProfile} className="figma-profile-form">
        {/* SECTION 1: THÔNG TIN CƠ BẢN */}
        <BasicInfoSection register={register} errors={errors} />

        {/* SECTION 2: DANH MỤC MÔN HỌC & ĐIỂM SỐ */}
        <SubjectResultsSection
          register={register}
          errors={errors}
          fields={fields}
          append={append}
          remove={remove}
        />

        {/* SECTION 3: MỨC ĐỘ HỖ TRỢ */}
        <SupportLevelsSection
          control={control}
          errors={errors}
          levelOptions={levelOptions}
        />

        {/* SECTION 4: DỰ ÁN TIÊU BIỂU */}
        <FeaturedProjectsSection
          register={register}
          errors={errors}
          projectFields={projectFields}
          appendProject={appendProject}
          removeProject={removeProject}
        />

        {/* SECTION 5: HỌC VẤN & GIẢI THƯỞNG NỔI BẬT */}
        <AchievementsSection
          register={register}
          errors={errors}
          achievementFields={achievementFields}
          appendAchievement={appendAchievement}
          removeAchievement={removeAchievement}
        />

        {/* SECTION 6: CẤU HÌNH ĐẶT LỊCH */}
        <BookingConfigSection
          register={register}
          errors={errors}
          isAvailable={isAvailable}
        />

        {/* ACTION BUTTONS */}
        <div className="mentor-actions-row">
          <Link
            href={`/${locale}/dashboard`}
            style={{
              padding: "10px 24px",
              borderRadius: "10px",
              border: "1px solid #cbd5e1",
              background: "#fff",
              color: "#475467",
              fontWeight: 700,
              fontSize: "14px",
              textDecoration: "none",
            }}
          >
            Hủy bỏ
          </Link>
          <Button type="submit" disabled={isSubmitting} style={{ padding: "12px 32px" }}>
            {isSubmitting
              ? "Đang lưu..."
              : isExistingProfile
                ? "Lưu cập nhật hồ sơ"
                : "Hoàn tất đăng ký Mentor"}
          </Button>
        </div>
      </form>
    </main>
  );
}
