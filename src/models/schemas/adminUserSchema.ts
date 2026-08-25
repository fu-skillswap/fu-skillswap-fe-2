/**
 * @file adminUserSchema.ts
 * @description Schema xác thực lý do khóa hoặc mở lại tài khoản người dùng.
 */

import * as yup from 'yup';

export const userAccountActionSchema = yup.object({
  reason: yup
    .string()
    .trim()
    .required('Vui lòng nhập lý do thực hiện thao tác.')
    .max(2000, 'Lý do tối đa 2.000 ký tự.'),
});

export type UserAccountActionForm = yup.InferType<typeof userAccountActionSchema>;
