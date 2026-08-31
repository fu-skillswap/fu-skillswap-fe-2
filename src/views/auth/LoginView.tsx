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
    <main className="min-h-screen bg-white flex flex-col lg:flex-row">
      {/* Left Form Area */}
      <section className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-white" aria-label="Log in">
        <form className="w-full max-w-sm flex flex-col gap-5" noValidate onSubmit={submit}>
          <div className="flex flex-col items-center text-center gap-1 mb-1">
            <img
              src="/images/SkillSwap_Logo_Text.png"
              alt="SkillSwap"
              className="h-28 sm:h-32 max-w-full w-auto object-contain mx-auto"
            />
            <p className="text-xs text-text-muted m-0 mt-1">{adminOnly ? 'Cổng quản trị SkillSwap' : 'Kết nối - Học hỏi - Phát triển.'}</p>
          </div>

          {adminOnly ? (
            <div className="flex flex-col gap-1 p-4 rounded-2xl bg-amber-50 border border-solid border-amber-200">
              <span className="text-[11px] font-extrabold tracking-wider text-amber-800 uppercase">ADMIN PORTAL</span>
              <h1 className="text-lg font-bold text-slate-900 m-0">Đăng nhập quản trị</h1>
              <p className="text-xs text-amber-700 m-0">Chỉ tài khoản ADMIN hoặc SYSTEM_ADMIN được phép truy cập.</p>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-slate-100/80 p-1.5 rounded-2xl border border-solid border-slate-200/60" aria-label="Authentication mode">
              <span className="flex-1 text-center py-2 text-xs font-black text-slate-900 bg-white rounded-xl shadow-xs cursor-pointer">
                Đăng nhập
              </span>
              <span className="flex-1 text-center py-2 text-xs font-bold text-slate-500 cursor-pointer hover:text-slate-900 transition-colors">
                Đăng ký
              </span>
            </div>
          )}

          <div className="flex flex-col gap-4">
            <TextField
              label="Email"
              type="email"
              placeholder="your@email.com"
              autoComplete="email"
              error={errors.email?.message}
              {...register('email')}
            />
            <div>
              <TextField
                label="Mật khẩu"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                error={errors.password?.message}
                {...register('password')}
              />
              <span className="text-xs font-bold text-sky-600 hover:underline cursor-pointer block text-right mt-1.5" aria-disabled="true">
                Quên mật khẩu?
              </span>
            </div>
          </div>

          <Button className="w-full h-11 bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer border-none" type="submit" disabled={loading}>
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </Button>

          <div className="flex items-center gap-4 text-xs text-text-muted my-0.5 before:flex-1 before:h-px before:bg-border-light after:flex-1 after:h-px after:bg-border-light" aria-hidden="true">
            hoặc
          </div>

          <div className="flex justify-center w-full min-h-[44px]" aria-busy={googleLoading}>
            <div ref={googleButtonRef} />
          </div>

          {!adminOnly && (
            <p className="text-xs text-text-muted text-center m-0 mt-2">
              Chưa có tài khoản? <span className="text-sky-600 font-bold hover:underline cursor-pointer">Đăng ký</span>
            </p>
          )}
        </form>
      </section>

      {/* Right Hero / Metric Cards Area (Light Blue Tint Background) */}
      <aside className="hidden lg:flex flex-1 bg-sky-50/70 p-12 lg:p-16 flex-col justify-center items-center relative overflow-hidden" aria-label="Lợi ích SkillSwap">
        <div className="max-w-md mx-auto flex flex-col items-center text-center gap-6 relative z-10">
          <span className="w-14 h-14 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center shadow-2xs mx-auto" aria-hidden="true">
            <svg className="w-7 h-7 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
              <path d="m3 9 9-4 9 4-9 4z" />
              <path d="M7 11.2V16c2.8 2 7.2 2 10 0v-4.8M21 10v5" />
            </svg>
          </span>

          <h2 className="text-3xl lg:text-4xl font-black leading-tight tracking-tight text-slate-900 m-0 text-center">
            Học từ chuyên gia.
            <br />
            Phát triển sự nghiệp.
          </h2>

          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed m-0 text-center max-w-sm">
            Kết nối với các chuyên gia hàng đầu đã đi qua con đường bạn đang đi. Đặt lịch 1:1, học
            khóa học và tham gia cộng đồng đang phát triển mạnh mẽ.
          </p>

          <div className="grid grid-cols-2 gap-4 w-full pt-4">
            <div className="bg-white rounded-3xl p-5 text-center shadow-xs border border-solid border-slate-100/80 flex flex-col gap-1">
              <strong className="block text-2xl sm:text-3xl font-black text-sky-600">2,400+</strong>
              <span className="text-xs text-slate-500 font-semibold">Mentor đã xác thực</span>
            </div>
            <div className="bg-white rounded-3xl p-5 text-center shadow-xs border border-solid border-slate-100/80 flex flex-col gap-1">
              <strong className="block text-2xl sm:text-3xl font-black text-sky-600">18,000+</strong>
              <span className="text-xs text-slate-500 font-semibold">Phiên học hoàn thành</span>
            </div>
            <div className="bg-white rounded-3xl p-5 text-center shadow-xs border border-solid border-slate-100/80 flex flex-col gap-1">
              <strong className="block text-2xl sm:text-3xl font-black text-sky-600">94%</strong>
              <span className="text-xs text-slate-500 font-semibold">Tỷ lệ hài lòng</span>
            </div>
            <div className="bg-white rounded-3xl p-5 text-center shadow-xs border border-solid border-slate-100/80 flex flex-col gap-1">
              <strong className="block text-2xl sm:text-3xl font-black text-sky-600">120+</strong>
              <span className="text-xs text-slate-500 font-semibold">Danh mục kỹ năng</span>
            </div>
          </div>
        </div>
      </aside>
    </main>
  );
}
