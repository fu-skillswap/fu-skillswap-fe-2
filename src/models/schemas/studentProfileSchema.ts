/**
 * @file studentProfileSchema.ts
 * @description Schema validation hồ sơ sinh viên và quy trình onboarding (Student Profile Schema) bằng Yup.
 */

import * as yup from 'yup';

/**
 * FPT student code, mirrored from the backend `StudentProfileRequest.studentCode` pattern:
 * {H|S|D|Q|C}{E|S|A} + cohort 01–22 + 4 digits (case-insensitive), e.g. SE192621.
 */
export const STUDENT_CODE_PATTERN = /^[HSDQC][ESA](0[1-9]|1[0-9]|2[0-2])\d{4}$/i;
const STUDENT_CODE_MESSAGE = 'Mã số sinh viên không hợp lệ (ví dụ: SE192621).';

const studentCodeField = yup
  .string()
  .trim()
  .required('Vui lòng nhập mã số sinh viên.')
  .matches(STUDENT_CODE_PATTERN, STUDENT_CODE_MESSAGE);

const currentYear = new Date().getFullYear();

/** Quy tắc kiểm tra tính hợp lệ biểu mẫu Hoàn thiện Hồ sơ sinh viên (Onboarding Step) */
export const studentOnboardingSchema = yup.object().shape({
  studentCode: studentCodeField,
  displayName: yup
    .string()
    .trim()
    .required('Vui lòng nhập tên hiển thị.')
    .max(150, 'Tên hiển thị tối đa 150 ký tự.'),
  campusId: yup.string().required('Vui lòng chọn cơ sở.'),
  programId: yup.string().required('Vui lòng chọn ngành học phù hợp.'),
  // Required by the backend (PUT /api/me/student-profile) and must belong to the chosen program.
  specializationId: yup.string().required('Vui lòng chọn chuyên ngành.'),
  semester: yup
    .number()
    .typeError('Học kỳ phải là số.')
    .required('Vui lòng chọn học kỳ.')
    .min(0, 'Học kỳ từ 0 trở lên.')
    .max(9, 'Học kỳ tối đa là 9.'),
  intakeYear: yup
    .number()
    .typeError('Năm bắt đầu học tại FPT phải là số.')
    .required('Vui lòng nhập năm bắt đầu học tại FPT.')
    .min(2000, 'Năm bắt đầu học tại FPT không hợp lệ.')
    .max(currentYear, 'Năm bắt đầu học không được lớn hơn năm hiện tại.'),
  isAlumni: yup.boolean().default(false),
  graduationYear: yup.number().when('isAlumni', {
    is: true,
    then: (schema) =>
      schema
        .typeError('Năm tốt nghiệp phải là số.')
        .required('Vui lòng nhập năm tốt nghiệp.')
        .min(2000, 'Năm tốt nghiệp không hợp lệ.'),
    otherwise: (schema) => schema.optional().nullable(),
  }),
  bio: yup.string().trim().max(500, 'Phần giới thiệu tối đa 500 ký tự.').optional(),
});

export type StudentOnboardingFormValues = yup.InferType<typeof studentOnboardingSchema>;

/** Quy tắc kiểm tra tính hợp lệ biểu mẫu Chỉnh sửa Hồ sơ cá nhân */
export const editProfileSchema = yup.object().shape({
  displayName: yup.string().trim().optional(),
  studentCode: studentCodeField,
  bio: yup.string().trim().max(500, 'Bio tối đa 500 ký tự.').optional(),
});

export type EditProfileFormValues = yup.InferType<typeof editProfileSchema>;
