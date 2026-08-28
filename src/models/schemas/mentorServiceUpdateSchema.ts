/**
 * @file mentorServiceUpdateSchema.ts
 * @description Validation cho payload cập nhật dịch vụ mentoring theo API contract.
 */

import * as yup from 'yup';

export const mentorServiceUpdateSchema = yup.object({
  title: yup.string().trim().required('Vui lòng nhập tên dịch vụ.').max(200),
  description: yup.string().trim().required('Vui lòng nhập mô tả.').max(1000),
  expectedOutcome: yup.string().trim().required('Vui lòng nhập kết quả mong đợi.').max(1000),
  isFree: yup.boolean().required(),
  priceScoin: yup.number().required().integer().min(0).max(45000000),
  maintainPostSessionChat: yup.boolean().required(),
});

export type MentorServiceUpdateFormValues = yup.InferType<typeof mentorServiceUpdateSchema>;
