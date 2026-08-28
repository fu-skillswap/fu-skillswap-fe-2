/**
 * @file mentorServiceSchema.ts
 * @description Schema validation cho form tạo dịch vụ mentoring 1-1.
 */

import * as yup from 'yup';

export const mentorServiceSchema = yup.object({
  title: yup.string().trim().required('Vui lòng nhập tên khóa học.').max(200),
  description: yup.string().trim().required('Vui lòng nhập mô tả.').max(1000),
  expectedOutcome: yup.string().trim().required('Vui lòng nhập kết quả mong đợi.').max(1000),
  durationMinutes: yup.number().required('Vui lòng chọn thời lượng.').integer(),
  isFree: yup.boolean().required(),
  priceScoin: yup.number().required().integer().min(0),
  maintainPostSessionChat: yup.boolean().required(),
});

export type MentorServiceFormValues = yup.InferType<typeof mentorServiceSchema>;
