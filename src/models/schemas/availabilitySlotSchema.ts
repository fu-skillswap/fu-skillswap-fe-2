/**
 * @file availabilitySlotSchema.ts
 * @description Yup schema cho biểu mẫu tạo direct availability slot của Mentor.
 */

import * as yup from 'yup';

export const availabilitySlotSchema = yup.object({
  date: yup.string().required('Vui lòng chọn ngày.'),
  startTime: yup.string().required('Vui lòng chọn giờ bắt đầu.'),
  endTime: yup.string().required('Vui lòng chọn giờ kết thúc.'),
  serviceIds: yup
    .array(yup.string().required())
    .min(1, 'Vui lòng chọn ít nhất một dịch vụ.')
    .required(),
  note: yup.string().max(200, 'Ghi chú không được vượt quá 200 ký tự.').defined(),
});

export type AvailabilitySlotFormValues = yup.InferType<typeof availabilitySlotSchema>;
