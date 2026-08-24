/**
 * @file mentorVerificationSchema.ts
 * @description Schema xác thực lý do yêu cầu mentor bổ sung hồ sơ.
 */

import * as yup from 'yup';

export const requestMentorRevisionSchema = yup.object({
  note: yup
    .string()
    .trim()
    .required('Vui lòng nhập lý do yêu cầu bổ sung.')
    .max(2000, 'Lý do tối đa 2.000 ký tự.'),
});

export type RequestMentorRevisionForm = yup.InferType<typeof requestMentorRevisionSchema>;

export const rejectMentorVerificationSchema = yup.object({
  note: yup
    .string()
    .trim()
    .required('Vui lòng nhập lý do từ chối hồ sơ.')
    .max(2000, 'Lý do tối đa 2.000 ký tự.'),
});

export type RejectMentorVerificationForm = yup.InferType<typeof rejectMentorVerificationSchema>;
