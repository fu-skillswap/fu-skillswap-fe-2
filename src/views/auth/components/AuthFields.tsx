/**
 * @file AuthFields.tsx
 * @description Small form building blocks shared by the auth screens (inputs, password toggle,
 * divider, submit button, Google button slot, legal footer).
 */

'use client';

import { Eye, EyeOff, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useState, type InputHTMLAttributes, type ReactNode, type Ref } from 'react';
import styles from './Auth.module.css';

interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  error?: string;
  helper?: ReactNode;
  /** Extra element on the label row, right-aligned (e.g. "Quên mật khẩu?"). */
  labelAction?: ReactNode;
  /** Content rendered after the input (e.g. the password checklist). */
  after?: ReactNode;
  ref?: Ref<HTMLInputElement>;
}

function describedBy(id: string, helper?: ReactNode, error?: string) {
  const ids = [helper ? `${id}-helper` : null, error ? `${id}-error` : null].filter(Boolean);
  return ids.length ? ids.join(' ') : undefined;
}

export function AuthInput({
  id,
  label,
  error,
  helper,
  labelAction,
  after,
  className,
  ...inputProps
}: AuthInputProps) {
  return (
    <div className={styles.field}>
      <div className={styles.labelRow}>
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
        {labelAction}
      </div>
      <input
        id={id}
        className={`${styles.input} ${className ?? ''}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, helper, error)}
        {...inputProps}
      />
      {helper && (
        <p id={`${id}-helper`} className={styles.helper}>
          {helper}
        </p>
      )}
      {after}
      {error && (
        <p id={`${id}-error`} className={styles.fieldError}>
          {error}
        </p>
      )}
    </div>
  );
}

export function AuthPasswordInput({
  id,
  label,
  error,
  helper,
  labelAction,
  after,
  className,
  ...inputProps
}: AuthInputProps) {
  const [visible, setVisible] = useState(false);
  return (
    <div className={styles.field}>
      <div className={styles.labelRow}>
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
        {labelAction}
      </div>
      <div className={styles.inputWrap}>
        <input
          id={id}
          {...inputProps}
          type={visible ? 'text' : 'password'}
          className={`${styles.input} ${styles.inputWithToggle} ${className ?? ''}`}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, helper, error)}
        />
        <button
          type="button"
          className={styles.eyeButton}
          aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          aria-pressed={visible}
          onClick={() => setVisible((value) => !value)}
        >
          {visible ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
        </button>
      </div>
      {helper && (
        <p id={`${id}-helper`} className={styles.helper}>
          {helper}
        </p>
      )}
      {after}
      {error && (
        <p id={`${id}-error`} className={styles.fieldError}>
          {error}
        </p>
      )}
    </div>
  );
}

export function AuthDivider() {
  return <div className={styles.divider}>hoặc dùng email</div>;
}

export function AuthSubmitButton({
  loading,
  disabled,
  children,
}: {
  loading: boolean;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="submit"
      className={styles.primaryButton}
      disabled={loading || disabled}
      aria-busy={loading}
    >
      {loading && <Loader2 size={18} className={styles.spin} aria-hidden="true" />}
      {children}
    </button>
  );
}

/** Container the Google Identity Services button renders into, with a loading overlay. */
export function GoogleButtonSlot({
  buttonRef,
  loading,
}: {
  buttonRef: Ref<HTMLDivElement>;
  loading: boolean;
}) {
  return (
    <div className={styles.googleSlot} aria-busy={loading}>
      <div ref={buttonRef} className={styles.googleTarget} />
      {loading && (
        <div className={styles.googleLoading} aria-label="Đang chuẩn bị đăng nhập bằng Google">
          <Loader2 size={16} className={styles.spin} aria-hidden="true" />
          Đang tải...
        </div>
      )}
    </div>
  );
}

export function AuthFormAlert({ message }: { message?: ReactNode }) {
  if (!message) return null;
  return (
    <p className={styles.formAlert} role="alert">
      {message}
    </p>
  );
}

/** Age + terms footer. There is no terms page yet, so only the privacy policy is a link. */
export function AuthLegalFooter({
  locale,
  action,
}: {
  locale: string;
  action: 'continue' | 'register';
}) {
  return (
    <p className={styles.footer}>
      SkillSwap dành cho người dùng từ 18 tuổi. Khi{' '}
      {action === 'register' ? 'tạo tài khoản' : 'tiếp tục'}, bạn đồng ý với{' '}
      <span className={styles.footerLink}>Điều khoản</span> và{' '}
      <Link href={`/${locale}/chinh-sach-bao-mat`} className={styles.footerLink}>
        Chính sách bảo mật
      </Link>
      .
    </p>
  );
}
