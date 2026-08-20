/**
 * @file studentProfileSchema.ts
 * @description Schema validation hồ sơ sinh viên và quy trình onboarding (Student Profile Schema) bằng Yup.
 */

import * as yup from "yup";

/** Quy tắc kiểm tra tính hợp lệ biểu mẫu Hoàn thiện Hồ sơ sinh viên (Onboarding Step) */
export const studentOnboardingSchema = yup.object().shape({
  studentCode: yup
    .string()
    .trim()
    .required("Vui lòng nhập mã số sinh viên."),
  displayName: yup.string().trim().optional(),
  campusId: yup.string().required("Vui lòng chọn cơ sở / campus."),
  programId: yup.string().required("Vui lòng chọn ngành đào tạo."),
  specializationId: yup.string().required("Vui lòng chọn chuyên ngành."),
  semester: yup
    .number()
    .typeError("Học kỳ phải là số.")
    .required("Vui lòng chọn học kỳ.")
    .min(1, "Học kỳ từ 1 trở lên."),
  intakeYear: yup
    .number()
    .typeError("Năm nhập học phải là số.")
    .required("Vui lòng chọn khóa / năm nhập học.")
    .min(2000, "Năm nhập học không hợp lệ."),
  isAlumni: yup.boolean().default(false),
  graduationYear: yup.number().when("isAlumni", {
    is: true,
    then: (schema) =>
      schema
        .typeError("Năm tốt nghiệp phải là số.")
        .required("Vui lòng nhập năm tốt nghiệp.")
        .min(2000, "Năm tốt nghiệp không hợp lệ."),
    otherwise: (schema) => schema.optional().nullable(),
  }),
  bio: yup.string().trim().max(500, "Bio tối đa 500 ký tự.").optional(),
});

export type StudentOnboardingFormValues = yup.InferType<
  typeof studentOnboardingSchema
>;

/** Quy tắc kiểm tra tính hợp lệ biểu mẫu Chỉnh sửa Hồ sơ cá nhân */
export const editProfileSchema = yup.object().shape({
  displayName: yup.string().trim().optional(),
  studentCode: yup.string().trim().required("Mã số sinh viên không được để trống."),
  bio: yup.string().trim().max(500, "Bio tối đa 500 ký tự.").optional(),
});

export type EditProfileFormValues = yup.InferType<typeof editProfileSchema>;
