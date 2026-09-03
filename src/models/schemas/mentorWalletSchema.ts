import * as yup from 'yup';

export const payoutProfileSchema = yup.object({
  accountHolderName: yup
    .string()
    .trim()
    .required('Vui lòng nhập tên chủ tài khoản.')
    .max(120, 'Tên chủ tài khoản không được vượt quá 120 ký tự.'),
  bankName: yup
    .string()
    .trim()
    .required('Vui lòng nhập tên ngân hàng.')
    .max(120, 'Tên ngân hàng không được vượt quá 120 ký tự.'),
  bankCode: yup.string().trim().max(30, 'Mã ngân hàng không được vượt quá 30 ký tự.'),
  accountNumber: yup
    .string()
    .trim()
    .required('Vui lòng nhập số tài khoản.')
    .matches(/^\d{6,25}$/, 'Số tài khoản phải gồm từ 6 đến 25 chữ số.'),
  isDefault: yup.boolean().required(),
});

export type PayoutProfileFormValues = yup.InferType<typeof payoutProfileSchema>;

export const payoutRequestSchema = yup.object({
  amountScoin: yup
    .number()
    .typeError('Vui lòng nhập số S-coins muốn rút.')
    .integer('Số S-coins phải là số nguyên.')
    .min(1, 'Số tiền rút phải từ 1 S-coin.')
    .required('Vui lòng nhập số S-coins muốn rút.'),
  payoutProfileId: yup.string().required('Vui lòng chọn tài khoản nhận tiền.'),
  note: yup.string().trim().max(500, 'Ghi chú không được vượt quá 500 ký tự.'),
});

export type PayoutRequestFormValues = yup.InferType<typeof payoutRequestSchema>;
