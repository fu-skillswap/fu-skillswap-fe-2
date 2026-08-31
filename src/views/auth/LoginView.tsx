/**
 * @file LoginView.tsx
 * @description React Component giao diện trang Đăng nhập (Login Page View) sử dụng React Hook Form.
 * Hiển thị form đăng nhập, hỗ trợ Google Identity Services native button,
 * và hiển thị bảng thông tin giới thiệu SkillSwap.
 */

'use client';

import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { showError } from '@/utils/toast';
import { useEffect } from 'react';
import { useLoginLogic } from './useLoginLogic';

/**
 * Component trang Đăng nhập SkillSwap.
 * @param props.locale - Mã ngôn ngữ hiện tại của route (ví dụ: "vi", "en")
 */
export function LoginView({ locale, adminOnly = false }: { locale: string; adminOnly?: boolean }) {
  const { form, error, clearError, loading, googleLoading, submit, googleButtonRef } =
    useLoginLogic(locale, adminOnly);

  const {
    register,
    formState: { errors },
  } = form;

  useEffect(() => {
    if (!error) return;
    showError(error, {
      title: 'Không thể đăng nhập',
      description: 'Vui lòng kiểm tra thông tin và thử lại.',
    });
    clearError();
  }, [clearError, error]);

  return (
    <main className="figma-login-page">
      <section className="figma-login-panel" aria-label="Log in">
        <form className="figma-login-form" noValidate onSubmit={submit}>
          <div className="figma-login-brand">
            <img
              src="/images/SkillSwap_Logo_Text.png"
              alt="SkillSwap"
              className="figma-login-logo-text"
            />
            <p>{adminOnly ? 'Cổng quản trị SkillSwap' : 'Kết nối - Học hỏi - Phát triển.'}</p>
          </div>

          {adminOnly ? (
            <div className="figma-login-admin-heading">
              <span>ADMIN PORTAL</span>
              <h1>Đăng nhập quản trị</h1>
              <p>Chỉ tài khoản ADMIN hoặc SYSTEM_ADMIN được phép truy cập.</p>
            </div>
          ) : (
            <div className="figma-login-tabs" aria-label="Authentication mode">
              <span className="figma-login-tab figma-login-tab-active">Đăng nhập</span>
              <span className="figma-login-tab">Đăng ký</span>
            </div>
          )}

          <div className="figma-login-fields">
            <TextField
              label="Email"
              type="email"
              placeholder="your@email.com"
              autoComplete="email"
              error={errors.email?.message}
              {...register('email')}
            />
            <TextField
              label="Mật khẩu"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              error={errors.password?.message}
              {...register('password')}
            />
          </div>
          <span className="figma-login-forgot" aria-disabled="true">
            Quên mật khẩu?
          </span>
          <Button className="figma-login-submit" type="submit" disabled={loading}>
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </Button>
          <div className="figma-login-divider" aria-hidden="true">
            <span />
            hoặc
            <span />
          </div>
          <div className="figma-login-google" aria-busy={googleLoading}>
            <div ref={googleButtonRef} />
          </div>
          {!adminOnly && (
            <p className="figma-login-signup">
              Chưa có tài khoản? <span>Đăng ký</span>
            </p>
          )}
        </form>
      </section>

      <aside className="figma-login-visual" aria-label="Lợi ích SkillSwap">
        <div className="figma-login-visual-content">
          <span className="figma-login-cap" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="m3 9 9-4 9 4-9 4z" />
              <path d="M7 11.2V16c2.8 2 7.2 2 10 0v-4.8M21 10v5" />
            </svg>
          </span>
          <h2>
            Học từ chuyên gia.
            <br />
            Phát triển sự nghiệp.
          </h2>
          <p>
            Kết nối với các chuyên gia hàng đầu đã đi qua con đường bạn đang đi. Đặt lịch 1:1, học
            khóa học và tham gia cộng đồng đang phát triển mạnh mẽ.
          </p>
          <div className="figma-login-metrics">
            <div>
              <strong>2,400+</strong>
              <span>Mentor đã xác thực</span>
            </div>
            <div>
              <strong>18,000+</strong>
              <span>Phiên học hoàn thành</span>
            </div>
            <div>
              <strong>94%</strong>
              <span>Tỷ lệ hài lòng</span>
            </div>
            <div>
              <strong>120+</strong>
              <span>Danh mục kỹ năng</span>
            </div>
          </div>
        </div>
      </aside>
    </main>
  );
}
