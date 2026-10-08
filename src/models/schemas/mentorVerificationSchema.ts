/**
 * @file mentorVerificationSchema.ts
 * @description Schema xác thực lý do từ chối / yêu cầu bổ sung hồ sơ mentor.
 */

import * as yup from 'yup';

export const MENTOR_DECISION_MESSAGE_MIN = 10;
export const MENTOR_DECISION_MESSAGE_MAX = 500;

/** Shared by the reject and request-revision dialogs: a main reason plus a message to the applicant. */
export const mentorDecisionSchema = yup.object({
  reason: yup.string().required('Vui lòng chọn lý do chính.'),
  message: yup
    .string()
    .trim()
    .required('Vui lòng nhập lời nhắn cho ứng viên.')
    .min(MENTOR_DECISION_MESSAGE_MIN, `Lời nhắn tối thiểu ${MENTOR_DECISION_MESSAGE_MIN} ký tự.`)
    .max(MENTOR_DECISION_MESSAGE_MAX, `Lời nhắn tối đa ${MENTOR_DECISION_MESSAGE_MAX} ký tự.`),
});

export type MentorDecisionForm = yup.InferType<typeof mentorDecisionSchema>;
