/**
 * @file useMentorRegistration.ts
 * @description Custom React Hook Facade chính quản lý toàn bộ dữ liệu Màn hình Đăng ký Mentor (kết hợp các sub-hooks sử dụng mentorProfileRepo).
 */

'use client';

import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { ApiClientError } from "@/models/apiClient";
import type { SaveMentorProfileRequest } from "@/models/auth";
import {
  mentorProfileSchema,
  type MentorProfileFormValues,
} from "@/models/schemas/mentorProfileSchema";
import { mentorProfileRepo } from "@/repositories/mentorProfileRepo";
import { confirmAction, showSuccess, showError, showWarning } from "@/utils/toast";

import { useDocumentUpload } from "./hooks/useDocumentUpload";
import { useMentorProfileHydration } from "./hooks/useMentorProfileHydration";

const defaultValues: MentorProfileFormValues = {
  headline: '',
  expertiseDescription: '',
  isAvailable: true,
  phoneNumber: '',
  githubUrl: '',
  portfolioUrl: '',
  foundationSupportLevel: undefined as any,
  outputReviewSupportLevel: undefined as any,
  directionSupportLevel: undefined as any,
  minimumBookingLeadTimeMinutes: undefined as any,
  maximumBookingHorizonDays: undefined as any,
  subjectResults: [],
  projects: [],
  achievements: [],
  agreeTerms: false,
};

export function useMentorRegistration() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 1. Quản lý React Hook Form
  const form = useForm<MentorProfileFormValues>({
    resolver: yupResolver(mentorProfileSchema) as any,
    mode: 'onChange',
    defaultValues,
  });

  const {
    register,
    control,
    watch,
    handleSubmit,
    reset,
    formState: { errors, isValid, isSubmitting },
  } = form;

  // 2. Sub-hook Nạp dữ liệu cũ từ repositories khi mount (Hydration)
  const {
    isLoading,
    isExistingProfile,
    setIsExistingProfile,
    applicationStatus,
    setApplicationStatus,
    verificationData,
    isPendingReview,
    isApproved,
  } = useMentorProfileHydration(reset);

  // 3. Sub-hook Quản lý State File Minh chứng & Quy trình Upload S3/GCS
  const {
    selectedFptuFile,
    setSelectedFptuFile,
    selectedExpertiseFiles,
    onAddExpertiseFiles,
    onRemoveExpertiseFile,
    uploadAllDocuments,
  } = useDocumentUpload();

  // 4. Quản lý các Field Array (Môn học, Dự án, Giải thưởng)
  const subjectFieldsArray = useFieldArray({ control, name: "subjectResults" });
  const projectFieldsArray = useFieldArray({ control, name: "projects" });
  const achievementFieldsArray = useFieldArray({ control, name: "achievements" });

  // 5. Quy trình Submit biểu mẫu
  const onSubmit = async (values: MentorProfileFormValues) => {
    setServerError(null);
    setSuccessMessage(null);

    const hasExistingExpertise =
      (verificationData?.documents?.filter(
        (d) => d.documentType === 'EXPERTISE_PROOF' && d.isActive !== false,
      ).length ?? 0) > 0;

    if (!selectedFptuFile && !isExistingProfile) {
      const msg = "Vui lòng chọn file minh chứng Sinh viên / Cựu sinh viên FPTU trước khi nộp hồ sơ.";
      setServerError(msg);
      showWarning(msg);
      return;
    }

    if ((!selectedExpertiseFiles || selectedExpertiseFiles.length === 0) && !hasExistingExpertise && !isExistingProfile) {
      const msg = "Vui lòng chọn ít nhất 1 file chứng minh chuyên môn (EXPERTISE_PROOF).";
      setServerError(msg);
      showWarning(msg);
      return;
    }

    if (selectedExpertiseFiles.length > 3) {
      const msg = "Bạn chỉ được tải lên tối đa 3 file chứng minh chuyên môn.";
      setServerError(msg);
      showWarning(msg);
      return;
    }

    try {
      // 5.1. Mở hồ sơ bắt đầu xác thực mentor
      try {
        await mentorProfileRepo.requestVerification();
      } catch {
        // Nếu đã mở trước đó thì tiếp tục luồng
      }

      // 5.2. Lưu thông tin profile
      const payload: SaveMentorProfileRequest = {
        headline: values.headline,
        expertiseDescription: values.expertiseDescription,
        isAvailable: Boolean(values.isAvailable),
        phoneNumber: values.phoneNumber,
        githubUrl: values.githubUrl || undefined,
        portfolioUrl: values.portfolioUrl || undefined,
        foundationSupportLevel: Number(values.foundationSupportLevel),
        outputReviewSupportLevel: Number(values.outputReviewSupportLevel),
        directionSupportLevel: Number(values.directionSupportLevel),
        minimumBookingLeadTimeMinutes: Number(values.minimumBookingLeadTimeMinutes),
        maximumBookingHorizonDays: Number(values.maximumBookingHorizonDays),
        bookingTimezone: "Asia/Ho_Chi_Minh",
        subjectResults: (values.subjectResults || [])
          .filter(
            (s) =>
              s &&
              s.subjectCode?.trim() &&
              s.subjectName?.trim() &&
              s.scoreValue !== undefined &&
              s.scoreValue !== null &&
              !Number.isNaN(Number(s.scoreValue)),
          )
          .map((s) => ({
            subjectCode: s.subjectCode.trim(),
            subjectName: s.subjectName.trim(),
            scoreValue: Number(s.scoreValue),
          })),
      };

      await mentorProfileRepo.save(payload);

      // 5.3. Xử lý danh sách dự án tiêu biểu: PUT nếu có ID, POST nếu mới
      if (values.projects && values.projects.length > 0) {
        for (const proj of values.projects) {
          const projectId = proj.id || (proj as any).projectId;
          const projectData = {
            title: proj.title,
            content: proj.content,
            projectDescription: proj.projectDescription || undefined,
            liveDemoUrl: proj.liveDemoUrl || undefined,
          };

          if (projectId) {
            await mentorProfileRepo.updateProject(projectId, projectData);
          } else {
            await mentorProfileRepo.createProject(projectData);
          }
        }
      }

      // 5.4. Xử lý danh sách giải thưởng: PUT nếu có ID, POST nếu mới
      if (values.achievements && values.achievements.length > 0) {
        for (const ach of values.achievements) {
          const achievementId = ach.id || (ach as any).achievementId;
          const achievementData = {
            title: ach.title,
            awardDescription: ach.awardDescription,
            achievedAt: ach.achievedAt,
            productHeader: ach.productHeader,
            productDescription: ach.productDescription,
            demoUrl: ach.demoUrl || undefined,
          };

          if (achievementId) {
            await mentorProfileRepo.updateAchievement(achievementId, achievementData);
          } else {
            await mentorProfileRepo.createAchievement(achievementData);
          }
        }
      }

      // 5.5. Upload các file minh chứng qua sub-hook useDocumentUpload
      await uploadAllDocuments();

      // 5.6. Submit hồ sơ cho admin duyệt
      await mentorProfileRepo.submitVerification({
        submitNote: 'Nộp hồ sơ xác thực Mentor',
        termsAccepted: Boolean(values.agreeTerms),
      });

      const successMsg = "Nộp hồ sơ Mentor thành công! Hồ sơ của bạn đã được gửi cho Admin duyệt.";
      setIsExistingProfile(true);
      setApplicationStatus("PENDING_REVIEW");
      setSuccessMessage(successMsg);
      showSuccess(successMsg);
    } catch (err) {
      let errMsg = "Có lỗi xảy ra trong quá trình kết nối máy chủ.";
      if (err instanceof ApiClientError) {
        errMsg = err.message || "Lỗi nộp hồ sơ từ máy chủ.";
      }
      setServerError(errMsg);
      showError(errMsg);
    }
  };

  // 6. Xử lý Xóa Dự án tiêu biểu
  const handleRemoveProject = async (index: number) => {
    const confirmed = await confirmAction({
      title: "Xóa dự án tiêu biểu",
      message: "Bạn có chắc chắn muốn xóa dự án tiêu biểu này khỏi hệ thống không? Thao tác này không thể hoàn tác.",
      confirmText: "Xóa ngay",
      cancelText: "Hủy bỏ",
      variant: "danger",
    });
    if (!confirmed) return;

    const currentProjects = form.getValues("projects");
    const target = currentProjects?.[index];
    const projectId = (target as any)?.projectId || target?.id;

    if (projectId) {
      try {
        await mentorProfileRepo.deleteProject(projectId);
        showSuccess("Xóa dự án tiêu biểu thành công.");
      } catch (err) {
        const errMsg = err instanceof ApiClientError ? err.message || "Xóa dự án thất bại." : "Không thể xóa dự án trên máy chủ.";
        setServerError(errMsg);
        showError(errMsg);
        return;
      }
    } else {
      showSuccess("Đã xóa dự án.");
    }

    projectFieldsArray.remove(index);
  };

  // 7. Xử lý Xóa Học vấn / Giải thưởng
  const handleRemoveAchievement = async (index: number) => {
    const confirmed = await confirmAction({
      title: "Xóa học vấn / giải thưởng",
      message: "Bạn có chắc chắn muốn xóa học vấn / giải thưởng này khỏi hệ thống không? Thao tác này không thể hoàn tác.",
      confirmText: "Xóa ngay",
      cancelText: "Hủy bỏ",
      variant: "danger",
    });
    if (!confirmed) return;

    const currentAchievements = form.getValues("achievements");
    const target = currentAchievements?.[index];
    const achievementId = (target as any)?.achievementId || target?.id;

    if (achievementId) {
      try {
        await mentorProfileRepo.deleteAchievement(achievementId);
        showSuccess("Xóa học vấn/giải thưởng thành công.");
      } catch (err) {
        const errMsg = err instanceof ApiClientError ? err.message || "Xóa giải thưởng thất bại." : "Không thể xóa giải thưởng trên máy chủ.";
        setServerError(errMsg);
        showError(errMsg);
        return;
      }
    } else {
      showSuccess("Đã xóa học vấn/giải thưởng.");
    }

    achievementFieldsArray.remove(index);
  };

  // 8. Xử lý Rút Hồ sơ đăng ký Mentor
  const handleWithdraw = async () => {
    const confirmed = await confirmAction({
      title: "Rút hồ sơ đăng ký Mentor",
      message: "Bạn có chắc chắn muốn rút hồ sơ đăng ký làm Mentor không?",
      confirmText: "Rút hồ sơ",
      cancelText: "Hủy bỏ",
      variant: "warning",
    });
    if (!confirmed) return;

    try {
      await mentorProfileRepo.withdrawVerification();

      const progress = await mentorProfileRepo.getVerificationProgress().catch(() => null);
      const newStatus = progress?.applicationStatus || "DRAFT";

      setApplicationStatus(newStatus);
      const msg = "Đã rút hồ sơ đăng ký thành công. Hồ sơ hiện đã trở về trạng thái DRAFT để bạn chỉnh sửa.";
      setSuccessMessage(msg);
      showSuccess(msg);
    } catch (err) {
      let errMsg = "Không thể rút hồ sơ vào lúc này.";
      if (err instanceof ApiClientError) {
        errMsg = err.message || "Lỗi rút hồ sơ từ máy chủ.";
      }
      setServerError(errMsg);
      showError(errMsg);
    }
  };

  return {
    form,
    register,
    control,
    watch,
    errors,
    isValid,
    isSubmitting,
    isLoading,
    isExistingProfile,
    applicationStatus,
    isPendingReview,
    isApproved,
    verificationData,
    serverError,
    successMessage,
    selectedFptuFile,
    setSelectedFptuFile,
    selectedExpertiseFiles,
    onAddExpertiseFiles,
    onRemoveExpertiseFile,
    fields: subjectFieldsArray.fields,
    append: subjectFieldsArray.append,
    remove: subjectFieldsArray.remove,
    projectFields: projectFieldsArray.fields,
    appendProject: projectFieldsArray.append,
    removeProject: handleRemoveProject,
    achievementFields: achievementFieldsArray.fields,
    appendAchievement: achievementFieldsArray.append,
    removeAchievement: handleRemoveAchievement,
    submitProfile: handleSubmit(onSubmit),
    withdrawProfile: handleWithdraw,
  };
}

