import type { Booking, Mentor } from "@/models/entities";
import { mergeMentors } from "@/data/demoMentors";

const mentors: Mentor[] = [
  { id: "m-1", name: "Nguyễn Lan", expertise: ["React", "TypeScript"], bio: "Frontend developer, yêu thích hỗ trợ sinh viên xây portfolio.", rating: 4.9 },
  { id: "m-2", name: "Trần Đức", expertise: ["UI/UX", "Figma"], bio: "Product designer với 4 năm kinh nghiệm làm sản phẩm số.", rating: 4.8 },
];
const bookings: Booking[] = [];

export const mentorRepo = {
  async list(): Promise<Mentor[]> { return mergeMentors(mentors); },
  async createBooking(mentorId: string, startsAt: string): Promise<Booking> {
    const booking: Booking = { id: crypto.randomUUID(), mentorId, menteeId: "u-1", startsAt, status: "confirmed" };
    bookings.push(booking);
    return booking;
  },
  async listBookings(): Promise<Booking[]> { return bookings; },
};
