/**
 * @file mentorRepo.ts
 * @description Repository quản lý danh sách Mentor (kết nối Backend API GET /api/mentors) và tạo/truy xuất thông tin Lịch hẹn (Booking).
 */

import type {
  CandidateSegmentResponse,
  CreateBookingRequest,
  PublicAvailabilitySlotResponse,
  UserBookingItem,
} from '@/models/auth';
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

/**
 * Chuẩn hóa chuỗi thời gian sang định dạng chuẩn ISO-8601 (bỏ ký tự Z ở cuối).
 */
function formatIso8601(input?: string): string {
  if (!input) return new Date().toISOString().replace(/Z$/, '');
  try {
    const trimmed = input.trim();
    const hasOffset = /[+-]\d{2}:\d{2}$/.test(trimmed);
    const isoCandidate = trimmed.includes('Z') || hasOffset ? trimmed : `${trimmed}Z`;
    const d = new Date(isoCandidate);
    if (!isNaN(d.getTime())) {
      return d.toISOString().replace(/Z$/, '');
    }
  } catch {
    // fallback
  }
  return new Date().toISOString().replace(/Z$/, '');
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

// Cache cho các request đang xử lý (in-flight) để chống gọi lặp trùng lặp API khi re-render
const inFlightRequests = new Map<string, Promise<any>>();

function fetchDeduplicated<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
  if (inFlightRequests.has(key)) {
    return inFlightRequests.get(key) as Promise<T>;
  }
  const promise = fetchFn().finally(() => {
    setTimeout(() => inFlightRequests.delete(key), 800);
  });
  inFlightRequests.set(key, promise);
  return promise;
}

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
    const key = `slots_${mentorUserId}_${query?.fromDate || ''}_${query?.toDate || ''}`;
    return fetchDeduplicated(key, async () => {
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
    });
  },

  /**
   * Lấy candidate segments của một service trong một availability slot
   * API: GET /api/mentors/{mentorUserId}/availability-slots/{slotId}/candidates?serviceId={serviceId}
   * @param mentorUserId - UUID ID của Mentor (path param)
   * @param slotId - UUID ID của Parent Availability Slot (path param)
   * @param serviceId - UUID ID của Service (query param)
   */
  async getSlotCandidates(
    mentorUserId: string,
    slotId: string,
    serviceId: string,
  ): Promise<CandidateSegmentResponse[]> {
    const key = `candidates_${mentorUserId}_${slotId}_${serviceId}`;
    return fetchDeduplicated(key, async () => {
      try {
        const params = new URLSearchParams();
        if (serviceId) params.set('serviceId', serviceId);
        const qs = params.toString() ? `?${params.toString()}` : '';

        const res = await apiClient<any>(
          `/api/mentors/${mentorUserId}/availability-slots/${slotId}/candidates${qs}`,
        );
        let list: any[] = [];
        if (res && Array.isArray(res.candidateServiceSlots)) {
          list = res.candidateServiceSlots;
        } else if (res && res.data && Array.isArray(res.data.candidateServiceSlots)) {
          list = res.data.candidateServiceSlots;
        } else if (Array.isArray(res)) {
          list = res;
        } else if (res && Array.isArray(res.data)) {
          list = res.data;
        } else if (res && Array.isArray(res.items)) {
          list = res.items;
        } else if (res && Array.isArray(res.candidateSegments)) {
          list = res.candidateSegments;
        }

        return list.map((item, idx) => {
          const isSelectable = item.isSelectable ?? !item.blockedByAcceptedBooking;
          const isBlocked =
            !isSelectable ||
            Boolean(
              item.blockedByAcceptedBooking ||
                item.blockedBySameService ||
                item.blockedByDifferentService ||
                item.isBlocked ||
                item.blocked,
            );
          const reason =
            item.reasonIfBlocked ||
            item.bookingConflictNote ||
            item.blockedReason ||
            item.reason ||
            (isBlocked ? 'Khung giờ này đã bị khóa' : null);

          return {
            startTime: item.startTime || item.startAt || '',
            endTime: item.endTime || item.endAt || '',
            pendingCount: item.pendingCount ?? 0,
            remainingPendingQuota: item.remainingPendingQuota ?? 3,
            isSelectable,
            reasonIfBlocked: item.reasonIfBlocked || null,
            blockedByAcceptedBooking: Boolean(item.blockedByAcceptedBooking),
            blockingBookingId: item.blockingBookingId || null,
            blockingServiceId: item.blockingServiceId || null,
            blockingServiceTitle: item.blockingServiceTitle || null,
            blockedBySameService: Boolean(item.blockedBySameService),
            blockedByDifferentService: Boolean(item.blockedByDifferentService),
            bookingConflictNote: item.bookingConflictNote || null,
            segmentId: item.segmentId || item.candidateId || `${slotId}_candidate_${idx}`,
            candidateId: item.candidateId || `${slotId}_candidate_${idx}`,
            slotId,
            serviceId,
            title: item.title,
            isBlocked,
            blockedReason: reason,
          };
        });
      } catch {
        return [];
      }
    });
  },

  /**
   * Tải toàn bộ candidate slots của Mentor cho một dịch vụ cụ thể
   */
  async getMentorCandidates(
    mentorUserId: string,
    serviceId: string,
    query?: { fromDate?: string; toDate?: string },
  ): Promise<CandidateSegmentResponse[]> {
    const key = `mentor_candidates_${mentorUserId}_${serviceId}_${query?.fromDate || ''}_${query?.toDate || ''}`;
    return fetchDeduplicated(key, async () => {
      try {
        const parentSlots = await this.getAvailabilitySlots(mentorUserId, query);
        if (!parentSlots || parentSlots.length === 0) return [];

        const candidateResults = await Promise.all(
          parentSlots.map((s) => this.getSlotCandidates(mentorUserId, s.slotId, serviceId)),
        );
        return candidateResults.flat();
      } catch {
        return [];
      }
    });
  },

  /**
   * Tạo booking request mới ở trạng thái PENDING cho mentor service và availability slot mà mentee chọn.
   * API: POST /api/bookings
   */
  async createBookingRequest(payload: CreateBookingRequest, idempotencyKey?: string): Promise<UserBookingItem> {
    const normalizedPayload: CreateBookingRequest = {
      ...payload,
      startAt: formatIso8601(payload.startAt),
      ...(payload.legacySelectedEndTime ? { legacySelectedEndTime: formatIso8601(payload.legacySelectedEndTime) } : {}),
    };

    const key = idempotencyKey || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `idem_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);

    const res = await apiClient<any>('/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': key,
      },
      body: JSON.stringify(normalizedPayload),
    });

    const item = res?.data || res || {};
    return {
      id: item.id || item.bookingId || '',
      bookingId: item.bookingId || item.id || '',
      slotId: payload.slotId,
      serviceId: payload.serviceId,
      startAt: item.startAt || payload.startAt,
      endAt: item.endAt || payload.legacySelectedEndTime,
      startsAt: item.startAt || payload.startAt,
      endsAt: item.endAt || payload.legacySelectedEndTime,
      status: item.status || 'PENDING',
      learningGoalTitle: payload.learningGoalTitle || item.learningGoalTitle,
      learningGoalDescription: payload.learningGoalDescription || item.learningGoalDescription,
      createdAt: item.createdAt || new Date().toISOString(),
    };
  },

  /**
   * Lấy danh sách booking của mentee hiện tại từ API GET /api/bookings hoặc GET /api/me/bookings.
   * Hoàn toàn lấy dữ liệu thực từ backend API, không dùng fake/mock data.
   */
  async getMyBookings(): Promise<UserBookingItem[]> {
    try {
      let res: any;
      try {
        res = await apiClient<any>('/api/bookings');
      } catch {
        res = await apiClient<any>('/api/me/bookings');
      }

      let list: any[] = [];
      if (Array.isArray(res)) {
        list = res;
      } else if (res && Array.isArray(res.data)) {
        list = res.data;
      } else if (res && Array.isArray(res.content)) {
        list = res.content;
      } else if (res && Array.isArray(res.items)) {
        list = res.items;
      } else if (res && Array.isArray(res.bookings)) {
        list = res.bookings;
      }

      if (!list || list.length === 0) return [];

      return list.map((b) => {
        const mentorDisplayName =
          b.mentorDisplayName ||
          b.mentorName ||
          b.mentor?.displayName ||
          b.mentor?.name ||
          b.mentor?.fullName ||
          b.mentorUser?.displayName ||
          b.mentorUser?.name ||
          'Mentor';

        const serviceTitle =
          b.serviceTitle ||
          b.serviceName ||
          b.service?.title ||
          b.service?.name ||
          'Dịch vụ tư vấn Mentoring';

        const rawStartAt =
          b.selectedStartTime ||
          b.startAt ||
          b.startsAt ||
          b.startTime ||
          b.slot?.startTime ||
          b.slot?.startAt ||
          b.candidate?.startTime ||
          b.bookingDate;

        const rawEndAt =
          b.selectedEndTime ||
          b.endAt ||
          b.endsAt ||
          b.endTime ||
          b.slot?.endTime ||
          b.slot?.endAt ||
          b.candidate?.endTime;

        const formattedStart = rawStartAt ? formatIso8601(rawStartAt) : undefined;
        const formattedEnd = rawEndAt ? formatIso8601(rawEndAt) : undefined;

        return {
          id: b.id || b.bookingId || '',
          bookingId: b.bookingId || b.id || '',
          slotId: b.slotId,
          serviceId: b.serviceId,
          mentorId: b.mentorId || b.mentor?.id || b.mentorUserId,
          mentorName: mentorDisplayName,
          mentorDisplayName,
          mentorAvatarUrl: b.mentorAvatarUrl || b.mentor?.avatarUrl || b.mentorUser?.avatarUrl || null,
          serviceName: serviceTitle,
          serviceTitle,
          serviceDescription: b.serviceDescription || b.service?.description,
          priceScoins: b.priceScoins ?? b.service?.priceScoins ?? b.price,
          durationMinutes: b.durationMinutes ?? b.service?.durationMinutes ?? b.duration,
          selectedStartTime: formattedStart,
          selectedEndTime: formattedEnd,
          startAt: formattedStart,
          endAt: formattedEnd,
          startsAt: formattedStart,
          endsAt: formattedEnd,
          status: String(b.status || 'PENDING').toUpperCase(),
          learningGoalTitle: b.learningGoalTitle || b.title || b.goalTitle,
          learningGoalDescription: b.learningGoalDescription || b.description || b.goalDescription,
          createdAt: b.createdAt ? formatIso8601(b.createdAt) : new Date().toISOString().replace(/Z$/, ''),
        };
      });
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
      startsAt: formatIso8601(startsAt),
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
