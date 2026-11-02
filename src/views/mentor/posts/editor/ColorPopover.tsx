/**
 * @file ColorPopover.tsx
 * @description Bảng màu chữ và tô nền có sẵn cho trình soạn bài (không có bộ chọn màu tự do).
 */

'use client';

import { Ban } from 'lucide-react';

export const TEXT_COLORS = [
  { className: 'xanh', label: 'Xanh dương', color: '#0369A1' },
  { className: 'cam', label: 'Cam', color: '#C2410C' },
  { className: 'la', label: 'Xanh lá', color: '#047857' },
  { className: 'tim', label: 'Tím', color: '#6D28D9' },
];

export const HIGHLIGHTS = [
  { className: 'to-vang', label: 'Tô vàng', color: '#FEF08A' },
  { className: 'to-xanh', label: 'Tô xanh dương', color: '#BAE6FD' },
  { className: 'to-la', label: 'Tô xanh lá', color: '#BBF7D0' },
  { className: 'to-hong', label: 'Tô hồng', color: '#FBCFE8' },
];

const swatchClass =
  'flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-solid border-border-light text-sm font-extrabold transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';

/** `onPick(null)` removes the colour/highlight around the selection. */
export function ColorPopover({ onPick }: { onPick: (className: string | null) => void }) {
  return (
    <div className="w-[248px]">
      <p className="m-0 mb-2 text-xs font-bold text-text-main">Màu chữ</p>
      <div className="flex gap-1.5">
        <button
          type="button"
          aria-label="Màu chữ mặc định"
          title="Mặc định"
          className={`${swatchClass} bg-white text-text-main`}
          onClick={() => onPick(null)}
        >
          A
        </button>
        {TEXT_COLORS.map((item) => (
          <button
            key={item.className}
            type="button"
            aria-label={`Màu chữ ${item.label}`}
            title={item.label}
            className={`${swatchClass} bg-white`}
            style={{ color: item.color }}
            onClick={() => onPick(item.className)}
          >
            A
          </button>
        ))}
      </div>

      <p className="m-0 mb-2 mt-3 text-xs font-bold text-text-main">Tô nền chữ</p>
      <div className="flex gap-1.5">
        <button
          type="button"
          aria-label="Bỏ tô nền"
          title="Không tô"
          className={`${swatchClass} bg-white text-text-muted`}
          onClick={() => onPick(null)}
        >
          <Ban className="h-4 w-4" aria-hidden="true" />
        </button>
        {HIGHLIGHTS.map((item) => (
          <button
            key={item.className}
            type="button"
            aria-label={item.label}
            title={item.label}
            className={swatchClass}
            style={{ backgroundColor: item.color }}
            onClick={() => onPick(item.className)}
          />
        ))}
      </div>

      <p className="m-0 mt-3 text-[11px] leading-4 text-text-muted">
        Bộ màu đã chọn sẵn để chữ luôn đọc rõ. Dùng để nhấn ý chính, không tô cả đoạn.
      </p>
    </div>
  );
}
