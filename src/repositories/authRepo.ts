/**
 * @file authRepo.ts
 * @description Repository quản lý các API liên quan đến Xác thực (Authentication Repository).
 * Giao tiếp với Backend API qua apiClient cho Google Login, Google Nonce, User Profile, Session, Logout.
 */

import { apiClient, setAccessToken } from "@/models/apiClient";
import type {
  GoogleLoginNonceResponse,
  GoogleLoginRequest,
  OnboardingStatusResponse,
  TokenResponse,
  UserMeResponse,
} from "@/models/auth";
import type { LoginRequest, LoginResponse } from "@/models/dtos";

export const authRepo = {
  /**
   * Lấy mã Nonce dùng một lần cho Google Identity Services để phòng chống tấn công Replay Attack.
   * @returns Promise chứa mã nonce và thời gian hết hạn
   */
  getGoogleNonce() {
    return apiClient<GoogleLoginNonceResponse>("/api/auth/google/nonce");
  },

  /**
   * Gửi Google ID Token kèm Nonce lên Backend để xác thực đăng nhập Google.
   * Cập nhật Access Token thu được vào HTTP Client.
   * @param input - Đối tượng chứa ID Token credential và nonce
   * @returns Promise chứa TokenResponse từ Backend
   */
  async loginWithGoogle(input: GoogleLoginRequest) {
    const token = await apiClient<TokenResponse>("/api/auth/google", {
      method: "POST",
      data: input,
    });
    setAccessToken(token.accessToken);
    return token;
  },

  /**
   * Lấy thông tin cá nhân chi tiết của người dùng đang đăng nhập hiện tại từ API `/api/auth/me`.
   * @returns Promise chứa thông tin người dùng (`UserMeResponse`)
   */
  getMe() {
    return apiClient<UserMeResponse>("/api/auth/me");
  },

  /**
   * Lấy trạng thái hoàn thiện hồ sơ (Onboarding Status) của người dùng hiện tại (`/api/me/onboarding-status`).
   * Giúp hệ thống quyết định điều hướng người dùng tới bước hoàn thiện hồ sơ sinh viên hay mentor.
   * @returns Promise chứa chi tiết các mốc hồ sơ đã hoàn thành
   */
  getOnboardingStatus() {
    return apiClient<OnboardingStatusResponse>("/api/me/onboarding-status");
  },

  /**
   * Gửi yêu cầu đăng xuất người dùng đến Backend (`POST /api/auth/logout`)
   * để vô hiệu hóa phiên làm việc, thu hồi Refresh Token và xóa cookie HttpOnly.
   */
  logout() {
    return apiClient<unknown>("/api/auth/logout", { method: "POST" });
  },

  /**
   * Giả lập xử lý đăng nhập bằng email/mật khẩu với độ trễ 300ms (phục vụ môi trường demo).
   * @param input - Thông tin đăng nhập truyền vào
   * @returns Promise chứa thông tin user demo và access token mẫu
   */
  async login(input: LoginRequest): Promise<LoginResponse> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return {
      accessToken: "demo-access-token",
      user: {
        id: "u-1",
        name: input.email.split("@")[0] || "Student",
        email: input.email,
        role: "mentee",
      },
    };
  },
};

