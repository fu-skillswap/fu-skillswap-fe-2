/**
 * @file Modal.tsx
 * @description Component Hộp thoại nổi dùng chung (Reusable UI Modal Dialog Component).
 * Tự động lắng nghe phím Escape để đóng hộp thoại và ngăn chặn sự kiện nổi bọt trên backdrop.
 */

"use client";

import { useEffect } from "react";

/** Props khởi tạo cho Modal Component */
interface ModalProps {
  /** Trạng thái ẩn/hiện Modal */
  open: boolean;
  /** Tiêu đề của Modal */
  title: string;
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
  onClose,
  children,
  className = "",
}: ModalProps) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) =>
      event.key === "Escape" && onClose();
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  if (!open) return null;
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className={`modal ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
