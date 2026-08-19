export function validateComment(content: string): string | undefined {
  if (!content.trim()) return "Nội dung bình luận không được để trống.";
  if (content.length > 500) return "Bình luận tối đa 500 ký tự.";
}
