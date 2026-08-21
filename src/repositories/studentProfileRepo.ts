/**
 * @file studentProfileRepo.ts
 * @description Repository quản lý hồ sơ sinh viên và danh mục học thuật (Student Profile & Academic Catalog Repository).
 * Cung cấp các hàm truy xuất danh sách cơ sở campus, ngành học, chuyên ngành và lưu hồ sơ sinh viên trong quy trình Onboarding.
 */

import { apiClient } from "@/models/apiClient";
import type {
  AcademicProgramResponse,
  CampusResponse,
  SpecializationResponse,
  StudentProfileRequest,
  StudentProfileResponse,
} from "@/models/auth";

let profilePromise: Promise<StudentProfileResponse> | null = null;
let cachedProfile: StudentProfileResponse | null = null;

export const studentProfileRepo = {
  /**
   * Lấy hồ sơ học thuật của tôi (GET `/api/me/student-profile`).
   * Tự động gom các request gọi đồng thời (Promise Deduplication) và lưu bộ nhớ tạm (In-memory Cache).
   * @param forceRefresh - Đặt true nếu muốn ép buộc gọi lại API mới nhất từ Backend
   * @returns Promise chứa thông tin Hồ sơ sinh viên (`StudentProfileResponse`)
   */
  get: (forceRefresh = false): Promise<StudentProfileResponse> => {
    if (cachedProfile && !forceRefresh) {
      return Promise.resolve(cachedProfile);
    }
    if (!profilePromise || forceRefresh) {
      profilePromise = apiClient<StudentProfileResponse>("/api/me/student-profile")
        .then((data) => {
          cachedProfile = data;
          return data;
        })
        .finally(() => {
          profilePromise = null;
        });
    }
    return profilePromise;
  },

  /**
   * Truy xuất danh sách các Cơ sở / Campus đại học (`/api/campuses`).
   * @returns Promise chứa mảng danh sách Campus (`CampusResponse[]`)
   */
  getCampuses: () => apiClient<CampusResponse[]>("/api/campuses"),

  /**
   * Truy xuất danh sách tất cả các Chương trình / Ngành đào tạo (`/api/academic-programs`).
   * @returns Promise chứa mảng danh sách Ngành đào tạo (`AcademicProgramResponse[]`)
   */
  getPrograms: () =>
    apiClient<AcademicProgramResponse[]>("/api/academic-programs"),

  /**
   * Truy xuất danh sách các Chuyên ngành hẹp thuộc về một Ngành đào tạo cụ thể.
   * @param programId - ID của ngành đào tạo
   * @returns Promise chứa mảng danh sách Chuyên ngành (`SpecializationResponse[]`)
   */
  getSpecializations: (programId: string) =>
    apiClient<SpecializationResponse[]>(
      `/api/academic-programs/${programId}/specializations`,
    ),

  /**
   * Lưu hoặc cập nhật hồ sơ học thuật của tôi (PUT `/api/me/student-profile`).
   * Cập nhật ngay bộ nhớ tạm sau khi lưu thành công.
   * @param profile - Đối tượng dữ liệu hồ sơ sinh viên (`StudentProfileRequest`)
   * @returns Promise chứa dữ liệu Hồ sơ sinh viên đã cập nhật (`StudentProfileResponse`)
   */
  save: async (profile: StudentProfileRequest): Promise<StudentProfileResponse> => {
    const updated = await apiClient<StudentProfileResponse>("/api/me/student-profile", {
      method: "PUT",
      data: profile,
    });
    cachedProfile = updated;
    return updated;
  },

  /** Xóa cache dữ liệu hồ sơ cá nhân trong bộ nhớ tạm (dùng khi đăng xuất) */
  clearCache: () => {
    cachedProfile = null;
    profilePromise = null;
  },
};

