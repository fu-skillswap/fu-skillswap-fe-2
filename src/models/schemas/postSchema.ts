/**
 * @file postSchema.ts
 * @description Schema validation nội dung bài viết và bình luận cộng đồng (Post & Comment Schema).
 */

/**
 * Kiểm tra tính hợp lệ của nội dung bình luận (không để trống và không quá 500 ký tự).
 * @param content - Chuỗi nội dung bình luận
 * @returns Thông báo lỗi dạng string nếu không hợp lệ, hoặc undefined nếu hợp lệ
 */
export function validateComment(content: string): string | undefined {
  if (!content.trim()) return "Nội dung bình luận không được để trống.";
  if (content.length > 500) return "Bình luận tối đa 500 ký tự.";
}
