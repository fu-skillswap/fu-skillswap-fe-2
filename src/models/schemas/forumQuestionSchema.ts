/**
 * @file forumQuestionSchema.ts
 * @description Quy tắc kiểm tra form đăng câu hỏi nhanh trên diễn đàn.
 */

import * as yup from 'yup';

export const forumQuestionSchema = yup.object({
  title: yup
    .string()
    .trim()
    .required('Vui lòng nhập tiêu đề câu hỏi.')
    .max(200, 'Tiêu đề tối đa 200 ký tự.'),
  content: yup
    .string()
    .trim()
    .required('Vui lòng mô tả vấn đề bạn đang gặp phải.')
    .max(5000, 'Mô tả tối đa 5000 ký tự.'),
  forumTopicId: yup.string().required('Vui lòng chọn chủ đề.'),
});

export type ForumQuestionFormValues = yup.InferType<typeof forumQuestionSchema>;
