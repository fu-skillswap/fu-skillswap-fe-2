import { apiClient, setAccessToken } from "@/models/apiClient";
import type { GoogleLoginNonceResponse, GoogleLoginRequest, OnboardingStatusResponse, TokenResponse, UserMeResponse } from "@/models/auth";

export const authService = {
  getGoogleNonce() { return apiClient<GoogleLoginNonceResponse>("/api/auth/google/nonce"); },
  async loginWithGoogle(input: GoogleLoginRequest) { const token = await apiClient<TokenResponse>("/api/auth/google", { method: "POST", body: JSON.stringify(input) }); setAccessToken(token.accessToken); return token; },
  getMe() { return apiClient<UserMeResponse>("/api/auth/me"); },
  getOnboardingStatus() { return apiClient<OnboardingStatusResponse>("/api/me/onboarding-status"); },
  logout() { return apiClient<unknown>("/api/auth/logout", { method: "POST" }); },
};
