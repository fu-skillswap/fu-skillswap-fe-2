/**
 * @file EditorPopover.tsx
 * @description Nút trên thanh công cụ mở một hộp nổi (dialog): Esc hoặc bấm ra ngoài để đóng,
 * focus quay lại nút khi đóng.
 */

'use client';

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';

export const toolbarButtonClass =
  'inline-flex h-9 min-w-9 shrink-0 cursor-pointer items-center justify-center gap-1 rounded-lg border-0 bg-transparent px-2 text-[13px] font-semibold text-text-secondary transition-colors hover:bg-white hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary aria-expanded:bg-white aria-expanded:text-primary [&>svg]:h-4 [&>svg]:w-4';

export function EditorPopover({
  label,
  title,
  trigger,
  panelLabel,
  align = 'start',
  open: controlledOpen,
  onOpenChange,
  children,
}: {
  /** Accessible name of the trigger button. */
  label: string;
  /** Tooltip; defaults to the label. */
  title?: string;
  trigger: ReactNode;
  /** Accessible name of the popover dialog. */
  panelLabel: string;
  align?: 'start' | 'end';
  /** Optional controlled state (e.g. the link popover opened by Ctrl/Cmd+K). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: (close: () => void) => ReactNode;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = useCallback(
    (next: boolean) => {
      setUncontrolledOpen(next);
      onOpenChange?.(next);
    },
    [onOpenChange],
  );
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  const close = useCallback(
    (restoreFocus = true) => {
      setOpen(false);
      if (restoreFocus) buttonRef.current?.focus();
    },
    [setOpen],
  );

  useEffect(() => {
    if (!open) return;
    panelRef.current
      ?.querySelector<HTMLElement>('input, button:not([disabled]), [tabindex="0"]')
      ?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        close();
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!panelRef.current?.contains(target) && !buttonRef.current?.contains(target)) {
        close(false);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [close, open]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        title={title ?? label}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen(!open)}
        className={toolbarButtonClass}
      >
        {trigger}
      </button>
      {open && (
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-label={panelLabel}
          className={`absolute top-full z-30 mt-1.5 rounded-2xl border border-solid border-border-light bg-white p-3 shadow-lg ${
            align === 'end' ? 'right-0' : 'left-0'
          }`}
        >
          {children(() => close())}
        </div>
      )}
    </div>
  );
}
