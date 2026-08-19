/**
 * @file authService.ts
 * @description Dịch vụ gọi API xác thực (Authentication API Service).
 * Đảm nhiệm giao tiếp với các endpoint liên quan tới Google OAuth2, phiên làm việc (Session),
 * thông tin người dùng hiện tại và trạng thái Onboarding.
 */

import { apiClient, setAccessToken } from "@/models/apiClient";
import type {
  GoogleLoginNonceResponse,
  GoogleLoginRequest,
  OnboardingStatusResponse,
  TokenResponse,
  UserMeResponse,
} from "@/models/auth";

export const authService = {
  /**
   * Lấy mã Nonce dùng một lần cho Google Identity Services để phòng chống tấn công Replay Attack.
   * @returns Promise chứa mã nonce và thời gian hết hạn
   */
  getGoogleNonce() {
    return apiClient<GoogleLoginNonceResponse>("/api/auth/google/nonce");
  },

  /**
   * Gửi Google ID Token kèm Nonce lên Backend để xác thực đăng nhập Google.
   * Cập nhật Access Token thu được vào memory store của HTTP Client.
   * @param input - Đối tượng chứa ID Token credential và nonce
   * @returns Promise chứa Access Token từ Backend
   */
  async loginWithGoogle(input: GoogleLoginRequest) {
    const token = await apiClient<TokenResponse>("/api/auth/google", {
      method: "POST",
      body: JSON.stringify(input),
    });
    setAccessToken(token.accessToken);
    return token;
  },

  /**
   * Lấy thông tin cá nhân chi tiết của người dùng đang đăng nhập hiện tại.
   * @returns Promise chứa thông tin người dùng (`UserMeResponse`)
   */
  getMe() {
    return apiClient<UserMeResponse>("/api/auth/me");
  },

  /**
   * Lấy trạng thái hoàn thiện hồ sơ (Onboarding Status) của người dùng hiện tại.
   * Giúp hệ thống quyết định điều hướng người dùng tới bước hoàn thiện hồ sơ sinh viên hay mentor.
   * @returns Promise chứa chi tiết các mốc hồ sơ đã hoàn thành và hành động tiếp theo được khuyến nghị
   */
  getOnboardingStatus() {
    return apiClient<OnboardingStatusResponse>("/api/me/onboarding-status");
  },

  /**
   * Gửi yêu cầu đăng xuất người dùng đến Backend để vô hiệu hóa phiên làm việc và xóa cookie HttpOnly.
   */
  logout() {
    return apiClient<unknown>("/api/auth/logout", { method: "POST" });
  },
};
