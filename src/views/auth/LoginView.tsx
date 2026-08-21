/**
 * @file LoginView.tsx
 * @description React Component giao diện trang Đăng nhập (Login Page View) sử dụng React Hook Form.
 * Hiển thị form đăng nhập với lựa chọn vai trò (Mentee, Mentor, Admin, SysAdmin),
 * hỗ trợ Đăng nhập bằng Google Identity Services native button, và hiển thị bảng thông tin giới thiệu SkillSwap.
 */

"use client";

import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { useEffect, useState } from "react";
import { useLoginLogic } from "./useLoginLogic";

/** Danh sách các vai trò đăng nhập có sẵn trong giao diện */
const signInRoles = [
  { id: "mentee", name: "Mentee", description: "Học từ các chuyên gia" },
  { id: "mentor", name: "Mentor", description: "Chia sẻ kiến thức" },
  { id: "admin", name: "Admin", description: "Quản lý nền tảng" },
  { id: "system-admin", name: "System Admin", description: "Quản lý hệ thống" },
] as const;

/**
 * Component trang Đăng nhập SkillSwap.
 * @param props.locale - Mã ngôn ngữ hiện tại của route (ví dụ: "vi", "en")
 */
export function LoginView({ locale }: { locale: string }) {
  const {
    form,
    error,
    clearError,
    loading,
    googleLoading,
    submit,
    googleButtonRef,
  } = useLoginLogic(locale);
  const [selectedRole, setSelectedRole] =
    useState<(typeof signInRoles)[number]["id"]>("mentee");

  const {
    register,
    formState: { errors },
  } = form;

  /** Tự động ẩn thông báo lỗi sau 7 giây */
  useEffect(() => {
    if (!error) return;
    const timeout = window.setTimeout(clearError, 7000);
    return () => window.clearTimeout(timeout);
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
            <p>Kết nối - Học hỏi - Phát triển.</p>
          </div>

          <div className="figma-login-tabs" aria-label="Authentication mode">
            <span className="figma-login-tab figma-login-tab-active">
              Đăng nhập
            </span>
            <span className="figma-login-tab">Đăng ký</span>
          </div>

          <div className="figma-login-fields">
            <TextField
              label="Email"
              type="email"
              placeholder="your@email.com"
              autoComplete="email"
              error={errors.email?.message}
              {...register("email")}
            />
            <TextField
              label="Mật khẩu"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              error={errors.password?.message}
              {...register("password")}
            />
          </div>
          <span className="figma-login-forgot" aria-disabled="true">
            Quên mật khẩu?
          </span>
          <Button
            className="figma-login-submit"
            type="submit"
            disabled={loading}
          >
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </Button>
          <div className="figma-login-divider" aria-hidden="true">
            <span />
            hoặc
            <span />
          </div>
          <div className="figma-login-google" aria-busy={googleLoading}>
            <div ref={googleButtonRef} />
          </div>
          <p className="figma-login-signup">
            Chưa có tài khoản? <span>Đăng ký</span>
          </p>
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
            Kết nối với các chuyên gia hàng đầu đã đi qua con đường bạn đang đi.
            Đặt lịch 1:1, học khóa học và tham gia cộng đồng đang phát triển
            mạnh mẽ.
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
      {error && (
        <div
          className="figma-toast figma-toast-error"
          role="alert"
          aria-live="assertive"
        >
          <span className="figma-toast-icon" aria-hidden="true">
            !
          </span>
          <div>
            <strong>Không thể đăng nhập</strong>
            <p>{error}</p>
          </div>
          <button
            type="button"
            aria-label="Đóng thông báo"
            onClick={clearError}
          >
            ×
          </button>
        </div>
      )}
    </main>
  );
}
