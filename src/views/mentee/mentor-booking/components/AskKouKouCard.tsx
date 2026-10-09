/**
 * @file AskKouKouCard.tsx
 * @description Thẻ "Chưa thấy người hợp?": mời Mentee hỏi KouKou hoặc đăng câu hỏi lên Bảng tin.
 * Dùng để lấp ô trống khi có ít mentor và làm trạng thái rỗng khi tìm không ra.
 */

'use client';

import Link from 'next/link';

export function openKouKou() {
  window.dispatchEvent(new CustomEvent('skillswap:open-koukou'));
}

export function AskKouKouCard({
  locale,
  title = 'Chưa thấy người hợp?',
  className = '',
}: {
  locale: string;
  title?: string;
  className?: string;
}) {
  return (
    <div
      className={`flex h-full flex-col items-start gap-3 rounded-[20px] border-2 border-dashed border-[#93C5FD] bg-white/60 p-5 ${className}`}
    >
      <img src="/images/Koko.png" alt="" className="h-14 w-14 object-contain" />
      <h3 className="m-0 text-[16.5px] font-extrabold text-text-main">{title}</h3>
      <p className="m-0 text-sm leading-relaxed text-slate-600">
        Kể cho KouKou bạn cần gì: môn đang học, đồ án hay chuẩn bị OJT. KouKou sẽ tìm trong danh
        sách mentor giúp bạn.
      </p>
      <div className="mt-auto flex w-full flex-col items-center gap-2 pt-2">
        <button
          type="button"
          onClick={openKouKou}
          className="inline-flex h-11 w-full cursor-pointer items-center justify-center rounded-xl border border-solid border-primary bg-white px-4 text-sm font-bold text-primary transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
        >
          Hỏi KouKou
        </button>
        <Link
          href={`/${locale}/dashboard`}
          className="inline-flex min-h-11 items-center text-sm font-bold text-primary no-underline hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
        >
          Đăng câu hỏi lên Bảng tin
        </Link>
      </div>
    </div>
  );
}
