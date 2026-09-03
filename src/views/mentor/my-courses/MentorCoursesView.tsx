/**
 * @file MentorCoursesView.tsx
 * @description Màn hình quản lý khóa học dành cho Mentor.
 */

import { BookOpen } from 'lucide-react';

export function MentorCoursesView() {
  return (
    <div className="space-y-5 pb-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Khóa học của tôi</h1>
        <p className="mt-1 text-sm text-slate-500">Quản lý nội dung và chương trình học của bạn.</p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white px-5 py-10 text-center shadow-sm sm:px-8 sm:py-14">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-[#119CF7]">
          <BookOpen className="h-6 w-6" aria-hidden="true" />
        </span>
        <h2 className="mt-4 text-base font-bold text-slate-900">Chưa có dữ liệu khóa học</h2>
        <p className="mx-auto mt-1 max-w-lg text-sm leading-6 text-slate-500">
          Danh sách khóa học sẽ hiển thị tại đây khi hệ thống cung cấp dữ liệu khóa học cho mentor.
        </p>
      </section>
    </div>
  );
}
