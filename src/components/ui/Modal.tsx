/**
 * @file Modal.tsx
 * @description Component Hộp thoại nổi dùng chung (Reusable UI Modal Dialog Component).
 * Tự động lắng nghe phím Escape để đóng hộp thoại và ngăn chặn sự kiện nổi bọt trên backdrop.
 */

'use client';

import { useEffect } from 'react';

/** Props khởi tạo cho Modal Component */
interface ModalProps {
  /** Trạng thái ẩn/hiện Modal */
  open: boolean;
  /** Tiêu đề của Modal (tùy chọn) */
  title?: string;
  /** Ẩn thanh header mặc định nếu tự render header riêng */
  hideHeader?: boolean;
  /** Callback xử lý đóng Modal */
  onClose: () => void;
  /** Nội dung bên trong Modal */
  children: React.ReactNode;
  /** Class CSS bổ sung */
  className?: string;
}

/**
 * Component Modal hiển thị popup đè trên giao diện.
 */
export function Modal({
  open,
  title,
  hideHeader = false,
  onClose,
  children,
  className = '',
}: ModalProps) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 bg-slate-950/50 backdrop-blur-md z-[99999] flex items-center justify-center p-4 sm:p-6 transition-all duration-300"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        className={`bg-white rounded-3xl shadow-2xl border border-solid border-border-light/80 w-full max-w-lg overflow-hidden flex flex-col transition-all animate-in fade-in-0 zoom-in-95 duration-200 ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Hộp thoại'}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {!hideHeader && (
          <div className="px-6 py-4.5 border-b border-solid border-border-light/70 flex items-center justify-between gap-4 bg-slate-50/50">
            {title && <h2 className="m-0 text-base font-extrabold text-text-main tracking-tight">{title}</h2>}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="w-8.5 h-8.5 rounded-full inline-flex items-center justify-center text-text-muted hover:text-text-main hover:bg-slate-200/60 transition-all text-lg font-bold border-none bg-transparent cursor-pointer active:scale-95"
            >
              ×
            </button>
          </div>
        )}
        <div className="p-6 overflow-y-auto">{children}</div>
      </section>
    </div>
  );
}
