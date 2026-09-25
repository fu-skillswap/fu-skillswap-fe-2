/**
 * @file AuthRequiredModal.tsx
 * @description Component Hộp thoại thông báo yêu cầu Đăng nhập dành cho Khách (Guest Mode Auth Modal).
 */

'use client';

import { ArrowRight, LockKeyhole, X } from 'lucide-react';
import Link from 'next/link';
import { Modal } from '@/components/ui/Modal';

interface AuthRequiredModalProps {
  /** Trạng thái bật/tắt modal */
  open: boolean;
  /** Thông điệp tùy chỉnh hiển thị trong modal */
  message?: string;
  /** Mã locale ngôn ngữ hiện tại */
  locale?: string;
  /** Callback đóng modal */
  onClose: () => void;
}

/**
 * Component Popup hiển thị khi Khách (Guest) thực hiện các thao tác riêng tư/trả phí hoặc khi nhận lỗi 401.
 */
export function AuthRequiredModal({
  open,
  message,
  locale = 'vi',
  onClose,
}: AuthRequiredModalProps) {
  const loginHref = `/${locale}/login`;

  return (
    <Modal
      open={open}
      hideHeader
      onClose={onClose}
      className="max-w-[460px] rounded-[28px] border border-primary-border/70 shadow-[0_24px_70px_rgba(18,56,110,0.22)]"
      contentClassName="p-0 sm:p-0 overflow-visible"
      overlayClassName="bg-[#12386e]/45 backdrop-blur-sm"
    >
      <div className="relative overflow-hidden px-6 pt-7 pb-6 text-center sm:px-8 sm:pt-8 sm:pb-7">
        <div
          className="pointer-events-none absolute -top-20 left-1/2 h-44 w-72 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
          aria-hidden="true"
        />
        <button
          type="button"
          className="absolute top-4 right-4 z-10 grid h-9 w-9 place-items-center rounded-full text-text-muted transition hover:bg-primary-light hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          onClick={onClose}
          aria-label="Đóng"
        >
          <X className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
        </button>

        <div
          className="relative mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[linear-gradient(145deg,#e8f5ff,#ffffff)] text-primary shadow-[0_10px_28px_rgba(17,156,247,0.16)] ring-1 ring-primary-border/70"
          aria-hidden="true"
        >
          <LockKeyhole className="h-7 w-7" strokeWidth={1.8} />
        </div>

        <h3 className="relative mt-5 text-xl leading-tight font-extrabold tracking-[-0.02em] text-[#12386e] sm:text-[22px]">
          Yêu cầu xác thực tài khoản
        </h3>
        <p className="relative mx-auto mt-3 max-w-[340px] text-sm leading-6 text-[#5c718d]">
          {message || 'Bạn cần Đăng nhập hoặc Đăng ký tài khoản để tiếp tục sử dụng tính năng này.'}
        </p>

        <div className="relative mt-6">
          <Link
            href={loginHref}
            className="inline-flex h-12 w-full min-w-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-primary px-5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(17,156,247,0.22)] transition hover:-translate-y-px hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            onClick={onClose}
          >
            Đăng nhập ngay
            <ArrowRight className="h-4 w-4 shrink-0" strokeWidth={1.8} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </Modal>
  );
}
