/**
 * @file mentorProfileRepo.ts
 * @description Repository quản lý hồ sơ Mentor (Mentor Profile Repository).
 * Cung cấp các phương thức gọi API GET và PUT /api/me/mentor-profile kèm bộ nhớ tạm (In-memory cache) và deduplication.
 */

import { apiClient } from "@/models/apiClient";
import type {
  CreateMentorAchievementRequest,
  CreateMentorProjectRequest,
  MentorAchievementResponse,
  MentorProjectResponse,
  MentorProfileResponse,
  SaveMentorProfileRequest,
} from "@/models/auth";

let mentorProfilePromise: Promise<MentorProfileResponse> | null = null;
let cachedMentorProfile: MentorProfileResponse | null = null;

export const mentorProfileRepo = {
  /**
   * Lấy thông tin Hồ sơ Mentor của tôi (GET `/api/me/mentor-profile`).
   * Tự động gom các request gọi đồng thời (Promise Deduplication) và lưu bộ nhớ tạm.
   * @param forceRefresh - Đặt true để làm mới dữ liệu từ server
   * @returns Promise chứa thông tin Hồ sơ Mentor (`MentorProfileResponse`)
   */
  get: (forceRefresh = false): Promise<MentorProfileResponse> => {
    if (cachedMentorProfile && !forceRefresh) {
      return Promise.resolve(cachedMentorProfile);
    }
    if (!mentorProfilePromise || forceRefresh) {
      mentorProfilePromise = apiClient<MentorProfileResponse>("/api/me/mentor-profile")
        .then((data) => {
          cachedMentorProfile = data;
          return data;
        })
        .finally(() => {
          mentorProfilePromise = null;
        });
    }
    return mentorProfilePromise;
  },

  /**
   * Lưu hoặc cập nhật Hồ sơ Mentor của tôi (PUT `/api/me/mentor-profile`).
   * @param data - Đối tượng chứa thông tin đăng ký / cập nhật (`SaveMentorProfileRequest`)
   * @returns Promise chứa phản hồi Hồ sơ Mentor (`MentorProfileResponse`)
   */
  save: async (data: SaveMentorProfileRequest): Promise<MentorProfileResponse> => {
    const updated = await apiClient<MentorProfileResponse>("/api/me/mentor-profile", {
      method: "PUT",
      data,
    });
    cachedMentorProfile = updated;
    return updated;
  },

  /**
   * Tạo dự án tiêu biểu mới (POST `/api/me/mentor-projects`).
   * @param data - Đối tượng thông tin dự án (`CreateMentorProjectRequest`)
   * @returns Promise chứa phản hồi dự án (`MentorProjectResponse`)
   */
  createProject: (data: CreateMentorProjectRequest): Promise<MentorProjectResponse> => {
    return apiClient<MentorProjectResponse>("/api/me/mentor-projects", {
      method: "POST",
      data,
    });
  },

  /**
   * Tạo học vấn / giải thưởng mới (POST `/api/me/mentor-achievements`).
   * @param data - Đối tượng thông tin giải thưởng (`CreateMentorAchievementRequest`)
   * @returns Promise chứa phản hồi giải thưởng (`MentorAchievementResponse`)
   */
  createAchievement: (
    data: CreateMentorAchievementRequest,
  ): Promise<MentorAchievementResponse> => {
    return apiClient<MentorAchievementResponse>("/api/me/mentor-achievements", {
      method: "POST",
      data,
    });
  },

  /** Xóa cache bộ nhớ tạm (dùng khi Đăng xuất) */
  clearCache: () => {
    cachedMentorProfile = null;
    mentorProfilePromise = null;
  },
};
