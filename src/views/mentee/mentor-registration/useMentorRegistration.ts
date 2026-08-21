/**
 * @file useMentorRegistration.ts
 * @description Custom React Hook quản lý dữ liệu biểu mẫu Đăng ký / Cập nhật Hồ sơ Mentor (React Hook Form & Yup).
 */

"use client";

import type { SaveMentorProfileRequest } from "@/models/auth";

import { ApiClientError } from "@/models/apiClient";

import {
  mentorProfileSchema,
  type MentorProfileFormValues,
} from "@/models/schemas/mentorProfileSchema";
import { mentorProfileRepo } from "@/repositories/mentorProfileRepo";
import { yupResolver } from "@hookform/resolvers/yup";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";

const defaultValues: MentorProfileFormValues = {
  headline: "",
  expertiseDescription: "",
  isAvailable: true,
  phoneNumber: "",
  githubUrl: "",
  portfolioUrl: "",
  foundationSupportLevel: undefined as any,
  outputReviewSupportLevel: undefined as any,
  directionSupportLevel: undefined as any,
  minimumBookingLeadTimeMinutes: undefined as any,
  maximumBookingHorizonDays: undefined as any,
  subjectResults: [],
  projects: [],
  achievements: [],
};

export function useMentorRegistration() {
  const [isLoading, setIsLoading] = useState(true);
  const [isExistingProfile, setIsExistingProfile] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const form = useForm<MentorProfileFormValues>({
    resolver: yupResolver(mentorProfileSchema) as any,
    defaultValues,
  });

  const {
    register,
    control,
    watch,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = form;

  const subjectFieldsArray = useFieldArray({
    control,
    name: "subjectResults",
  });

  const projectFieldsArray = useFieldArray({
    control,
    name: "projects",
  });

  const achievementFieldsArray = useFieldArray({
    control,
    name: "achievements",
  });

  /** Nạp dữ liệu Hồ sơ Mentor cũ (nếu có) khi component được mount */
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    mentorProfileRepo
      .get()
      .then((profile) => {
        if (!isMounted) return;
        if (profile && profile.exists) {
          setIsExistingProfile(true);
          reset({
            headline: profile.headline || "",
            expertiseDescription: profile.expertiseDescription || "",
            isAvailable: profile.isAvailable ?? true,
            phoneNumber: profile.phoneNumber || "",
            githubUrl: profile.githubUrl || "",
            portfolioUrl: profile.portfolioUrl || "",
            foundationSupportLevel: profile.foundationSupportLevel || (undefined as any),
            outputReviewSupportLevel: profile.outputReviewSupportLevel || (undefined as any),
            directionSupportLevel: profile.directionSupportLevel || (undefined as any),
            minimumBookingLeadTimeMinutes:
              profile.minimumBookingLeadTimeMinutes || (undefined as any),
            maximumBookingHorizonDays:
              profile.maximumBookingHorizonDays || (undefined as any),
            subjectResults:
              profile.subjectResults && profile.subjectResults.length > 0
                ? profile.subjectResults.map((s) => ({
                    subjectCode: s.subjectCode,
                    subjectName: s.subjectName,
                    scoreValue: s.scoreValue,
                  }))
                : [],
            projects: [],
            achievements: [],
          });
        } else {
          setIsExistingProfile(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsExistingProfile(false);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [reset]);

  /** Xử lý Submit dữ liệu về backend API PUT /api/me/mentor-profile & POST /api/me/mentor-projects & POST /api/me/mentor-achievements */
  const onSubmit = async (values: MentorProfileFormValues) => {
    setServerError(null);
    setSuccessMessage(null);

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
      subjectResults: (values.subjectResults || []).map((s) => ({
        subjectCode: s.subjectCode,
        subjectName: s.subjectName,
        scoreValue: Number(s.scoreValue),
      })),
    };

    try {
      await mentorProfileRepo.save(payload);
      if (values.projects && values.projects.length > 0) {
        await Promise.allSettled(
          values.projects.map((proj) =>
            mentorProfileRepo.createProject({
              title: proj.title,
              content: proj.content,
              projectDescription: proj.projectDescription || undefined,
              liveDemoUrl: proj.liveDemoUrl || undefined,
            }),
          ),
        );
      }

      if (values.achievements && values.achievements.length > 0) {
        await Promise.allSettled(
          values.achievements.map((ach) =>
            mentorProfileRepo.createAchievement({
              title: ach.title,
              awardDescription: ach.awardDescription || undefined,
              achievedAt: ach.achievedAt || undefined,
              productHeader: ach.productHeader || undefined,
              productDescription: ach.productDescription || undefined,
              demoUrl: ach.demoUrl || undefined,
            }),
          ),
        );
      }

      setIsExistingProfile(true);
      setSuccessMessage(
        isExistingProfile
          ? "Cập nhật hồ sơ Mentor thành công!"
          : "Đăng ký hồ sơ Mentor thành công!",
      );
    } catch (err) {
      if (err instanceof ApiClientError) {
        setServerError(err.message || "Lỗi lưu hồ sơ từ máy chủ.");
      } else {
        setServerError("Có lỗi xảy ra trong quá trình kết nối máy chủ.");
      }
    }
  };

  return {
    form,
    register,
    control,
    watch,
    errors,
    isSubmitting,
    isLoading,
    isExistingProfile,
    serverError,
    successMessage,
    fields: subjectFieldsArray.fields,
    append: subjectFieldsArray.append,
    remove: subjectFieldsArray.remove,
    projectFields: projectFieldsArray.fields,
    appendProject: projectFieldsArray.append,
    removeProject: projectFieldsArray.remove,
    achievementFields: achievementFieldsArray.fields,
    appendAchievement: achievementFieldsArray.append,
    removeAchievement: achievementFieldsArray.remove,
    submitProfile: handleSubmit(onSubmit),
  };
}
