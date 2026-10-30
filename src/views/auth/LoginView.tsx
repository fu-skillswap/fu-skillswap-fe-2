/**
 * @file LoginView.tsx
 * @description React Component giao diện trang Đăng nhập (Login Page View).
 * Google Identity Services button + email/password form, inside the shared auth layout.
 */

'use client';

import { showError } from '@/utils/toast';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AuthCard, AuthLayout } from './components/AuthLayout';
import {
  AuthDivider,
  AuthFormAlert,
  AuthInput,
  AuthLegalFooter,
  AuthPasswordInput,
  AuthSubmitButton,
  GoogleButtonSlot,
} from './components/AuthFields';
import styles from './components/Auth.module.css';
import { SUPPORT_EMAIL } from './useAuthFlow';
import { useLoginLogic } from './useLoginLogic';

/**
 * Component trang Đăng nhập SkillSwap.
 * @param props.locale - Mã ngôn ngữ hiện tại của route (ví dụ: "vi", "en")
 * @param props.adminOnly - Admin portal variant: no sign-up links
 */
export function LoginView({ locale, adminOnly = false }: { locale: string; adminOnly?: boolean }) {
  const { error, clearError, googleLoading, googleButtonRef, form, formError, loading, submit } =
    useLoginLogic(locale, adminOnly);
  const [forgotOpen, setForgotOpen] = useState(false);
  const {
    register,
    formState: { errors },
  } = form;

  useEffect(() => {
    if (!error) return;
    showError(error, {
      title: 'Đăng nhập chưa thành công',
      description: 'Vui lòng thử lại sau ít phút.',
    });
    clearError();
  }, [clearError, error]);

  return (
    <AuthLayout>
      <AuthCard>
        <div className={styles.headingGroup}>
          <h1 className={styles.heading}>{adminOnly ? 'Đăng nhập quản trị' : 'Đăng nhập'}</h1>
          {!adminOnly && (
            <p className={styles.lead}>
              Chưa có tài khoản?{' '}
              <Link href={`/${locale}/register`} className={styles.link}>
                Tạo tài khoản
              </Link>
            </p>
          )}
        </div>

        <GoogleButtonSlot buttonRef={googleButtonRef} loading={googleLoading} />
        <AuthDivider />

        <form className={styles.form} onSubmit={submit} noValidate>
          <AuthInput
            id="login-email"
            label="Email"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />
          <AuthPasswordInput
            id="login-password"
            label="Mật khẩu"
            autoComplete="current-password"
            error={errors.password?.message}
            labelAction={
              <button
                type="button"
                className={`${styles.link} ${styles.labelLink}`}
                aria-expanded={forgotOpen}
                aria-controls="forgot-password-panel"
                onClick={() => setForgotOpen((open) => !open)}
              >
                Quên mật khẩu?
              </button>
            }
            {...register('password')}
          />
          {forgotOpen && (
            <p id="forgot-password-panel" className={styles.panel} role="status">
              Tính năng đặt lại mật khẩu đang được hoàn thiện. Nếu email của bạn là Gmail, hãy dùng
              nút “Tiếp tục với Google”. Hoặc gửi email tới{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`} className={styles.link}>
                {SUPPORT_EMAIL}
              </a>{' '}
              để được hỗ trợ.
            </p>
          )}
          <AuthFormAlert message={formError} />
          <AuthSubmitButton loading={loading}>Đăng nhập</AuthSubmitButton>
        </form>

        {!adminOnly && (
          <p className={styles.note}>
            Muốn chia sẻ kinh nghiệm? Đăng nhập rồi chọn “Đăng ký làm Mentor” trong trang cá nhân.
          </p>
        )}
        <AuthLegalFooter locale={locale} action="continue" />
      </AuthCard>
    </AuthLayout>
  );
}
