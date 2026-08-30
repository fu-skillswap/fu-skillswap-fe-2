/**
 * @file mentorRepo.ts
 * @description Repository quản lý danh sách Mentor (kết nối Backend API GET /api/mentors) và tạo/truy xuất thông tin Lịch hẹn (Booking).
 */

import type { PublicAvailabilitySlotResponse } from '@/models/auth';
import type { Booking, Mentor } from '@/models/entities';
import { apiClient } from '@/models/apiClient';

/** Parameters tùy chọn cho API GET /api/mentors */
export interface GetMentorsQuery {
  page?: number | string;
  size?: number | string;
  sortBy?: string;
  direction?: string;
  keyword?: string;
  campusId?: string;
  specializationId?: string;
}

/** Chuyển đổi đối tượng query sang query string (URLSearchParams) */
function queryString(query: GetMentorsQuery) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  });
  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

/** Mapping dữ liệu Mentor từ Backend DTO (chứa identity, mentoring, evidence) về Entity Mentor chuẩn của Frontend */
export function mapApiMentorToEntity(raw: any): Mentor {
  if (!raw || typeof raw !== 'object') {
    return {
      id: '',
      name: 'Mentor',
      expertise: [],
      bio: '',
      rating: null,
    };
  }

  const identity = raw.identity || raw.mentor?.identity || {};
  const mentoring = raw.mentoring || raw.mentor?.mentoring || {};
  const evidence = raw.evidence || raw.mentor?.evidence || {};
  const education = evidence.education || {};
  const reputation = raw.reputation || raw.mentor?.reputation || {};

  const mentorUserId = String(
    identity.mentorUserId ||
      raw.mentorUserId ||
      raw.id ||
      raw.userId ||
      raw.publicId ||
      raw.mentor?.mentorUserId ||
      raw.mentor?.id ||
      '',
  );
  const id = mentorUserId;
  const name = String(
    identity.displayName ||
      raw.displayName ||
      raw.name ||
      raw.fullName ||
      raw.mentor?.displayName ||
      raw.mentor?.name ||
      'Mentor',
  );
  const avatarUrl =
    identity.avatarUrl ??
    raw.avatarUrl ??
    raw.avatar ??
    raw.mentor?.avatarUrl ??
    raw.mentor?.avatar ??
    null;

  const headline =
    identity.headline ||
    raw.headline ||
    raw.mentor?.headline ||
    raw.mentor?.identity?.headline ||
    undefined;

  const isVerified =
    identity.isVerified ??
    raw.isVerified ??
    raw.mentor?.isVerified ??
    raw.mentor?.identity?.isVerified ??
    false;

  const bio = String(
    mentoring.expertiseDescription ||
      raw.expertiseDescription ||
      raw.bio ||
      raw.about ||
      raw.mentor?.mentoring?.expertiseDescription ||
      raw.mentor?.bio ||
      headline ||
      '',
  );

  let expertise: string[] = [];
  if (education.specializationName || education.programName) {
    if (education.specializationName) expertise.push(String(education.specializationName));
    if (education.programName && education.programName !== education.specializationName) {
      expertise.push(String(education.programName));
    }
  } else if (raw.mentor?.evidence?.specializationName || raw.mentor?.evidence?.programName) {
    const me = raw.mentor.evidence;
    if (me.specializationName) expertise.push(String(me.specializationName));
    if (me.programName && me.programName !== me.specializationName) {
      expertise.push(String(me.programName));
    }
  }

  if (expertise.length === 0) {
    const rawExpertise = raw.expertise || raw.mentor?.expertise;
    const rawSkills = raw.skills || raw.mentor?.skills;
    const rawSpecs = raw.specializations || raw.mentor?.specializations;

    if (Array.isArray(rawExpertise)) {
      expertise = rawExpertise.map(String);
    } else if (Array.isArray(rawSkills)) {
      expertise = rawSkills.map(String);
    } else if (Array.isArray(rawSpecs)) {
      expertise = rawSpecs.map((s: any) =>
        typeof s === 'string' ? s : s?.name || s?.title || String(s),
      );
    } else if (raw.specializationName || raw.mentor?.specializationName) {
      expertise = [String(raw.specializationName || raw.mentor?.specializationName)];
    } else if (headline) {
      expertise = [String(headline)];
    }
  }

  const organization =
    education.campusName ||
    education.programName ||
    evidence.campusName ||
    evidence.programName ||
    raw.organization ||
    raw.company ||
    raw.mentor?.evidence?.campusName ||
    raw.mentor?.organization ||
    undefined;

  const rawRating =
    reputation.ratingAverage ??
    raw.ratingAverage ??
    raw.rating ??
    raw.averageRating ??
    identity.ratingAverage ??
    identity.rating ??
    raw.mentor?.ratingAverage ??
    raw.mentor?.rating ??
    raw.mentor?.averageRating;

  const rating = typeof rawRating === 'number' ? rawRating : null;

  const rawReviewCount =
    reputation.reviewCount ??
    raw.reviewCount ??
    raw.totalReviews ??
    raw.mentor?.reviewCount ??
    raw.mentor?.totalReviews;

  const reviewCount = typeof rawReviewCount === 'number' ? rawReviewCount : undefined;

  const rawStartingPrice =
    raw.startingPrice ??
    raw.minPrice ??
    raw.priceScoin ??
    raw.mentor?.startingPrice ??
    raw.mentor?.minPrice ??
    raw.mentor?.priceScoin;

  const startingPrice = typeof rawStartingPrice === 'number' ? rawStartingPrice : undefined;

  const category = raw.category || raw.mentor?.category || undefined;

  return {
    id,
    mentorUserId,
    name,
    avatarUrl,
    headline,
    bio,
    expertise,
    organization,
    isVerified,
    rating,
    reviewCount,
    startingPrice,
    category,
  };
}

/** Mảng lưu trữ các lịch hẹn đã tạo trong phiên */
const bookings: Booking[] = [];

export const mentorRepo = {
  /**
   * Lấy danh sách Chuyên gia / Mentor từ Backend API GET /api/mentors.
   * @param query - Các tham số tìm kiếm/lọc tùy chọn (keyword, campusId, specializationId, page, size,...)
   * @returns Promise chứa mảng danh sách Mentor (`Mentor[]`)
   */
  async list(query: GetMentorsQuery = {}): Promise<Mentor[]> {
    try {
      const res = await apiClient<any>(`/api/mentors${queryString(query)}`);
      let list: any[] = [];
      if (Array.isArray(res)) {
        list = res;
      } else if (res && Array.isArray(res.content)) {
        list = res.content;
      } else if (res && Array.isArray(res.items)) {
        list = res.items;
      } else if (res && Array.isArray(res.data)) {
        list = res.data;
      }
      return list.map(mapApiMentorToEntity);
    } catch {
      return [];
    }
  },

  /**
   * Lấy danh sách availability slots còn hiển thị của Mentor (GET /api/mentors/{mentorUserId}/availability-slots)
   * @param mentorUserId - UUID ID của Mentor
   * @param query - Optional fromDate và toDate (ISO String YYYY-MM-DD)
   */
  async getAvailabilitySlots(
    mentorUserId: string,
    query?: { fromDate?: string; toDate?: string },
  ): Promise<PublicAvailabilitySlotResponse[]> {
    try {
      const params = new URLSearchParams();
      if (query?.fromDate) params.set('fromDate', query.fromDate);
      if (query?.toDate) params.set('toDate', query.toDate);
      const qs = params.toString() ? `?${params.toString()}` : '';

      const res = await apiClient<any>(`/api/mentors/${mentorUserId}/availability-slots${qs}`);
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.data)) return res.data;
      return [];
    } catch {
      return [];
    }
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
