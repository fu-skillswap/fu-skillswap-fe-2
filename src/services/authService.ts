import { apiClient, setAccessToken } from "@/models/apiClient";
import type { AuthorizationContextResponse, GoogleLoginRequest, OnboardingStatusResponse, TokenResponse, UserMeResponse } from "@/models/auth";

export const authService = {
  getGoogleAuthorizationContext(redirectUri: string, codeChallenge: string) { const params = new URLSearchParams({ redirectUri, codeChallenge }); return apiClient<AuthorizationContextResponse>(`/api/auth/google/authorization-context?${params}`); },
  async exchangeGoogleCode(input: GoogleLoginRequest) { const token = await apiClient<TokenResponse>("/api/auth/google", { method: "POST", body: JSON.stringify(input) }); setAccessToken(token.accessToken); return token; },
  getMe() { return apiClient<UserMeResponse>("/api/auth/me"); },
  getOnboardingStatus() { return apiClient<OnboardingStatusResponse>("/api/me/onboarding-status"); },
  logout() { return apiClient<unknown>("/api/auth/logout", { method: "POST" }); },
};
