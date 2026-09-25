/**
 * @file LoginView.tsx
 * @description React Component giao diện trang Đăng nhập (Login Page View) sử dụng React Hook Form.
 * Hiển thị form đăng nhập, hỗ trợ Google Identity Services native button,
 * và hiển thị bảng thông tin giới thiệu SkillSwap.
 */

'use client';

import { showError } from '@/utils/toast';
import Image from 'next/image';
import { useEffect } from 'react';
import { useLoginLogic } from './useLoginLogic';

/**
 * Component trang Đăng nhập SkillSwap.
 * @param props.locale - Mã ngôn ngữ hiện tại của route (ví dụ: "vi", "en")
 */
export function LoginView({ locale, adminOnly = false }: { locale: string; adminOnly?: boolean }) {
  const { error, clearError, googleLoading, googleButtonRef } = useLoginLogic(locale, adminOnly);

  useEffect(() => {
    if (!error) return;
    showError(error, {
      title: 'Không thể đăng nhập',
      description: 'Vui lòng kiểm tra thông tin và thử lại.',
    });
    clearError();
  }, [clearError, error]);

  return (
    <main className="flex min-h-screen w-full min-w-0 flex-col overflow-x-hidden bg-[#f4faff] xl:flex-row">
      {/* Left Form Area */}
      <section
        className="relative flex w-full min-w-0 flex-1 items-center justify-center overflow-hidden bg-[linear-gradient(160deg,#f8fcff_0%,#eef8ff_52%,#f9fcff_100%)] px-4 py-8 before:pointer-events-none before:absolute before:-top-20 before:-left-20 before:h-52 before:w-52 before:rounded-full before:bg-[rgba(17,156,247,0.10)] before:content-[''] after:pointer-events-none after:-right-28 after:-bottom-28 after:h-72 after:w-72 after:rounded-full after:bg-[rgba(17,156,247,0.10)] after:content-[''] sm:p-12 sm:before:-top-28 sm:before:-left-28 sm:before:h-72 sm:before:w-72 sm:after:-right-40 sm:after:-bottom-40 sm:after:h-96 sm:after:w-96 xl:p-16"
        aria-label="Log in"
      >
        <section className="relative z-10 mx-auto flex w-[calc(100dvw-32px)] max-w-[440px] shrink-0 flex-col items-center rounded-[24px] border border-solid border-[#cfe4f5] bg-white/[0.96] px-5 py-8 text-center shadow-[0_24px_70px_rgba(18,56,110,0.16),0_4px_16px_rgba(17,156,247,0.08)] ring-1 ring-white/90 backdrop-blur-sm sm:w-full sm:px-10 sm:py-10">
          <Image
            src="/images/SkillSwap_Logo_Text.png"
            alt="SkillSwap"
            width={360}
            height={128}
            priority
            className="h-auto w-[220px] object-contain sm:w-[240px]"
          />
          <h1 className="mb-0 mt-6 text-[28px] font-semibold leading-tight text-[#1E3A5F] sm:text-[30px]">
            Đăng nhập SkillSwap
          </h1>
          <p className="mb-0 mt-2 text-[15px] leading-6 text-[#6B7A90] sm:text-base">
            Tiếp tục bằng tài khoản Google của bạn.
          </p>

          <div
            className="relative mt-8 flex min-h-14 w-full items-center justify-center"
            aria-busy={googleLoading}
          >
            <div ref={googleButtonRef} className="flex w-full items-center justify-center" />
            {googleLoading && (
              <div
                className="absolute inset-0 flex cursor-wait items-center justify-center rounded-xl border border-solid border-[#D7DEE8] bg-white text-sm font-semibold text-[#6B7A90] shadow-xs"
                aria-label="Đang chuẩn bị đăng nhập bằng Google"
              >
                <span
                  className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-solid border-primary border-t-transparent"
                  aria-hidden="true"
                />
                Đang tải...
              </div>
            )}
          </div>

          <p className="mb-0 mt-8 text-sm leading-6 text-[#6B7A90]">
            Khi tiếp tục, bạn đồng ý với{' '}
            <span className="font-medium text-primary">Điều khoản</span> và{' '}
            <span className="font-medium text-primary">Chính sách quyền riêng tư</span>.
          </p>
        </section>
      </section>

      {/* Right Hero / Metric Cards Area (Light Blue Tint Background) */}
      <aside
        className="relative hidden flex-1 items-center justify-center overflow-hidden bg-sky-50/70 p-12 before:pointer-events-none before:absolute before:-top-32 before:-right-32 before:h-80 before:w-80 before:rounded-full before:bg-[rgba(17,156,247,0.10)] before:content-[''] after:pointer-events-none after:absolute after:-bottom-72 after:-left-72 after:h-[440px] after:w-[440px] after:rounded-full after:border-[64px] after:border-solid after:border-[rgba(17,156,247,0.07)] after:shadow-[0_0_0_72px_rgba(0,119,204,0.05)] after:content-[''] xl:flex xl:flex-col xl:p-16"
        aria-label="Lợi ích SkillSwap"
      >
        <div className="max-w-md mx-auto flex flex-col items-center text-center gap-6 relative z-10">
          <Image
            src="/images/Koko.png"
            alt="Koko, linh vật SkillSwap"
            width={112}
            height={112}
            priority
            className="mx-auto h-24 w-auto object-contain xl:h-28"
          />

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
            <div className="flex flex-col gap-1 rounded-3xl border border-solid border-[#d8e9f6] bg-white p-5 text-center shadow-[0_12px_30px_rgba(18,56,110,0.10)]">
              <strong className="block text-2xl sm:text-3xl font-black text-sky-600">2,400+</strong>
              <span className="text-xs text-slate-500 font-semibold">Mentor đã xác thực</span>
            </div>
            <div className="flex flex-col gap-1 rounded-3xl border border-solid border-[#d8e9f6] bg-white p-5 text-center shadow-[0_12px_30px_rgba(18,56,110,0.10)]">
              <strong className="block text-2xl sm:text-3xl font-black text-sky-600">
                18,000+
              </strong>
              <span className="text-xs text-slate-500 font-semibold">Phiên học hoàn thành</span>
            </div>
            <div className="flex flex-col gap-1 rounded-3xl border border-solid border-[#d8e9f6] bg-white p-5 text-center shadow-[0_12px_30px_rgba(18,56,110,0.10)]">
              <strong className="block text-2xl sm:text-3xl font-black text-sky-600">94%</strong>
              <span className="text-xs text-slate-500 font-semibold">Tỷ lệ hài lòng</span>
            </div>
            <div className="flex flex-col gap-1 rounded-3xl border border-solid border-[#d8e9f6] bg-white p-5 text-center shadow-[0_12px_30px_rgba(18,56,110,0.10)]">
              <strong className="block text-2xl sm:text-3xl font-black text-sky-600">120+</strong>
              <span className="text-xs text-slate-500 font-semibold">Danh mục kỹ năng</span>
            </div>
          </div>
        </div>
      </aside>
    </main>
  );
}
