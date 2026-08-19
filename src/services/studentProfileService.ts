/**
 * @file studentProfileService.ts
 * @description Dịch vụ quản lý hồ sơ sinh viên và danh mục học thuật (Student Profile & Academic Catalog API Service).
 * Cung cấp các hàm truy xuất danh sách cơ sở campus, ngành học, chuyên ngành và lưu hồ sơ sinh viên trong quy trình Onboarding.
 */

import { apiClient } from "@/models/apiClient";
import type {
  AcademicProgramResponse,
  CampusResponse,
  SpecializationResponse,
  StudentProfileRequest,
} from "@/models/auth";

export const studentProfileService = {
  /**
   * Truy xuất danh sách tất cả các Cơ sở / Campus đại học khả dụng.
   * @returns Promise chứa mảng danh sách Campus (`CampusResponse[]`)
   */
  getCampuses: () => apiClient<CampusResponse[]>("/api/campuses"),

  /**
   * Truy xuất danh sách tất cả các Chương trình / Ngành đào tạo.
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
   * Lưu hoặc cập nhật thông tin Hồ sơ sinh viên của người dùng hiện tại (Onboarding Step).
   * @param profile - Đối tượng dữ liệu hồ sơ sinh viên (`StudentProfileRequest`)
   * @returns Promise kết quả từ API Backend
   */
  save: (profile: StudentProfileRequest) =>
    apiClient<unknown>("/api/me/student-profile", {
      method: "PUT",
      body: JSON.stringify(profile),
    }),
};
