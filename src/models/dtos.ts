import type { Booking, Comment, Post, User } from "./entities";

export interface LoginRequest { email: string; password: string; }
export interface LoginResponse { user: User; accessToken: string; }
export interface CreateBookingRequest { mentorId: string; startsAt: string; }
export interface PostDetailResponse { post: Post; comments: Comment[]; }
export type ApiResponse<T> = { data: T; message?: string };
