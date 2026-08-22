/**
 * @file mentorProfileRepo.ts
 * @description Repository quản lý hồ sơ Mentor (Mentor Profile Repository).
 * Cung cấp các phương thức gọi API GET và PUT /api/me/mentor-profile kèm bộ nhớ tạm (In-memory cache) và deduplication.
 */

import axios from "axios";
import { apiClient } from "@/models/apiClient";
import type {
  ConfirmDocumentRequest,
  CreateMentorAchievementRequest,
  CreateMentorProjectRequest,
  CreateUploadIntentRequest,
  MentorAchievementResponse,
  MentorProjectResponse,
  MentorProfileResponse,
  SaveMentorProfileRequest,
  SubmitMentorVerificationRequest,
  UploadIntentResponse,
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

  /**
   * Bước 1: Mở hồ sơ bắt đầu xác thực Mentor (POST `/api/me/mentor-verification/request`).
   */
  requestVerification: (): Promise<unknown> => {
    return apiClient("/api/me/mentor-verification/request", {
      method: "POST",
    });
  },

  /**
   * Tạo URL upload minh chứng (POST `/api/me/mentor-verification/documents/upload-intents`).
   * @param data - Payload chứa thông tin file (filename, contentType, sizeBytes)
   */
  createUploadIntent: (data: CreateUploadIntentRequest): Promise<UploadIntentResponse> => {
    return apiClient<UploadIntentResponse>("/api/me/mentor-verification/documents/upload-intents", {
      method: "POST",
      data,
    });
  },

  /**
   * Tạo lại URL upload minh chứng khi hết hạn (POST `/api/me/mentor-verification/documents/upload-intents/{uploadIntentId}/retry`).
   * @param uploadIntentId - Mã định danh lượt upload
   */
  retryUploadIntent: (uploadIntentId: string): Promise<UploadIntentResponse> => {
    return apiClient<UploadIntentResponse>(
      `/api/me/mentor-verification/documents/upload-intents/${uploadIntentId}/retry`,
      {
        method: "POST",
      },
    );
  },

  /**
   * Tải trực tiếp file minh chứng lên URL đã tạo (Direct S3 / Storage Upload).
   * @param uploadUrl - Đường dẫn upload nhận từ backend
   * @param file - Đối tượng File từ máy tính người dùng
   * @param requiredHeaders - Các header bắt buộc nếu có
   */
  uploadFileToUrl: async (
    uploadUrl: string,
    file: File,
    requiredHeaders?: Record<string, string>,
  ): Promise<void> => {
    const headers = {
      "Content-Type": file.type || "application/octet-stream",
      ...(requiredHeaders || {}),
    };
    await axios.put(uploadUrl, file, { headers });
  },

  /**
   * Xác nhận tài liệu minh chứng đã tải lên (POST `/api/me/mentor-verification/documents`).
   * @param data - Payload chứa documentType ("FPTU_AFFILIATION_PROOF") và uploadIntentId
   */
  confirmDocument: (data: ConfirmDocumentRequest): Promise<unknown> => {
    return apiClient("/api/me/mentor-verification/documents", {
      method: "POST",
      data,
    });
  },

  /**
   * Bước 3: Nộp hồ sơ xác thực Mentor lên cho Admin duyệt (POST `/api/me/mentor-verification/submit`).
   * @param data - Payload chứa termsAccepted và submitNote (tùy chọn)
   */
  submitVerification: (data: SubmitMentorVerificationRequest): Promise<unknown> => {
    return apiClient("/api/me/mentor-verification/submit", {
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
