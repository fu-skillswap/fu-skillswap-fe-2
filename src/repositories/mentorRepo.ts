/**
 * @file mentorRepo.ts
 * @description Repository quản lý danh sách Mentor và tạo/truy xuất thông tin Lịch hẹn (Booking Repository) cho môi trường demo.
 */

import type { Booking, Mentor } from '@/models/entities';
import { mergeMentors } from '@/data/demoMentors';

/** Danh sách mentor tĩnh khởi tạo ban đầu */
const mentors: Mentor[] = [
  {
    id: 'm-1',
    name: 'Nguyễn Lan',
    expertise: ['React', 'TypeScript'],
    bio: 'Frontend developer, yêu thích hỗ trợ sinh viên xây portfolio.',
    rating: 4.9,
  },
  {
    id: 'm-2',
    name: 'Trần Đức',
    expertise: ['UI/UX', 'Figma'],
    bio: 'Product designer với 4 năm kinh nghiệm làm sản phẩm số.',
    rating: 4.8,
  },
];

/** Mảng lưu trữ các lịch hẹn đã tạo trong phiên */
const bookings: Booking[] = [];

export const mentorRepo = {
  /**
   * Lấy danh sách toàn bộ các Chuyên gia / Mentor (gộp dữ liệu tĩnh và dữ liệu demo mở rộng).
   * @returns Promise chứa mảng danh sách Mentor (`Mentor[]`)
   */
  async list(): Promise<Mentor[]> {
    return mergeMentors(mentors);
  },

  /**
   * Tạo lịch hẹn mới giữa Mentee và Mentor.
   * @param mentorId - ID của Mentor được đặt lịch
   * @param startsAt - Thời điểm bắt đầu buổi tư vấn (ISO String)
   * @returns Promise chứa thông tin Lịch hẹn đã tạo
   */
  async createBooking(mentorId: string, startsAt: string): Promise<Booking> {
    const booking: Booking = {
      id: crypto.randomUUID(),
      mentorId,
      menteeId: 'u-1',
      startsAt,
      status: 'confirmed',
    };
    bookings.push(booking);
    return booking;
  },

  /**
   * Lấy danh sách tất cả các lịch hẹn đã được đặt.
   * @returns Promise chứa mảng danh sách lịch hẹn (`Booking[]`)
   */
  async listBookings(): Promise<Booking[]> {
    return bookings;
  },
};
