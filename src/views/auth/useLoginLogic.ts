/**
 * @file useLoginLogic.ts
 * @description Custom React Hook quản lý logic Đăng nhập (Authentication Hook) sử dụng React Hook Form & Yup.
 * Google sign-in comes from `useGoogleSignIn`; this hook adds the email/password form.
 */

'use client';

import { loginSchema, type LoginFormValues } from '@/models/schemas/authSchema';
import { authRepo } from '@/repositories/authRepo';
import { yupResolver } from '@hookform/resolvers/yup';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  classifyAuthError,
  genericAuthErrorMessage,
  useFinishSignIn,
  useGoogleSignIn,
  useRedirectSignedIn,
  verifyEmailHref,
} from './useAuthFlow';

/**
 * Custom Hook điều khiển toàn bộ logic trang Đăng nhập.
 *
 * @param locale - Mã ngôn ngữ hiện tại (ví dụ: "vi", "en")
 * @param adminOnly - Admin portal login: only admin roles may continue
 */
export function useLoginLogic(locale: string, adminOnly = false) {
  const router = useRouter();
  const google = useGoogleSignIn({ locale, adminOnly, text: 'continue_with' });
  const finishSignIn = useFinishSignIn(locale, adminOnly);
  const [formError, setFormError] = useState<string>();
  // Keeps the button disabled between a successful sign-in and the route change.
  const [redirecting, setRedirecting] = useState(false);
  useRedirectSignedIn(locale, adminOnly);

  /** Khởi tạo React Hook Form với Yup Resolver */
  const form = useForm<LoginFormValues>({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const submit = form.handleSubmit(async ({ email, password }) => {
    setFormError(undefined);
    try {
      await authRepo.loginWithEmail({ email, password });
    } catch (reason) {
      const kind = classifyAuthError(reason);
      if (kind === 'unverified') {
        // Send a fresh code, then continue on the OTP screen with the email prefilled.
        try {
          await authRepo.resendOtp(email);
        } catch {
          /* A recent code may still be valid; the verify screen offers "Gửi lại mã". */
        }
        router.push(verifyEmailHref(locale, email));
        return;
      }
      setFormError(
        kind === 'invalid-credentials'
          ? 'Email hoặc mật khẩu chưa đúng.'
          : genericAuthErrorMessage(reason),
      );
      return;
    }
    try {
      const denied = await finishSignIn();
      if (denied) setFormError(denied);
      else setRedirecting(true);
    } catch (reason) {
      setFormError(genericAuthErrorMessage(reason));
    }
  });

  return {
    ...google,
    form,
    formError,
    loading: form.formState.isSubmitting || redirecting,
    submit,
  };
}
