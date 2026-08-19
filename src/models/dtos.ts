/**
 * @file dtos.ts
 * @description Định nghĩa các đối tượng truyền tải dữ liệu (Data Transfer Objects) dành cho mock repositories và form payload.
 */

import type { Booking, Comment, Post, User } from "./entities";

/** Form payload đăng nhập bằng email/password */
export interface LoginRequest {
  email: string;
  password: string;
}

/** Phản hồi đăng nhập thành công từ mock auth repository */
export interface LoginResponse {
  user: User;
  accessToken: string;
}

/** Payload tạo yêu cầu đặt lịch hẹn với Mentor */
export interface CreateBookingRequest {
  mentorId: string;
  startsAt: string;
}

/** Phản hồi thông tin chi tiết bài viết kèm danh sách bình luận */
export interface PostDetailResponse {
  post: Post;
  comments: Comment[];
}

/** Cấu trúc phản hồi API mẫu cho mock repositories */
export type ApiResponse<T> = { data: T; message?: string };
