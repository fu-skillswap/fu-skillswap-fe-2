"use client";

import { validateLogin, type LoginFormValues } from "@/models/schemas/authSchema";
import { useState } from "react";
import { authService } from "@/services/authService";
import { generateCodeChallenge, generateCodeVerifier, saveCodeVerifier } from "@/lib/auth/pkce";
import { getGoogleCallbackUri } from "@/lib/auth/google";
import { ApiClientError } from "@/models/apiClient";

export function useLoginLogic(locale: string) {
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const submit = async (values: LoginFormValues) => {
    const validationError = validateLogin(values);
    if (validationError) return setError(validationError);
    setLoading(true); setError(undefined);
    setError("Đăng nhập bằng email và mật khẩu hiện chưa được hỗ trợ.");
    setLoading(false);
  };
  const loginWithGoogle = async () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) { setError("Đăng nhập Google chưa được cấu hình."); return; }
    setGoogleLoading(true); setError(undefined);
    try {
      const verifier = generateCodeVerifier(); const challenge = await generateCodeChallenge(verifier); const redirectUri = getGoogleCallbackUri(locale);
      saveCodeVerifier(verifier);
      const { state } = await authService.getGoogleAuthorizationContext(redirectUri, challenge);
      const query = new URLSearchParams({ client_id: clientId, redirect_uri: redirectUri, response_type: "code", scope: "openid email profile", state, code_challenge: challenge, code_challenge_method: "S256" });
      window.location.assign(`https://accounts.google.com/o/oauth2/v2/auth?${query}`);
    } catch (reason) {
      const code = reason instanceof ApiClientError ? reason.code : undefined;
      setError(code === "SYS_0010" ? "Bạn đã thao tác quá nhiều lần. Vui lòng thử lại sau." : "Không thể khởi tạo đăng nhập Google. Vui lòng thử lại.");
      setGoogleLoading(false);
    }
  };
  return { error, loading, googleLoading, submit, loginWithGoogle };
}
