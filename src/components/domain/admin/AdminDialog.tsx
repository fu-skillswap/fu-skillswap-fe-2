/**
 * @file AdminDialog.tsx
 * @description Khung hộp thoại dùng chung cho khu vực quản trị: header (icon, tiêu đề, mô tả, nút đóng),
 * nội dung và footer căn phải. Đóng bằng phím Esc hoặc bấm ra ngoài.
 */

'use client';

import { X } from 'lucide-react';
import { useEffect, type FormEventHandler, type ReactNode } from 'react';

export type AdminDialogTone = 'info' | 'success' | 'warning' | 'danger';

type AdminDialogProps = {
  titleId: string;
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  tone?: AdminDialogTone;
  /** `wide` is used for document previews. */
  size?: 'default' | 'wide';
  busy?: boolean;
  onClose: () => void;
  /** When set, the dialog body renders as a form. */
  onSubmit?: FormEventHandler<HTMLFormElement>;
  footer?: ReactNode;
  children?: ReactNode;
};

export function AdminDialog({
  titleId,
  title,
  description,
  icon,
  tone = 'info',
  size = 'default',
  busy = false,
  onClose,
  onSubmit,
  footer,
  children,
}: AdminDialogProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = overflow;
    };
  }, [busy, onClose]);

  const content = (
    <>
      <header className="admin-dialog-header">
        {icon && <span className={`admin-dialog-icon is-${tone}`}>{icon}</span>}
        <div className="admin-dialog-heading">
          <h2 id={titleId}>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        <button
          type="button"
          className="admin-dialog-close"
          aria-label="Đóng"
          disabled={busy}
          onClick={onClose}
        >
          <X aria-hidden="true" />
        </button>
      </header>
      {children && <div className="admin-dialog-body">{children}</div>}
      {footer && <footer className="admin-dialog-footer">{footer}</footer>}
    </>
  );

  return (
    <div
      className="admin-dialog-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      {onSubmit ? (
        <form
          className={`admin-dialog is-${size}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onSubmit={onSubmit}
          noValidate
        >
          {content}
        </form>
      ) : (
        <section
          className={`admin-dialog is-${size}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          {content}
        </section>
      )}
    </div>
  );
}
