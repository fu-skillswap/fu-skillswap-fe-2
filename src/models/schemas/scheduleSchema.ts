/**
 * @file scheduleSchema.ts
 * @description Định nghĩa Yup Schema validation cho form thêm lịch rảnh của Mentor.
 */

import * as yup from "yup";

export interface ScheduleFormValues {
  /** Ngày giờ khả dụng định dạng datetime-local */
  slot: string;
}

export const scheduleSchema = yup.object({
  slot: yup
    .string()
    .required("Vui lòng chọn ngày và giờ rảnh.")
    .test("valid-date", "Thời gian chọn không hợp lệ.", (value) =>
      Boolean(value && !isNaN(Date.parse(value))),
    ),
});
