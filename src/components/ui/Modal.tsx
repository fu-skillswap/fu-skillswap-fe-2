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

  const hasCustomMaxWidth = className.includes('max-w-');
  const defaultWidthClass = hasCustomMaxWidth ? '' : 'max-w-lg';

  return (
    <div
      className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[99999] flex items-center justify-center p-3 sm:p-6 transition-all duration-300 overflow-y-auto"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        className={`bg-white rounded-3xl shadow-2xl border border-solid border-slate-200/80 w-full ${defaultWidthClass} max-h-[90vh] overflow-hidden flex flex-col transition-all animate-in fade-in-0 zoom-in-95 duration-200 ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Hộp thoại'}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {!hideHeader && (
          <div className="px-6 py-4 border-b border-solid border-slate-100 flex items-center justify-between gap-4 bg-slate-50/70 shrink-0">
            {title && (
              <h2 className="m-0 text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                {title}
              </h2>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="w-8.5 h-8.5 rounded-full inline-flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-200/60 transition-all text-lg font-bold border-none bg-transparent cursor-pointer active:scale-95 shrink-0"
            >
              ×
            </button>
          </div>
        )}
        <div className="p-4 sm:p-6 overflow-y-auto max-w-full overflow-x-hidden flex-1">{children}</div>
      </section>
    </div>
  );
}
