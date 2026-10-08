/**
 * @file EditorToolbar.tsx
 * @description Thanh công cụ định dạng của trình soạn bài: tiêu đề mục, B/I/S, màu chữ, tô nền,
 * danh sách, trích dẫn, ô ghi chú, liên kết và chèn ảnh.
 */

'use client';

import {
  Bold,
  ChevronDown,
  Highlighter,
  ImagePlus,
  Info,
  Italic,
  Lightbulb,
  Link as LinkIcon,
  List,
  ListOrdered,
  MessageSquareQuote,
  Strikethrough,
  TriangleAlert,
} from 'lucide-react';
import { useState, type ReactNode, type SyntheticEvent } from 'react';
import { ColorPopover } from './ColorPopover';
import { EditorPopover, toolbarButtonClass } from './EditorPopover';
import type { LineStyle, MarkdownEditor } from './useMarkdownEditor';

const SHORTCUT_KEY =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl';

const HEADING_OPTIONS: { style: LineStyle; label: string; hint: string }[] = [
  { style: 'paragraph', label: 'Đoạn văn', hint: 'Chữ thường' },
  { style: 'h2', label: 'Tiêu đề mục', hint: '## · hiện trong mục lục' },
  { style: 'h3', label: 'Tiêu đề nhỏ', hint: '###' },
];

const CALLOUT_OPTIONS = [
  { marker: 'meo', label: 'Mẹo', icon: Lightbulb, className: 'text-[#065F46]' },
  { marker: 'luu-y', label: 'Lưu ý', icon: TriangleAlert, className: 'text-[#7C2D12]' },
  { marker: 'quan-trong', label: 'Quan trọng', icon: Info, className: 'text-[#12386E]' },
];

const menuItemClass =
  'flex w-full cursor-pointer items-center gap-2 rounded-lg border-0 bg-transparent px-2.5 py-2 text-left text-sm text-text-main hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';

function ToolButton({
  label,
  shortcut,
  icon,
  onClick,
}: {
  label: string;
  shortcut?: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  const title = shortcut ? `${label} (${SHORTCUT_KEY}+${shortcut})` : label;
  return (
    <button
      type="button"
      aria-label={title}
      title={title}
      onClick={onClick}
      className={toolbarButtonClass}
    >
      {icon}
    </button>
  );
}

const Divider = () => (
  <span className="mx-0.5 h-5 w-px shrink-0 bg-border-light" aria-hidden="true" />
);

function LinkForm({ onSubmit }: { onSubmit: (url: string) => void }) {
  const [url, setUrl] = useState('https://');
  const [error, setError] = useState<string>();

  const submit = (event: SyntheticEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const value = url.trim();
    if (!/^https:\/\/[^\s/$.?#].[^\s]*$/i.test(value)) {
      setError('Chỉ chấp nhận liên kết bắt đầu bằng https://');
      return;
    }
    onSubmit(value);
  };

  return (
    <div className="w-[280px]">
      <label className="text-xs font-bold text-text-main" htmlFor="editor-link-url">
        Địa chỉ liên kết
      </label>
      <div className="mt-1.5 flex gap-1.5">
        <input
          id="editor-link-url"
          type="url"
          inputMode="url"
          value={url}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'editor-link-error' : undefined}
          onChange={(event) => {
            setUrl(event.target.value);
            setError(undefined);
          }}
          onKeyDown={(event) => {
            // Enter inside a nested form must not submit the post form.
            if (event.key === 'Enter') submit(event);
          }}
          className="h-9 min-w-0 flex-1 rounded-lg border border-solid border-border-color px-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
        />
        <button
          type="button"
          onClick={submit}
          className="h-9 cursor-pointer rounded-lg border-0 bg-primary px-3 text-xs font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          Chèn
        </button>
      </div>
      {error && (
        <p id="editor-link-error" className="m-0 mt-1.5 text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function EditorToolbar({
  editor,
  onPickImage,
  isLinkOpen,
  onLinkOpenChange,
}: {
  editor: MarkdownEditor;
  onPickImage: () => void;
  isLinkOpen: boolean;
  onLinkOpenChange: (open: boolean) => void;
}) {
  return (
    <div
      role="toolbar"
      aria-label="Công cụ định dạng"
      className="sticky top-16 z-20 flex flex-wrap items-center gap-0.5 border-0 border-b border-solid border-border-light bg-surface-subtle/95 px-2 py-1.5 backdrop-blur"
    >
      <EditorPopover
        label="Kiểu đoạn: Tiêu đề mục"
        panelLabel="Chọn kiểu đoạn"
        trigger={
          <>
            Tiêu đề mục <ChevronDown aria-hidden="true" />
          </>
        }
      >
        {(close) => (
          <div className="w-[220px]">
            {HEADING_OPTIONS.map((option) => (
              <button
                key={option.style}
                type="button"
                className={menuItemClass}
                onClick={() => {
                  close();
                  editor.setLineStyle(option.style);
                }}
              >
                <span
                  className={
                    option.style === 'h2'
                      ? 'text-base font-extrabold'
                      : option.style === 'h3'
                        ? 'font-bold'
                        : ''
                  }
                >
                  {option.label}
                </span>
                <span className="ml-auto text-[11px] text-text-muted">{option.hint}</span>
              </button>
            ))}
          </div>
        )}
      </EditorPopover>

      <Divider />
      <ToolButton label="In đậm" shortcut="B" icon={<Bold />} onClick={() => editor.wrap('**')} />
      <ToolButton
        label="In nghiêng"
        shortcut="I"
        icon={<Italic />}
        onClick={() => editor.wrap('_')}
      />
      <ToolButton label="Gạch ngang" icon={<Strikethrough />} onClick={() => editor.wrap('~~')} />

      <EditorPopover
        label="Màu chữ"
        panelLabel="Chọn màu chữ"
        trigger={
          <span className="flex flex-col items-center leading-none" aria-hidden="true">
            <span className="text-sm font-extrabold">A</span>
            <span className="mt-0.5 h-[3px] w-4 rounded-full bg-[#0369A1]" />
          </span>
        }
      >
        {(close) => (
          <ColorPopover
            onPick={(className) => {
              close();
              editor.applyClass(className);
            }}
          />
        )}
      </EditorPopover>
      <EditorPopover label="Tô nền chữ" panelLabel="Chọn màu tô nền" trigger={<Highlighter />}>
        {(close) => (
          <ColorPopover
            onPick={(className) => {
              close();
              editor.applyClass(className);
            }}
          />
        )}
      </EditorPopover>

      <Divider />
      <ToolButton label="Danh sách" icon={<List />} onClick={() => editor.setLineStyle('ul')} />
      <ToolButton
        label="Danh sách đánh số"
        icon={<ListOrdered />}
        onClick={() => editor.setLineStyle('ol')}
      />
      <ToolButton
        label="Trích dẫn"
        icon={<MessageSquareQuote />}
        onClick={() => editor.setLineStyle('quote')}
      />

      <EditorPopover
        label="Ô ghi chú"
        panelLabel="Chọn loại ô ghi chú"
        trigger={
          <>
            Ô ghi chú <ChevronDown aria-hidden="true" />
          </>
        }
      >
        {(close) => (
          <div className="w-[180px]">
            {CALLOUT_OPTIONS.map((option) => (
              <button
                key={option.marker}
                type="button"
                className={menuItemClass}
                onClick={() => {
                  close();
                  const block = `> [!${option.marker}]\n> `;
                  editor.insertBlock(block);
                }}
              >
                <option.icon className={`h-4 w-4 ${option.className}`} aria-hidden="true" />
                {option.label}
              </button>
            ))}
          </div>
        )}
      </EditorPopover>

      <Divider />
      <EditorPopover
        label={`Liên kết (${SHORTCUT_KEY}+K)`}
        panelLabel="Chèn liên kết"
        trigger={<LinkIcon />}
        align="end"
        open={isLinkOpen}
        onOpenChange={onLinkOpenChange}
      >
        {(close) => (
          <LinkForm
            onSubmit={(url) => {
              close();
              editor.insertLink(url);
            }}
          />
        )}
      </EditorPopover>

      <button
        type="button"
        onClick={onPickImage}
        aria-label="Chèn ảnh tại vị trí con trỏ"
        title="Chèn ảnh tại vị trí con trỏ"
        className="ml-auto inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border-0 bg-primary px-3 text-[13px] font-bold text-white hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25"
      >
        <ImagePlus className="h-4 w-4" aria-hidden="true" />
        Chèn ảnh
      </button>
    </div>
  );
}
