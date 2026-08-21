/**
 * @file AuthRequiredModal.tsx
 * @description Component Hộp thoại thông báo yêu cầu Đăng nhập dành cho Khách (Guest Mode Auth Modal).
 */

'use client';

import { Modal } from '@/components/ui/Modal';
import Link from 'next/link';

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
    <Modal open={open} hideHeader onClose={onClose} className="figma-auth-required-modal">
      <div className="figma-auth-modal-content">
        <button
          type="button"
          className="figma-auth-modal-close-icon"
          onClick={onClose}
          aria-label="Đóng"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="figma-auth-modal-badge" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        <h3>Yêu cầu xác thực tài khoản</h3>
        <p>{message || 'Bạn cần Đăng nhập hoặc Đăng ký tài khoản để sử dụng tính năng này.'}</p>

        <div className="figma-auth-modal-actions">
          <Link href={loginHref} className="figma-auth-modal-btn-login" onClick={onClose}>
            Đăng nhập ngay
          </Link>
          <button type="button" className="figma-auth-modal-btn-close" onClick={onClose}>
            Bỏ qua / Đóng
          </button>
        </div>
      </div>
    </Modal>
  );
}
