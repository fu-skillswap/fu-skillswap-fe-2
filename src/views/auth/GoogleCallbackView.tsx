"use client";

import { authService } from "@/services/authService";
import { clearCodeVerifier, takeCodeVerifier } from "@/lib/auth/pkce";
import { getGoogleCallbackUri, onboardingDestination } from "@/lib/auth/google";
import { useAuth } from "@/providers/AuthProvider";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function GoogleCallbackView({ locale }: { locale: string }) {
  const router = useRouter(); const params = useSearchParams(); const { completeGoogleLogin } = useAuth();
  const ran = useRef(false); const [error, setError] = useState<string>();
  useEffect(() => {
    if (ran.current) return; ran.current = true;
    const authorizationCode = params.get("code"); const state = params.get("state"); const codeVerifier = takeCodeVerifier();
    if (!authorizationCode || !state || !codeVerifier) { clearCodeVerifier(); setError("Không thể xác thực với Google. Vui lòng thử lại."); return; }
    void (async () => {
      try { await authService.exchangeGoogleCode({ authorizationCode, state, codeVerifier, redirectUri: getGoogleCallbackUri(locale) }); const onboarding = await completeGoogleLogin(); router.replace(onboardingDestination(locale, onboarding.nextRecommendedAction)); }
      catch { clearCodeVerifier(); setError("Đăng nhập Google không thành công. Vui lòng thử lại."); }
    })();
  }, [completeGoogleLogin, locale, params, router]);
  return <main className="auth-callback-page">{error ? <section><h1>Không thể đăng nhập</h1><p>{error}</p><button type="button" onClick={() => router.replace(`/${locale}/login`)}>Quay lại đăng nhập</button></section> : <p>Đang hoàn tất đăng nhập với Google...</p>}</main>;
}
