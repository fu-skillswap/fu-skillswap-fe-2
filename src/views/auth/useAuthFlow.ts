/**
 * @file useAuthFlow.ts
 * @description Pieces shared by the login, register and verify-email screens: the post-sign-in
 * routing (same for Google and email), the Google Identity Services button, auth error mapping
 * and the register draft kept for "Đổi email".
 */

'use client';

import { onboardingDestination } from '@/lib/auth/google';
import { ApiClientError } from '@/models/apiClient';
import { useAuth } from '@/providers/AuthProvider';
import { authRepo } from '@/repositories/authRepo';
import { getUserFriendlyError, showSuccess } from '@/utils/toast';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

export const SUPPORT_EMAIL = 'skillswapvn.contact@gmail.com';

/** URL thư viện SDK chính thức của Google Identity Services */
const GIS_SCRIPT_URL = 'https://accounts.google.com/gsi/client';
/** GIS renders buttons between 200px and 400px wide. */
const GIS_MAX_WIDTH = 400;
let googleIdentityServicesPromise: Promise<void> | null = null;

/**
 * Tải script Google Identity Services SDK vào DOM nếu chưa có.
 * Gom các yêu cầu tải trùng lặp thành một Promise duy nhất.
 * @returns Promise hoàn thành khi script GIS đã sẵn sàng
 */
function loadGoogleIdentityServices() {
  if (window.google?.accounts.id) return Promise.resolve();
  if (!googleIdentityServicesPromise) {
    googleIdentityServicesPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = GIS_SCRIPT_URL;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Unable to load Google Identity Services.'));
      document.head.appendChild(script);
    });
  }
  return googleIdentityServicesPromise;
}

function rateLimitMessage(reason: ApiClientError) {
  return reason.retryAfterSeconds
    ? `Bạn đã thao tác quá nhiều lần. Vui lòng thử lại sau ${reason.retryAfterSeconds} giây.`
    : 'Bạn đã thao tác quá nhiều lần. Vui lòng thử lại sau.';
}

/**
 * Chuyển đổi các đối tượng lỗi từ API/Network thành thông điệp thân thiện với người dùng bằng tiếng Việt.
 * @param reason - Lỗi thu được từ khối catch
 * @returns Lỗi gốc để mapper dùng chung xử lý, hoặc business message đã được xác định an toàn
 */
function userFacingGoogleError(reason: unknown): unknown {
  if (reason instanceof ApiClientError) {
    if (reason.code === 'SYS_0010') return rateLimitMessage(reason);
    if (reason.code === 'AUTH_1004') return 'Tài khoản của bạn đã bị khóa.';
    if (/nonce/i.test(reason.message))
      return 'Phiên đăng nhập Google đã hết hạn hoặc không còn hợp lệ. Vui lòng bấm “Đăng nhập bằng Google” và thử lại.';
    return reason;
  }
  return reason;
}

export type AuthErrorKind =
  | 'invalid-credentials'
  | 'unverified'
  | 'locked'
  | 'already-registered'
  | 'rate-limited'
  | 'validation'
  | 'other';

/**
 * Classifies an error from the email auth endpoints. Codes confirmed against the API:
 * AUTH_1008 = wrong email/password, AUTH_1004 = locked, SYS_0010 = rate limited,
 * VAL_3001 = field validation. The rest is matched on status + message.
 */
export function classifyAuthError(reason: unknown): AuthErrorKind {
  if (!(reason instanceof ApiClientError)) return 'other';
  const text = `${reason.code} ${reason.message}`;
  if (reason.code === 'SYS_0010' || reason.status === 429) return 'rate-limited';
  if (reason.code === 'AUTH_1008') return 'invalid-credentials';
  if (reason.code === 'AUTH_1004') return 'locked';
  if (
    /chưa (được )?(xác thực|xác minh|kích hoạt)|not (yet )?(verified|activated)|unverified|inactive/i.test(
      text,
    )
  )
    return 'unverified';
  if (reason.status === 403 || /bị khóa|locked|disabled|banned/i.test(text)) return 'locked';
  if (
    reason.status === 409 ||
    /đã (được )?(đăng ký|tồn tại|sử dụng)|already (exists|registered|in use)/i.test(text)
  )
    return 'already-registered';
  if (reason.code === 'VAL_3001' || (reason.data?.length ?? 0) > 0) return 'validation';
  return 'other';
}

/** Copy for errors that have no screen-specific wording. */
export function genericAuthErrorMessage(reason: unknown) {
  if (reason instanceof ApiClientError) {
    const kind = classifyAuthError(reason);
    if (kind === 'rate-limited') return rateLimitMessage(reason);
    if (kind === 'locked')
      return `Tài khoản của bạn đã bị khóa. Gửi email tới ${SUPPORT_EMAIL} để được hỗ trợ.`;
  }
  const friendly = getUserFriendlyError(reason);
  return friendly.description ?? friendly.title;
}

/** Field errors from a VAL_3001 response, first message per field. */
export function fieldErrorsOf(reason: unknown) {
  const errors: Record<string, string> = {};
  if (reason instanceof ApiClientError) {
    reason.data?.forEach(({ field, message }) => {
      if (field && !errors[field]) errors[field] = message;
    });
  }
  return errors;
}

/**
 * Name + email typed on the register screen, so "Đổi email" can bring them back.
 * Never holds the password.
 */
const REGISTER_DRAFT_KEY = 'skillswap.register-draft';

export interface RegisterDraft {
  fullName: string;
  email: string;
}

export function saveRegisterDraft(draft: RegisterDraft) {
  try {
    sessionStorage.setItem(REGISTER_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    /* Storage can be unavailable (private mode); the draft is only a convenience. */
  }
}

export function readRegisterDraft(): RegisterDraft | null {
  try {
    const raw = sessionStorage.getItem(REGISTER_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<RegisterDraft>;
    return { fullName: parsed.fullName ?? '', email: parsed.email ?? '' };
  } catch {
    return null;
  }
}

export function clearRegisterDraft() {
  try {
    sessionStorage.removeItem(REGISTER_DRAFT_KEY);
  } catch {
    /* ignore */
  }
}

export function verifyEmailHref(locale: string, email: string) {
  return `/${locale}/verify-email?email=${encodeURIComponent(email)}`;
}

/**
 * Runs after any successful sign-in (Google, email/password or OTP verification): loads
 * `/api/auth/me` + onboarding status, then routes the user.
 * @returns An error message when the account may not use this portal, otherwise undefined.
 */
export function useFinishSignIn(locale: string, adminOnly = false) {
  const router = useRouter();
  const { completeGoogleLogin } = useAuth();
  const completeLoginRef = useRef(completeGoogleLogin);
  completeLoginRef.current = completeGoogleLogin;

  return useCallback(
    async ({ newAccount = false }: { newAccount?: boolean } = {}) => {
      const { user, onboarding } = await completeLoginRef.current();
      showSuccess(
        newAccount
          ? {
              title: 'Xác thực thành công',
              description: `Chào mừng ${user.fullName || 'bạn'} đến với SkillSwap.`,
            }
          : {
              title: 'Đăng nhập thành công',
              description: `Chào mừng ${user.fullName || 'bạn'} quay lại SkillSwap.`,
            },
      );
      const canAccessAdmin = user.roles.some((role) => role === 'ADMIN' || role === 'SYSTEM_ADMIN');
      if (adminOnly && !canAccessAdmin) {
        return 'Tài khoản này không có quyền truy cập cổng quản trị.';
      }
      if (adminOnly) {
        router.replace(`/${locale}/admin/dashboard`);
        return undefined;
      }
      // Always check MENTOR role first from GET /api/auth/me response
      if (user.roles.includes('MENTOR')) {
        router.replace(`/${locale}/mentor/dashboard`);
        return undefined;
      }
      router.replace(onboardingDestination(locale, onboarding.nextRecommendedAction));
      return undefined;
    },
    [adminOnly, locale, router],
  );
}

/** Same redirect the login page always had for an already signed-in mentor. */
export function useRedirectSignedIn(locale: string, adminOnly = false) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  useEffect(() => {
    if (isAuthenticated && user?.roles?.includes('MENTOR') && !adminOnly) {
      router.replace(`/${locale}/mentor/dashboard`);
    }
  }, [isAuthenticated, user, locale, router, adminOnly]);
}

/**
 * Khởi tạo nút Google Sign-In:
 * 1. Lấy mã Nonce dùng một lần từ Backend
 * 2. Tải Google Identity Services SDK
 * 3. Gọi `google.accounts.id.initialize` với callback gửi ID Token về Backend
 * 4. Render nút Google chuẩn vào DOM container
 */
export function useGoogleSignIn({
  locale,
  adminOnly = false,
  text,
}: {
  locale: string;
  adminOnly?: boolean;
  text: 'continue_with' | 'signup_with';
}) {
  const finishSignIn = useFinishSignIn(locale, adminOnly);
  const finishSignInRef = useRef(finishSignIn);
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const nonceRef = useRef<string | null>(null);
  const configureGoogleButtonRef = useRef<() => Promise<void>>(async () => {});
  const [error, setError] = useState<unknown>();
  const [googleLoading, setGoogleLoading] = useState(true);
  const clearError = useCallback(() => setError(undefined), []);

  finishSignInRef.current = finishSignIn;

  const configureGoogleButton = useCallback(async () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const button = googleButtonRef.current;
    if (!clientId) {
      setError('Đăng nhập Google chưa được cấu hình. Vui lòng liên hệ quản trị viên.');
      setGoogleLoading(false);
      return;
    }
    if (!button) return;

    setGoogleLoading(true);
    try {
      const { nonce } = await authRepo.getGoogleNonce();
      nonceRef.current = nonce;
      await loadGoogleIdentityServices();
      if (!window.google?.accounts.id) throw new Error('Google Identity Services is unavailable.');

      window.google.accounts.id.initialize({
        client_id: clientId,
        nonce,
        callback: async ({ credential }) => {
          const loginNonce = nonceRef.current;
          nonceRef.current = null;
          if (!credential || !loginNonce) return;
          setGoogleLoading(true);
          setError(undefined);
          try {
            await authRepo.loginWithGoogle({
              credential,
              nonce: loginNonce,
            });
            const denied = await finishSignInRef.current();
            if (denied) setError(denied);
          } catch (reason) {
            console.error('[Login Error]', reason);
            setError(userFacingGoogleError(reason));
            void configureGoogleButtonRef.current();
          } finally {
            setGoogleLoading(false);
          }
        },
      });
      button.replaceChildren();
      const width = Math.floor(button.getBoundingClientRect().width) || 360;
      window.google.accounts.id.renderButton(button, {
        theme: 'outline',
        size: 'large',
        text,
        shape: 'pill',
        locale: 'vi',
        width: Math.min(width, GIS_MAX_WIDTH),
      });
    } catch (reason) {
      nonceRef.current = null;
      console.error('[Login Setup Error]', reason);
      setError(userFacingGoogleError(reason));
    } finally {
      setGoogleLoading(false);
    }
  }, [text]);

  configureGoogleButtonRef.current = configureGoogleButton;

  useEffect(() => {
    void configureGoogleButton();
    return () => {
      nonceRef.current = null;
    };
  }, [configureGoogleButton]);

  return { error, clearError, googleLoading, googleButtonRef };
}
