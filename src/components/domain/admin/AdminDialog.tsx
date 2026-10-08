/**
 * @file AdminDialog.tsx
 * @description Khung hộp thoại dùng chung cho khu vực quản trị: header (icon, tiêu đề, mô tả, nút đóng),
 * nội dung và footer. Đóng bằng phím Esc hoặc bấm ra ngoài; giữ focus trong hộp thoại và trả focus
 * về phần tử đã mở nó khi đóng.
 */

'use client';

import { X } from 'lucide-react';
import { Children, useEffect, useRef, type FormEventHandler, type ReactNode } from 'react';

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
  /** Left-aligned footer content, e.g. "Tài liệu 1/2". */
  footerStart?: ReactNode;
  children?: ReactNode;
};

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function getFocusable(container: HTMLElement) {
  return [...container.querySelectorAll<HTMLElement>(focusableSelector)].filter(
    (element) => element.getClientRects().length > 0,
  );
}

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
  footerStart,
  children,
}: AdminDialogProps) {
  const dialogRef = useRef<HTMLElement>(null);
  // Latest values for the keyboard handler without re-binding it on every render.
  const busyRef = useRef(busy);
  const onCloseRef = useRef(onClose);
  busyRef.current = busy;
  onCloseRef.current = onClose;

  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = dialogRef.current;
    // `autoFocus` children have already taken focus. Otherwise prefer the first body control,
    // then the first footer button (usually "Hủy"), so Enter never confirms by accident.
    if (dialog && !dialog.contains(document.activeElement)) {
      const body = dialog.querySelector<HTMLElement>('.admin-dialog-body');
      const footer = dialog.querySelector<HTMLElement>('.admin-dialog-footer');
      const target =
        (body && getFocusable(body)[0]) ?? (footer && getFocusable(footer)[0]) ?? dialog;
      target.focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (!busyRef.current) onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = getFocusable(dialogRef.current);
      if (!focusable.length) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || !dialogRef.current.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !dialogRef.current.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = overflow;
      if (opener?.isConnected) opener.focus();
    };
  }, []);

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
      {Children.toArray(children).length > 0 && <div className="admin-dialog-body">{children}</div>}
      {(footer || footerStart) && (
        <footer className="admin-dialog-footer">
          {footerStart && <div className="admin-dialog-footer-start">{footerStart}</div>}
          {footer}
        </footer>
      )}
    </>
  );

  const shared = {
    className: `admin-dialog is-${size}`,
    role: 'dialog',
    'aria-modal': true,
    'aria-labelledby': titleId,
    tabIndex: -1,
  } as const;

  return (
    <div
      className="admin-dialog-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      {onSubmit ? (
        <form
          {...shared}
          ref={(node) => {
            dialogRef.current = node;
          }}
          onSubmit={onSubmit}
          noValidate
        >
          {content}
        </form>
      ) : (
        <section
          {...shared}
          ref={(node) => {
            dialogRef.current = node;
          }}
        >
          {content}
        </section>
      )}
    </div>
  );
}
