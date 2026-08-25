/**
 * @file useMentorRegistration.ts
 * @description Custom React Hook quản lý dữ liệu biểu mẫu Đăng ký / Cập nhật Hồ sơ Mentor (React Hook Form & Yup).
 */

'use client';

import type { SaveMentorProfileRequest } from '@/models/auth';

import { ApiClientError } from '@/models/apiClient';

import {
  mentorProfileSchema,
  type MentorProfileFormValues,
} from '@/models/schemas/mentorProfileSchema';
import { mentorProfileRepo } from '@/repositories/mentorProfileRepo';
import { yupResolver } from '@hookform/resolvers/yup';
import { useEffect, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';

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
  const [isLoading, setIsLoading] = useState(true);
  const [isExistingProfile, setIsExistingProfile] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedProofFile, setSelectedProofFile] = useState<File | null>(null);

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

  const subjectFieldsArray = useFieldArray({
    control,
    name: 'subjectResults',
  });

  const projectFieldsArray = useFieldArray({
    control,
    name: 'projects',
  });

  const achievementFieldsArray = useFieldArray({
    control,
    name: 'achievements',
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
            headline: profile.headline || '',
            expertiseDescription: profile.expertiseDescription || '',
            isAvailable: profile.isAvailable ?? true,
            phoneNumber: profile.phoneNumber || '',
            githubUrl: profile.githubUrl || '',
            portfolioUrl: profile.portfolioUrl || '',
            foundationSupportLevel: profile.foundationSupportLevel || (undefined as any),
            outputReviewSupportLevel: profile.outputReviewSupportLevel || (undefined as any),
            directionSupportLevel: profile.directionSupportLevel || (undefined as any),
            minimumBookingLeadTimeMinutes:
              profile.minimumBookingLeadTimeMinutes || (undefined as any),
            maximumBookingHorizonDays: profile.maximumBookingHorizonDays || (undefined as any),
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
            agreeTerms: false,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Xử lý Submit theo quy trình chuẩn:
   *  1. POST /api/me/mentor-verification/request (Mở hồ sơ bắt đầu xác thực)
   *  2. PUT /api/me/mentor-profile (Cập nhật thông tin profile mentor)
   *  3. POST /api/me/mentor-projects (Tạo từng dự án tiêu biểu)
   *  4. POST /api/me/mentor-achievements (Tạo từng giải thưởng)
   *  5. Upload file minh chứng:
   *     - POST /api/me/mentor-verification/documents/upload-intents (Tạo URL upload)
   *     - Upload binary file lên URL storage
   *     - POST /api/me/mentor-verification/documents (Xác nhận minh chứng)
   *  6. POST /api/me/mentor-verification/submit (Nộp hồ sơ cho admin duyệt)
   */
  const onSubmit = async (values: MentorProfileFormValues) => {
    setServerError(null);
    setSuccessMessage(null);

    if (!selectedProofFile) {
      setServerError(
        'Vui lòng chọn file minh chứng Sinh viên / Cựu sinh viên FPTU trước khi nộp hồ sơ.',
      );
      return;
    }

    try {
      // 1. Mở hồ sơ bắt đầu xác thực mentor
      try {
        await mentorProfileRepo.requestVerification();
      } catch {
        // Nếu đã mở trước đó thì tiếp tục luồng
      }

      // 2. Lưu thông tin hồ sơ mentor
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
        bookingTimezone: 'Asia/Ho_Chi_Minh',
        subjectResults: (values.subjectResults || []).map((s) => ({
          subjectCode: s.subjectCode,
          subjectName: s.subjectName,
          scoreValue: Number(s.scoreValue),
        })),
      };

      await mentorProfileRepo.save(payload);

      // 3. Lưu danh sách dự án tiêu biểu
      if (values.projects && values.projects.length > 0) {
        for (const proj of values.projects) {
          await mentorProfileRepo.createProject({
            title: proj.title,
            content: proj.content,
            projectDescription: proj.projectDescription || undefined,
            liveDemoUrl: proj.liveDemoUrl || undefined,
          });
        }
      }

      // 4. Lưu danh sách học vấn/thành tích
      if (values.achievements && values.achievements.length > 0) {
        for (const ach of values.achievements) {
          await mentorProfileRepo.createAchievement({
            title: ach.title,
            awardDescription: ach.awardDescription,
            achievedAt: ach.achievedAt,
            productHeader: ach.productHeader,
            productDescription: ach.productDescription,
            demoUrl: ach.demoUrl || undefined,
          });
        }
      }

      // 5. Upload & Xác nhận file minh chứng FPTU
      const uploadIntent = await mentorProfileRepo.createUploadIntent({
        filename: selectedProofFile.name,
        contentType: selectedProofFile.type || 'application/octet-stream',
        sizeBytes: selectedProofFile.size,
      });

      await mentorProfileRepo.uploadFileToUrl(
        uploadIntent.uploadUrl,
        selectedProofFile,
        uploadIntent.requiredHeaders,
      );

      await mentorProfileRepo.confirmDocument({
        documentType: 'FPTU_AFFILIATION_PROOF',
        uploadIntentId: uploadIntent.uploadIntentId,
      });

      // 6. Nộp hồ sơ mentor lên cho admin duyệt (POST /api/me/mentor-verification/submit)
      await mentorProfileRepo.submitVerification({
        submitNote: 'Nộp hồ sơ xác thực Mentor',
        termsAccepted: Boolean(values.agreeTerms),
      });

      setIsExistingProfile(true);
      setSuccessMessage('Nộp hồ sơ Mentor thành công! Hồ sơ của bạn đã được gửi cho Admin duyệt.');
    } catch (err) {
      if (err instanceof ApiClientError) {
        setServerError(err.message || 'Lỗi nộp hồ sơ từ máy chủ.');
      } else {
        setServerError('Có lỗi xảy ra trong quá trình kết nối máy chủ.');
      }
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
    serverError,
    successMessage,
    selectedProofFile,
    setSelectedProofFile,
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
