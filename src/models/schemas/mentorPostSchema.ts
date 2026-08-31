/**
 * @file mentorPostSchema.ts
 * @description Quy tắc kiểm tra biểu mẫu bài viết Blog của Mentor.
 */

import * as yup from 'yup';

export const mentorPostSchema = yup.object({
  title: yup
    .string()
    .trim()
    .required('Vui lòng nhập tiêu đề bài viết.')
    .max(220, 'Tiêu đề tối đa 220 ký tự.'),
  excerpt: yup.string().trim().max(500, 'Mô tả ngắn tối đa 500 ký tự.').default(''),
  contentMarkdown: yup.string().trim().default(''),
  visibility: yup
    .mixed<'PUBLIC' | 'AUTHENTICATED' | 'BOOKED_MEMBERS'>()
    .oneOf(['PUBLIC', 'AUTHENTICATED', 'BOOKED_MEMBERS'])
    .required(),
});

export type MentorPostFormValues = yup.InferType<typeof mentorPostSchema>;
