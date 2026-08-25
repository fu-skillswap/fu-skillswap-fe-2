/**
 * @file AuthRequiredModal.tsx
 * @description Component Hộp thoại thông báo yêu cầu Đăng nhập dành cho Khách (Guest Mode Auth Modal).
 */

'use client';

import { Modal } from '@/components/ui/Modal';
import Link from 'next/link';
import { Lock, X } from 'lucide-react';

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
          <X aria-hidden="true" />
        </button>

        <div className="figma-auth-modal-badge" aria-hidden="true">
          <Lock aria-hidden="true" />
        </div>

        <h3>Yêu cầu xác thực tài khoản</h3>
        <p>
          {message || 'Bạn cần Đăng nhập hoặc Đăng ký tài khoản để tiếp tục sử dụng tính năng này.'}
        </p>

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
