/**
 * @file useVerifyEmailLogic.ts
 * @description OTP step after sign-up (or after an unverified login): verifies the 6-digit code,
 * which signs the user in, and handles the resend countdown.
 */

'use client';

import { authRepo } from '@/repositories/authRepo';
import { showError, showSuccess } from '@/utils/toast';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { OTP_LENGTH, type OtpInputHandle } from '../components/OtpInput';
import {
  classifyAuthError,
  clearRegisterDraft,
  genericAuthErrorMessage,
  readRegisterDraft,
  saveRegisterDraft,
  useFinishSignIn,
  useRedirectSignedIn,
} from '../useAuthFlow';

const RESEND_COOLDOWN_SECONDS = 60;
const emptyCode = () => Array<string>(OTP_LENGTH).fill('');

export function useVerifyEmailLogic(locale: string, email: string) {
  const router = useRouter();
  const finishSignIn = useFinishSignIn(locale);
  const otpRef = useRef<OtpInputHandle>(null);
  const submittingRef = useRef(false);
  const [digits, setDigits] = useState<string[]>(emptyCode);
  const [error, setError] = useState<string>();
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_COOLDOWN_SECONDS);
  useRedirectSignedIn(locale);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  useEffect(() => {
    otpRef.current?.focusFirst();
  }, []);

  const verify = useCallback(
    async (code: string) => {
      if (submittingRef.current) return;
      if (!/^\d{6}$/.test(code)) {
        setError('Vui lòng nhập đủ 6 số.');
        otpRef.current?.focusFirst();
        return;
      }
      submittingRef.current = true;
      setVerifying(true);
      setError(undefined);
      try {
        await authRepo.verifyEmail({ email, otpCode: code });
      } catch (reason) {
        const kind = classifyAuthError(reason);
        setError(
          kind === 'rate-limited' || kind === 'locked' || kind === 'other'
            ? genericAuthErrorMessage(reason)
            : 'Mã chưa đúng hoặc đã hết hạn. Kiểm tra lại hoặc gửi mã mới.',
        );
        setDigits(emptyCode());
        submittingRef.current = false;
        setVerifying(false);
        // Wait for the boxes to re-enable before moving focus.
        setTimeout(() => otpRef.current?.focusFirst(), 0);
        return;
      }
      clearRegisterDraft();
      try {
        await finishSignIn({ newAccount: true });
        // Stay "verifying" until the route changes so the code can't be sent twice.
      } catch (reason) {
        setError(genericAuthErrorMessage(reason));
        submittingRef.current = false;
        setVerifying(false);
      }
    },
    [email, finishSignIn],
  );

  const changeDigits = (next: string[]) => {
    setDigits(next);
    if (error) setError(undefined);
    if (next.every((digit) => /^\d$/.test(digit))) void verify(next.join(''));
  };

  const resend = async () => {
    if (resending || secondsLeft > 0) return;
    setResending(true);
    try {
      await authRepo.resendOtp(email);
      showSuccess({ title: 'Đã gửi mã mới.' });
      setDigits(emptyCode());
      setError(undefined);
      setSecondsLeft(RESEND_COOLDOWN_SECONDS);
      otpRef.current?.focusFirst();
    } catch (reason) {
      showError(genericAuthErrorMessage(reason), {
        title: 'Chưa gửi được mã mới',
        description: 'Vui lòng thử lại sau ít phút.',
      });
    } finally {
      setResending(false);
    }
  };

  /** Back to the register form with name + email kept (the password is never stored). */
  const changeEmail = () => {
    const draft = readRegisterDraft();
    saveRegisterDraft({ fullName: draft?.fullName ?? '', email });
    router.push(`/${locale}/register`);
  };

  return {
    otpRef,
    digits,
    changeDigits,
    error,
    verifying,
    submit: () => verify(digits.join('')),
    secondsLeft,
    resending,
    resend,
    changeEmail,
  };
}
