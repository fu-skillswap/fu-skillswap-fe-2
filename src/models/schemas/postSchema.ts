/**
 * @file postSchema.ts
 * @description Schema validation nội dung bài viết và bình luận cộng đồng (Post & Comment Schema) bằng Yup.
 */

import * as yup from "yup";

/** Quy tắc kiểm tra tính hợp lệ biểu mẫu gửi bình luận */
export const commentSchema = yup.object().shape({
  content: yup
    .string()
    .trim()
    .required("Nội dung bình luận không được để trống.")
    .max(500, "Bình luận tối đa 500 ký tự."),
});

/** Dữ liệu form nhập bình luận suy ra từ Yup Schema */
export type CommentFormValues = yup.InferType<typeof commentSchema>;
