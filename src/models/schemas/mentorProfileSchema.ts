/**
 * @file mentorProfileSchema.ts
 * @description Schema validation biểu mẫu Đăng ký / Cập nhật Hồ sơ Mentor (Mentor Profile Schema) bằng Yup.
 */

import * as yup from "yup";

const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;

export const mentorSubjectSchema = yup.object().shape({
  subjectCode: yup.string().trim().required("Mã môn học là bắt buộc."),
  subjectName: yup.string().trim().required("Tên môn học là bắt buộc."),
  scoreValue: yup
    .number()
    .transform((value, originalValue) =>
      originalValue === "" || Number.isNaN(value) ? undefined : value,
    )
    .typeError("Vui lòng nhập điểm số hợp lệ.")
    .required("Vui lòng nhập điểm số.")
    .min(0, "Điểm tối thiểu là 0.")
    .max(10, "Điểm tối đa là 10."),
});

export const mentorProjectSchema = yup.object().shape({
  title: yup.string().trim().required("Tên dự án là bắt buộc."),
  content: yup.string().trim().required("Vui lòng nhập vai trò hoặc điểm nổi bật của dự án."),
  projectDescription: yup.string().trim().optional(),
  liveDemoUrl: yup
    .string()
    .trim()
    .transform((value) => (value === "" ? undefined : value))
    .url("URL Live Demo không hợp lệ.")
    .optional(),
});

export const mentorAchievementSchema = yup.object().shape({
  title: yup.string().trim().required("Tên giải thưởng / thành tích là bắt buộc."),
  awardDescription: yup.string().trim().required("Vui lòng nhập mô tả giải thưởng hoặc thành tích."),
  achievedAt: yup.string().trim().required("Vui lòng chọn thời điểm đạt được."),
  productHeader: yup.string().trim().required("Vui lòng nhập tiêu đề sản phẩm / case study."),
  productDescription: yup.string().trim().required("Vui lòng nhập mô tả sản phẩm / case study."),
  demoUrl: yup
    .string()
    .trim()
    .transform((value) => (value === "" ? undefined : value))
    .url("URL Demo / Chứng nhận không hợp lệ.")
    .optional(),
});

export const mentorProfileSchema = yup.object().shape({
  headline: yup
    .string()
    .trim()
    .required("Vui lòng nhập tiêu đề vị trí / chuyên môn.")
    .min(5, "Tiêu đề phải có ít nhất 5 ký tự.")
    .max(120, "Tiêu đề tối đa 120 ký tự."),
  expertiseDescription: yup
    .string()
    .trim()
    .required("Vui lòng nhập mô tả chi tiết kinh nghiệm chuyên môn.")
    .min(10, "Mô tả kinh nghiệm tối thiểu 10 ký tự.")
    .max(1500, "Mô tả tối đa 1500 ký tự."),
  isAvailable: yup
    .boolean()
    .oneOf([true], "Vui lòng xác nhận sẵn sàng nhận lịch tư vấn từ Mentee.")
    .required("Vui lòng xác nhận sẵn sàng nhận lịch tư vấn từ Mentee."),
  phoneNumber: yup
    .string()
    .trim()
    .required("Vui lòng nhập số điện thoại liên hệ.")
    .matches(phoneRegex, "Số điện thoại không đúng định dạng (VD: 0912345678)."),
  githubUrl: yup
    .string()
    .trim()
    .transform((value) => (value === "" ? undefined : value))
    .url("URL GitHub không hợp lệ.")
    .optional(),
  portfolioUrl: yup
    .string()
    .trim()
    .transform((value) => (value === "" ? undefined : value))
    .url("URL Portfolio không hợp lệ.")
    .optional(),
  foundationSupportLevel: yup
    .number()
    .transform((value, originalValue) =>
      originalValue === "" || Number.isNaN(value) ? undefined : value,
    )
    .typeError("Vui lòng chọn mức độ căn bản.")
    .required("Vui lòng chọn mức độ căn bản.")
    .min(1, "Từ 1 đến 5.")
    .max(5, "Từ 1 đến 5."),
  outputReviewSupportLevel: yup
    .number()
    .transform((value, originalValue) =>
      originalValue === "" || Number.isNaN(value) ? undefined : value,
    )
    .typeError("Vui lòng chọn mức độ review đồ án.")
    .required("Vui lòng chọn mức độ review đồ án.")
    .min(1, "Từ 1 đến 5.")
    .max(5, "Từ 1 đến 5."),
  directionSupportLevel: yup
    .number()
    .transform((value, originalValue) =>
      originalValue === "" || Number.isNaN(value) ? undefined : value,
    )
    .typeError("Vui lòng chọn mức độ định hướng.")
    .required("Vui lòng chọn mức độ định hướng.")
    .min(1, "Từ 1 đến 5.")
    .max(5, "Từ 1 đến 5."),
  minimumBookingLeadTimeMinutes: yup
    .number()
    .transform((value, originalValue) =>
      originalValue === "" || Number.isNaN(value) ? undefined : value,
    )
    .typeError("Vui lòng nhập thời gian báo trước tối thiểu.")
    .required("Vui lòng nhập thời gian báo trước tối thiểu (phút).")
    .min(15, "Tối thiểu 15 phút."),
  maximumBookingHorizonDays: yup
    .number()
    .transform((value, originalValue) =>
      originalValue === "" || Number.isNaN(value) ? undefined : value,
    )
    .typeError("Vui lòng nhập hạn đặt trước tối đa.")
    .required("Vui lòng nhập hạn đặt trước tối đa (ngày).")
    .min(1, "Tối thiểu 1 ngày."),
  subjectResults: yup
    .array()
    .of(mentorSubjectSchema)
    .optional()
    .default([]),
  projects: yup
    .array()
    .of(mentorProjectSchema)
    .optional()
    .default([]),
  achievements: yup
    .array()
    .of(mentorAchievementSchema)
    .optional()
    .default([]),
  agreeTerms: yup
    .boolean()
    .oneOf([true], "Bạn phải đồng ý với điều khoản vận hành của SkillSwap để nộp hồ sơ.")
    .required("Bạn phải đồng ý với điều khoản vận hành của SkillSwap để nộp hồ sơ."),
});

export type MentorProfileFormValues = yup.InferType<typeof mentorProfileSchema>;
