/**
 * @file useMentorProfileHydration.ts
 * @description Sub-hook quản lý việc Nạp dữ liệu (Hydration) từ mentorProfileRepo khi mở biểu mẫu Đăng ký Mentor.
 */

"use client";

import { useEffect, useState } from "react";
import type { UseFormReset } from "react-hook-form";
import type { MentorVerificationResponse } from "@/models/auth";
import type { MentorProfileFormValues } from "@/models/schemas/mentorProfileSchema";
import { mentorProfileRepo } from "@/repositories/mentorProfileRepo";
import { useAuth } from "@/providers/AuthProvider";

export function useMentorProfileHydration(reset: UseFormReset<MentorProfileFormValues>) {
  const { isBootstrapping } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [isExistingProfile, setIsExistingProfile] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);
  const [verificationData, setVerificationData] = useState<MentorVerificationResponse | null>(null);

  const isPendingReview = applicationStatus === "PENDING_REVIEW";

  useEffect(() => {
    if (isBootstrapping) return;

    let isMounted = true;
    setIsLoading(true);

    async function loadData() {
      try {
        // 1. Tải tiến độ đăng ký, chi tiết xác thực, thông tin profile mentor, cùng danh sách dự án và giải thưởng
        const [progressData, verificationDetails, profileData, projectsData, achievementsData] = await Promise.all([
          mentorProfileRepo.getVerificationProgress().catch(() => null),
          mentorProfileRepo.getVerification().catch(() => null),
          mentorProfileRepo.get(true).catch(() => null),
          mentorProfileRepo.getProjects().catch(() => []),
          mentorProfileRepo.getAchievements().catch(() => []),
        ]);

        if (!isMounted) return;

        const currentStatus = progressData?.applicationStatus || verificationDetails?.status;
        if (currentStatus) {
          setApplicationStatus(currentStatus);
        }
        if (verificationDetails) {
          setVerificationData(verificationDetails);
        }

        const isSubmitted = currentStatus === "PENDING_REVIEW" || Boolean(verificationDetails?.submittedAt);

        // Nguồn dữ liệu profile: Ưu tiên profileData từ API mentor-profile, nếu không có mới dùng verificationDetails
        const profileSource: any = profileData?.exists ? profileData : verificationDetails?.profile || verificationDetails || profileData;
        if (profileData?.exists || isSubmitted) {
          setIsExistingProfile(true);
        } else {
          setIsExistingProfile(false);
        }

        if (profileSource) {
          reset({
            headline: profileSource.headline || "",
            expertiseDescription: profileSource.expertiseDescription || "",
            isAvailable: profileSource.isAvailable ?? true,
            phoneNumber: profileSource.phoneNumber || "",
            githubUrl: profileSource.githubUrl || "",
            portfolioUrl: profileSource.portfolioUrl || "",
            foundationSupportLevel: profileSource.foundationSupportLevel || (undefined as any),
            outputReviewSupportLevel: profileSource.outputReviewSupportLevel || (undefined as any),
            directionSupportLevel: profileSource.directionSupportLevel || (undefined as any),
            minimumBookingLeadTimeMinutes: profileSource.minimumBookingLeadTimeMinutes || (undefined as any),
            maximumBookingHorizonDays: profileSource.maximumBookingHorizonDays || (undefined as any),
            subjectResults:
              profileSource.subjectResults && profileSource.subjectResults.length > 0
                ? profileSource.subjectResults.map((s: any) => ({
                    subjectCode: s.subjectCode,
                    subjectName: s.subjectName,
                    scoreValue: s.scoreValue,
                  }))
                : [],
            projects:
              Array.isArray(projectsData) && projectsData.length > 0
                ? projectsData.map((p) => ({
                    id: p.projectId || p.id || "",
                    title: p.title || "",
                    content: p.content || "",
                    projectDescription: p.projectDescription || "",
                    liveDemoUrl: p.liveDemoUrl || "",
                  }))
                : [],
            achievements:
              Array.isArray(achievementsData) && achievementsData.length > 0
                ? achievementsData.map((a) => ({
                    id: a.achievementId || a.id || "",
                    title: a.title || "",
                    awardDescription: a.awardDescription || "",
                    achievedAt: a.achievedAt || "",
                    productHeader: a.productHeader || "",
                    productDescription: a.productDescription || "",
                    demoUrl: a.demoUrl || "",
                  }))
                : [],
            agreeTerms: isSubmitted,
          });
        }
      } catch (err) {
        console.warn("Lỗi nạp dữ liệu hồ sơ mentor:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadData();

    return () => {
      isMounted = false;
    };
  }, [isBootstrapping, reset]);

  return {
    isLoading,
    isExistingProfile,
    setIsExistingProfile,
    applicationStatus,
    setApplicationStatus,
    verificationData,
    isPendingReview,
  };
}
