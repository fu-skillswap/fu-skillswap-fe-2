/**
 * @file authRepo.ts
 * @description Repository quản lý các API liên quan đến Xác thực (Authentication Repository).
 * Giao tiếp với Backend API qua apiClient cho Google Login, Google Nonce, User Profile, Session, Logout.
 */

import { ApiClientError, apiClient, setAccessToken } from '@/models/apiClient';
import type {
  EmailLoginRequest,
  GoogleLoginNonceResponse,
  GoogleLoginRequest,
  OnboardingStatusResponse,
  RegisterRequest,
  TokenResponse,
  UserMeResponse,
  VerifyEmailRequest,
} from '@/models/auth';

/**
 * The api client rejects a 2xx envelope whose `data` is null. Register and resend-OTP may answer
 * that way on success, so treat any 2xx as done.
 */
async function allowEmptySuccess(request: Promise<unknown>) {
  try {
    await request;
  } catch (reason) {
    if (reason instanceof ApiClientError && reason.status >= 200 && reason.status < 300) return;
    throw reason;
  }
}

export const authRepo = {
  /**
   * Lấy mã Nonce dùng một lần cho Google Identity Services để phòng chống tấn công Replay Attack.
   * @returns Promise chứa mã nonce và thời gian hết hạn
   */
  getGoogleNonce() {
    return apiClient<GoogleLoginNonceResponse>('/api/auth/google/nonce');
  },

  /**
   * Gửi Google ID Token kèm Nonce lên Backend để xác thực đăng nhập Google.
   * Cập nhật Access Token thu được vào HTTP Client.
   * @param input - Đối tượng chứa ID Token credential và nonce
   * @returns Promise chứa TokenResponse từ Backend
   */
  async loginWithGoogle(input: GoogleLoginRequest) {
    const token = await apiClient<TokenResponse>('/api/auth/google', {
      method: 'POST',
      data: input,
    });
    setAccessToken(token.accessToken);
    return token;
  },

  /**
   * Signs in with email + password. Same token response as Google: access token in the body,
   * refresh token in an HttpOnly cookie.
   */
  async loginWithEmail(input: EmailLoginRequest) {
    const token = await apiClient<TokenResponse>('/api/auth/login', {
      method: 'POST',
      data: input,
    });
    setAccessToken(token.accessToken);
    return token;
  },

  /**
   * Creates an email/password account (or links a password to an existing Google account).
   * The backend emails a 6-digit OTP; the account stays inactive until `verifyEmail`.
   */
  register(input: RegisterRequest) {
    return allowEmptySuccess(apiClient('/api/auth/register', { method: 'POST', data: input }));
  },

  /** Verifies the emailed OTP. On success the backend activates the account and issues a JWT. */
  async verifyEmail(input: VerifyEmailRequest) {
    const token = await apiClient<TokenResponse>('/api/auth/verify-email', {
      method: 'POST',
      data: input,
    });
    setAccessToken(token.accessToken);
    return token;
  },

  /** Asks the backend to email a new OTP. */
  resendOtp(email: string) {
    return allowEmptySuccess(
      apiClient('/api/auth/resend-otp', { method: 'POST', data: { email } }),
    );
  },

  /**
   * Lấy thông tin cá nhân chi tiết của người dùng đang đăng nhập hiện tại từ API `/api/auth/me`.
   * @returns Promise chứa thông tin người dùng (`UserMeResponse`)
   */
  getMe() {
    return apiClient<UserMeResponse>('/api/auth/me');
  },

  /**
   * Lấy trạng thái hoàn thiện hồ sơ (Onboarding Status) của người dùng hiện tại (`/api/me/onboarding-status`).
   * Giúp hệ thống quyết định điều hướng người dùng tới bước hoàn thiện hồ sơ sinh viên hay mentor.
   * @returns Promise chứa chi tiết các mốc hồ sơ đã hoàn thành
   */
  getOnboardingStatus() {
    return apiClient<OnboardingStatusResponse>('/api/me/onboarding-status');
  },

  /**
   * Gửi yêu cầu đăng xuất người dùng đến Backend (`POST /api/auth/logout`)
   * để vô hiệu hóa phiên làm việc, thu hồi Refresh Token và xóa cookie HttpOnly.
   */
  logout() {
    return apiClient<unknown>('/api/auth/logout', { method: 'POST' });
  },
};
