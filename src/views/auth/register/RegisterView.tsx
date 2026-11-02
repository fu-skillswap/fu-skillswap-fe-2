/**
 * @file RegisterView.tsx
 * @description Sign-up screen: Google button + name / email / password form with a live
 * password checklist.
 */

'use client';

import { passwordRules } from '@/models/schemas/authSchema';
import { showError } from '@/utils/toast';
import { CheckCircle2, Circle } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';
import styles from '../components/Auth.module.css';
import {
  AuthDivider,
  AuthFormAlert,
  AuthInput,
  AuthLegalFooter,
  AuthPasswordInput,
  AuthSubmitButton,
  GoogleButtonSlot,
} from '../components/AuthFields';
import { AuthCard, AuthLayout } from '../components/AuthLayout';
import { useRegisterLogic } from './useRegisterLogic';

export function RegisterView({ locale }: { locale: string }) {
  const { error, clearError, googleLoading, googleButtonRef, form, formError, loading, submit } =
    useRegisterLogic(locale);
  const {
    register,
    watch,
    formState: { errors },
  } = form;
  const password = watch('password') ?? '';
  const loginHref = `/${locale}/login`;

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
          <h1 className={styles.heading}>Tạo tài khoản</h1>
          <p className={styles.lead}>
            Đã có tài khoản?{' '}
            <Link href={loginHref} className={styles.link}>
              Đăng nhập
            </Link>
          </p>
        </div>

        <GoogleButtonSlot buttonRef={googleButtonRef} loading={googleLoading} />
        <AuthDivider />

        <form className={styles.form} onSubmit={submit} noValidate>
          <AuthInput
            id="register-name"
            label="Họ và tên"
            type="text"
            autoComplete="name"
            maxLength={150}
            error={errors.fullName?.message}
            {...register('fullName')}
          />
          <AuthInput
            id="register-email"
            label="Email"
            type="email"
            autoComplete="email"
            maxLength={255}
            helper="Từng đăng nhập bằng Google? Nhập đúng Gmail đó để đặt thêm mật khẩu cho tài khoản cũ."
            error={errors.email?.message}
            {...register('email')}
          />
          <AuthPasswordInput
            id="register-password"
            label="Mật khẩu"
            autoComplete="new-password"
            maxLength={64}
            error={errors.password?.message}
            after={
              <ul className={styles.checklist} aria-label="Yêu cầu mật khẩu">
                {passwordRules.map((rule) => {
                  const met = rule.test(password);
                  return (
                    <li
                      key={rule.id}
                      className={`${styles.checkItem} ${met ? styles.checkItemMet : ''}`}
                    >
                      {met ? (
                        <CheckCircle2 size={16} aria-hidden="true" />
                      ) : (
                        <Circle size={16} aria-hidden="true" />
                      )}
                      <span>
                        {rule.label}
                        <span className="sr-only">{met ? ' (đã đạt)' : ' (chưa đạt)'}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            }
            {...register('password')}
          />

          <AuthFormAlert
            message={
              formError?.kind === 'already-registered' ? (
                <>
                  Email này đã có tài khoản.{' '}
                  <Link href={loginHref} className={styles.link}>
                    Đăng nhập
                  </Link>
                </>
              ) : (
                formError?.text
              )
            }
          />
          <AuthSubmitButton loading={loading}>Tạo tài khoản</AuthSubmitButton>
        </form>

        <AuthLegalFooter locale={locale} action="register" />
      </AuthCard>
    </AuthLayout>
  );
}
