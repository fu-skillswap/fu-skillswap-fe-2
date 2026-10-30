/**
 * @file VerifyEmailView.tsx
 * @description "Kiểm tra email của bạn" screen: 6-digit OTP boxes, resend countdown and a way
 * back to the register form.
 */

'use client';

import { Mail } from 'lucide-react';
import styles from '../components/Auth.module.css';
import { AuthFormAlert, AuthSubmitButton } from '../components/AuthFields';
import { AuthCard, AuthLayout } from '../components/AuthLayout';
import { OtpInput } from '../components/OtpInput';
import { useVerifyEmailLogic } from './useVerifyEmailLogic';

export function VerifyEmailView({ locale, email }: { locale: string; email: string }) {
  const {
    otpRef,
    digits,
    changeDigits,
    error,
    verifying,
    submit,
    secondsLeft,
    resending,
    resend,
    changeEmail,
  } = useVerifyEmailLogic(locale, email);

  return (
    <AuthLayout>
      <AuthCard>
        <span className={styles.mailBadge} aria-hidden="true">
          <Mail size={26} />
        </span>
        <div className={styles.headingGroup}>
          <h1 className={`${styles.heading} ${styles.headingSm}`}>Kiểm tra email của bạn</h1>
          <p className={styles.lead}>
            Nhập mã 6 số SkillSwap vừa gửi tới <strong>{email}</strong>. Không thấy thư? Xem thử mục
            Spam hoặc Quảng cáo.
          </p>
        </div>

        <form
          className={styles.form}
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
          noValidate
        >
          <fieldset className={styles.otpFieldset}>
            <legend className={styles.label}>Mã xác thực</legend>
            <OtpInput
              ref={otpRef}
              value={digits}
              onChange={changeDigits}
              invalid={Boolean(error)}
              disabled={verifying}
              describedBy={error ? 'otp-error' : undefined}
            />
          </fieldset>
          {error && (
            <div id="otp-error">
              <AuthFormAlert message={error} />
            </div>
          )}
          <AuthSubmitButton loading={verifying}>Xác thực và vào SkillSwap</AuthSubmitButton>
        </form>

        <div className={styles.resendRow}>
          {secondsLeft > 0 ? (
            <span>
              Gửi lại mã sau {Math.floor(secondsLeft / 60)}:
              {String(secondsLeft % 60).padStart(2, '0')}
            </span>
          ) : (
            <button type="button" className={styles.link} onClick={resend} disabled={resending}>
              Gửi lại mã
            </button>
          )}
          <button type="button" className={styles.link} onClick={changeEmail}>
            Đổi email
          </button>
        </div>
      </AuthCard>
    </AuthLayout>
  );
}
