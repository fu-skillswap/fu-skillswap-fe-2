"use client";

import { onboardingDestination } from "@/lib/auth/google";
import { ApiClientError } from "@/models/apiClient";
import { validateLogin, type LoginFormValues } from "@/models/schemas/authSchema";
import { useAuth } from "@/providers/AuthProvider";
import { authService } from "@/services/authService";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const GIS_SCRIPT_URL = "https://accounts.google.com/gsi/client";
let googleIdentityServicesPromise: Promise<void> | null = null;

function loadGoogleIdentityServices() {
  if (window.google?.accounts.id) return Promise.resolve();
  if (!googleIdentityServicesPromise) {
    googleIdentityServicesPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = GIS_SCRIPT_URL;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Unable to load Google Identity Services."));
      document.head.appendChild(script);
    });
  }
  return googleIdentityServicesPromise;
}

function messageForGoogleError(reason: unknown) {
  if (reason instanceof ApiClientError) {
    if (reason.code === "SYS_0010") return reason.retryAfterSeconds ? `Bạn đã thao tác quá nhiều lần. Vui lòng thử lại sau ${reason.retryAfterSeconds} giây.` : "Bạn đã thao tác quá nhiều lần. Vui lòng thử lại sau.";
    if (reason.code === "AUTH_1004") return "Tài khoản của bạn đã bị khóa.";
    if (/nonce/i.test(reason.message)) return "Phiên đăng nhập Google đã hết hạn hoặc không còn hợp lệ. Vui lòng bấm “Đăng nhập bằng Google” và thử lại.";
    return reason.message || "Đăng nhập Google không thành công. Vui lòng thử lại.";
  }
  return "Không thể khởi tạo đăng nhập Google. Vui lòng thử lại.";
}

export function useLoginLogic(locale: string) {
  const router = useRouter();
  const { completeGoogleLogin } = useAuth();
  const completeGoogleLoginRef = useRef(completeGoogleLogin);
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const nonceRef = useRef<string | null>(null);
  const configureGoogleButtonRef = useRef<() => Promise<void>>(async () => {});
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(true);
  const clearError = useCallback(() => setError(undefined), []);

  completeGoogleLoginRef.current = completeGoogleLogin;

  const submit = async (values: LoginFormValues) => {
    const validationError = validateLogin(values);
    if (validationError) return setError(validationError);
    setLoading(true);
    setError("Đăng nhập bằng email và mật khẩu hiện chưa được hỗ trợ.");
    setLoading(false);
  };

  const configureGoogleButton = useCallback(async () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const button = googleButtonRef.current;
    if (!clientId) {
      setError("Đăng nhập Google chưa được cấu hình. Vui lòng liên hệ quản trị viên.");
      setGoogleLoading(false);
      return;
    }
    if (!button) return;

    setGoogleLoading(true);
    try {
      const { nonce } = await authService.getGoogleNonce();
      nonceRef.current = nonce;
      await loadGoogleIdentityServices();
      if (!window.google?.accounts.id) throw new Error("Google Identity Services is unavailable.");

      window.google.accounts.id.initialize({
        client_id: clientId,
        nonce,
        callback: async ({ credential }) => {
          // Nonces are single-use, so discard it before sending the ID token.
          const loginNonce = nonceRef.current;
          nonceRef.current = null;
          if (!credential || !loginNonce) return;
          setGoogleLoading(true);
          setError(undefined);
          try {
            await authService.loginWithGoogle({ credential, nonce: loginNonce });
            const onboarding = await completeGoogleLoginRef.current();
            router.replace(onboardingDestination(locale, onboarding.nextRecommendedAction));
          } catch (reason) {
            setError(messageForGoogleError(reason));
            // Never retry an invalid/expired nonce-credential pair.
            void configureGoogleButtonRef.current();
          } finally {
            setGoogleLoading(false);
          }
        },
      });
      button.replaceChildren();
      window.google.accounts.id.renderButton(button, { theme: "outline", size: "large", text: "signin_with", shape: "rectangular", width: Math.floor(button.getBoundingClientRect().width) || 380 });
    } catch (reason) {
      nonceRef.current = null;
      setError(messageForGoogleError(reason));
    } finally {
      setGoogleLoading(false);
    }
  }, [locale, router]);

  configureGoogleButtonRef.current = configureGoogleButton;

  useEffect(() => {
    void configureGoogleButton();
    return () => { nonceRef.current = null; };
  }, [configureGoogleButton]);

  return { error, clearError, loading, googleLoading, submit, googleButtonRef };
}
