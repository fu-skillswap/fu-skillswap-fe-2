/**
 * @file not-found.tsx
 * @description Trang báo lỗi 404 Không tìm thấy trang (404 Not Found Page Component).
 */

import Link from 'next/link';
import { Home, LayoutDashboard } from 'lucide-react';

const linkBase =
  'inline-flex h-11 items-center justify-center gap-2 rounded-full border border-solid px-6 text-sm font-bold whitespace-nowrap transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 outline-none focus-visible:ring-4 focus-visible:ring-primary/20';

/**
 * Component hiển thị màn hình 404 tùy chỉnh với hình ảnh linh vật Cú SkillSwap.
 * The mascot artwork already contains the "404" lettering, so it is not repeated as text.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[radial-gradient(circle_at_top,var(--primary-light),var(--bg)_60%)] px-4 py-10">
      <section
        aria-labelledby="not-found-title"
        className="flex w-full max-w-md flex-col items-center rounded-lg border border-solid border-border-color bg-surface px-6 py-8 text-center shadow-md sm:max-w-lg sm:px-10 sm:py-10"
      >
        <img
          src="/images/SkillSwap_Logo_Text.png"
          alt="SkillSwap"
          className="h-6 w-auto object-contain sm:h-7"
        />

        <img
          src="/images/Koko_404.png"
          alt="Cú KooKoo đội mũ tốt nghiệp đang khóc bên cạnh số 404"
          width={1500}
          height={1500}
          className="mt-4 aspect-square w-full max-w-[240px] object-contain sm:max-w-[300px]"
        />

        <span className="sr-only">Lỗi 404</span>
        <h1
          id="not-found-title"
          className="mt-4 text-2xl font-extrabold tracking-tight text-text-main sm:text-3xl"
        >
          Trang này đã bay mất rồi
        </h1>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-text-secondary sm:text-base">
          Đường dẫn có thể không tồn tại hoặc đã được thay đổi. Cú nhỏ sẽ dẫn bạn quay lại bảng tin.
        </p>

        <div className="mt-7 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Link
            href="/vi/dashboard"
            className={`${linkBase} border-primary bg-primary text-white shadow-blue hover:bg-primary-hover hover:shadow-blue-lg`}
          >
            <LayoutDashboard size={18} aria-hidden="true" />
            Về Bảng tin
          </Link>
          <Link
            href="/vi"
            className={`${linkBase} border-border-color bg-surface text-text-main hover:border-primary-border hover:bg-primary-light hover:text-primary`}
          >
            <Home size={18} aria-hidden="true" />
            Trang chủ
          </Link>
        </div>
      </section>
    </main>
  );
}
