/**
 * @file ImageBlockToolbar.tsx
 * @description Thanh chỉnh một khối ảnh trong bản xem trước: cỡ ảnh, chú thích, mô tả ảnh (alt), xóa.
 * Mỗi thao tác chỉ viết lại đúng dòng ảnh đó trong nội dung.
 */

'use client';

import type { BlogImageBlock, BlogImageSize } from '@/components/domain/blog/BlogMarkdown';
import { Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const SIZES: { size: BlogImageSize; label: string }[] = [
  { size: 'nho', label: 'Nhỏ' },
  { size: 'vua', label: 'Vừa cột chữ' },
  { size: 'rong', label: 'Rộng' },
];

const pillClass =
  'inline-flex h-8 shrink-0 cursor-pointer items-center rounded-lg border-0 px-2.5 text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300';

export function ImageBlockToolbar({
  block,
  onChange,
  onDelete,
  onClose,
}: {
  block: BlogImageBlock;
  onChange: (block: BlogImageBlock) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [editing, setEditing] = useState<'caption' | 'alt'>();
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const missingAlt = !block.alt.trim();

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const startEdit = (field: 'caption' | 'alt') => {
    setDraft(block[field]);
    setEditing(field);
  };

  const saveEdit = () => {
    if (!editing) return;
    onChange({ ...block, [editing]: draft.trim() });
    setEditing(undefined);
  };

  return (
    <div
      role="dialog"
      aria-label="Chỉnh ảnh"
      className="rounded-xl bg-slate-900 p-1.5 text-white shadow-lg"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.stopPropagation();
          if (editing) setEditing(undefined);
          else onClose();
        }
      }}
    >
      {editing ? (
        <div className="flex items-center gap-1.5">
          <label className="sr-only" htmlFor="image-block-field">
            {editing === 'alt' ? 'Mô tả ảnh' : 'Chú thích ảnh'}
          </label>
          <input
            id="image-block-field"
            ref={inputRef}
            value={draft}
            placeholder={
              editing === 'alt'
                ? 'Ảnh này cho thấy gì? (dành cho người dùng trình đọc màn hình)'
                : 'Chú thích hiện dưới ảnh'
            }
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                saveEdit();
              }
            }}
            className="h-8 w-[260px] max-w-[60vw] rounded-lg border-0 bg-white px-2.5 text-xs text-slate-900 outline-none"
          />
          <button
            type="button"
            className={`${pillClass} bg-white text-slate-900`}
            onClick={saveEdit}
          >
            Lưu
          </button>
          <button
            type="button"
            aria-label="Hủy"
            className={`${pillClass} bg-transparent text-white hover:bg-white/10`}
            onClick={() => setEditing(undefined)}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-1">
          {SIZES.map((option) => (
            <button
              key={option.size}
              type="button"
              aria-pressed={block.size === option.size}
              className={`${pillClass} ${
                block.size === option.size
                  ? 'bg-white text-slate-900'
                  : 'bg-transparent text-white hover:bg-white/10'
              }`}
              onClick={() => onChange({ ...block, size: option.size })}
            >
              {option.label}
            </button>
          ))}
          <span className="mx-0.5 h-5 w-px bg-white/20" aria-hidden="true" />
          <button
            type="button"
            className={`${pillClass} bg-transparent text-white hover:bg-white/10`}
            onClick={() => startEdit('caption')}
          >
            Sửa chú thích
          </button>
          <button
            type="button"
            className={`${pillClass} ${
              missingAlt
                ? 'bg-amber-400 text-slate-900'
                : 'bg-transparent text-white hover:bg-white/10'
            }`}
            onClick={() => startEdit('alt')}
          >
            {missingAlt ? 'Thêm mô tả ảnh' : 'Mô tả ảnh (alt)'}
          </button>
          <button
            type="button"
            aria-label="Xóa ảnh"
            title="Xóa ảnh"
            className={`${pillClass} bg-transparent text-red-300 hover:bg-white/10`}
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Đóng thanh chỉnh ảnh"
            className={`${pillClass} bg-transparent text-white hover:bg-white/10`}
            onClick={onClose}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
