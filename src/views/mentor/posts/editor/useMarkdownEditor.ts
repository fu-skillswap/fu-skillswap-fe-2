/**
 * @file useMarkdownEditor.ts
 * @description Selection-aware Markdown edits on the post textarea. The textarea stays registered
 * with react-hook-form (`contentMarkdown`), which remains the single source of truth.
 */

'use client';

import { useCallback, useRef, type KeyboardEvent } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { MentorPostFormValues } from '@/models/schemas/mentorPostSchema';

export type LineStyle = 'paragraph' | 'h2' | 'h3' | 'ul' | 'ol' | 'quote';

const LINE_PREFIX = /^(#{1,6}\s+|>\s?|[-*+]\s+|\d+[.)]\s+)/;
const STYLED_SPAN = /^\[([^\]]*)\]\{\.[a-z0-9-]+\}$/;

function prefixFor(style: LineStyle, index: number) {
  switch (style) {
    case 'h2':
      return '## ';
    case 'h3':
      return '### ';
    case 'ul':
      return '- ';
    case 'ol':
      return `${index + 1}. `;
    case 'quote':
      return '> ';
    default:
      return '';
  }
}

function hasStyle(line: string, style: LineStyle) {
  switch (style) {
    case 'h2':
      return /^##\s/.test(line);
    case 'h3':
      return /^###\s/.test(line);
    case 'ul':
      return /^[-*+]\s/.test(line);
    case 'ol':
      return /^\d+[.)]\s/.test(line);
    case 'quote':
      return /^>/.test(line);
    default:
      return false;
  }
}

export function useMarkdownEditor(form: UseFormReturn<MentorPostFormValues>) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const getValue = useCallback(() => form.getValues('contentMarkdown') ?? '', [form]);

  /**
   * Writes the new content without moving the view. Assigning `textarea.value` sends the caret
   * to the end, and focusing it then scrolls to the bottom, so the selection and scroll position
   * are put back explicitly. `focus` is used by toolbar actions to return to typing.
   */
  const writeContent = useCallback(
    (next: string, selectionStart: number, selectionEnd: number, focus: boolean) => {
      const textarea = textareaRef.current;
      const scrollTop = textarea?.scrollTop ?? 0;
      form.setValue('contentMarkdown', next, { shouldDirty: true });
      const restore = () => {
        const field = textareaRef.current;
        if (!field) return;
        if (focus) field.focus({ preventScroll: true });
        field.setSelectionRange(selectionStart, selectionEnd);
        field.scrollTop = scrollTop;
      };
      restore();
      // Re-apply after React re-renders the editor with the new content.
      requestAnimationFrame(restore);
    },
    [form],
  );

  /** Writes the new content, then restores focus and the given selection. */
  const commit = useCallback(
    (next: string, selectionStart: number, selectionEnd = selectionStart) =>
      writeContent(next, selectionStart, selectionEnd, true),
    [writeContent],
  );

  /** Writes content changed elsewhere (image edits, uploads), keeping the caret where it was. */
  const writeKeepingCaret = useCallback(
    (previous: string, next: string, changedAt: number) => {
      const textarea = textareaRef.current;
      const delta = next.length - previous.length;
      const shift = (position: number) =>
        position > changedAt ? Math.max(changedAt, position + delta) : position;
      const start = textarea ? shift(textarea.selectionStart) : next.length;
      const end = textarea ? shift(textarea.selectionEnd) : next.length;
      writeContent(next, start, end, false);
    },
    [writeContent],
  );

  const getSelection = useCallback(() => {
    const textarea = textareaRef.current;
    const value = getValue();
    if (!textarea) return { value, start: value.length, end: value.length };
    return { value, start: textarea.selectionStart, end: textarea.selectionEnd };
  }, [getValue]);

  /** Wraps the selection (or a selected placeholder) in prefix/suffix; unwraps when already wrapped. */
  const wrap = useCallback(
    (prefix: string, suffix = prefix, placeholder = 'nội dung') => {
      const { value, start, end } = getSelection();
      const before = value.slice(0, start);
      const after = value.slice(end);
      const selected = value.slice(start, end);

      if (selected && before.endsWith(prefix) && after.startsWith(suffix)) {
        const next = before.slice(0, -prefix.length) + selected + after.slice(suffix.length);
        commit(next, start - prefix.length, end - prefix.length);
        return;
      }
      const text = selected || placeholder;
      const next = before + prefix + text + suffix + after;
      const innerStart = start + prefix.length;
      commit(next, innerStart, innerStart + text.length);
    },
    [commit, getSelection],
  );

  /** Applies a heading / list / quote style to every line touched by the selection. */
  const setLineStyle = useCallback(
    (style: LineStyle) => {
      const { value, start, end } = getSelection();
      const blockStart = value.lastIndexOf('\n', start - 1) + 1;
      const nextBreak = value.indexOf('\n', end);
      const blockEnd = nextBreak === -1 ? value.length : nextBreak;
      const lines = value.slice(blockStart, blockEnd).split('\n');
      const allStyled = style !== 'paragraph' && lines.every((line) => hasStyle(line, style));
      const styled = lines
        .map((line, index) => {
          const bare = line.replace(LINE_PREFIX, '');
          return allStyled ? bare : prefixFor(style, index) + bare;
        })
        .join('\n');
      const next = value.slice(0, blockStart) + styled + value.slice(blockEnd);
      commit(next, blockStart + styled.length);
    },
    [commit, getSelection],
  );

  /**
   * Inserts a block on its own line at the caret, with blank lines around it.
   * `caretOffset` places the caret inside the inserted text (defaults to its end).
   */
  const insertBlock = useCallback(
    (text: string, caretOffset = text.length) => {
      const { value, start, end } = getSelection();
      const before = value.slice(0, start).replace(/[ \t]+$/, '');
      const after = value.slice(end).replace(/^[ \t]+/, '');
      const lead = !before
        ? ''
        : before.endsWith('\n\n')
          ? ''
          : before.endsWith('\n')
            ? '\n'
            : '\n\n';
      const trail = !after
        ? '\n'
        : after.startsWith('\n\n')
          ? ''
          : after.startsWith('\n')
            ? '\n'
            : '\n\n';
      const next = before + lead + text + trail + after;
      const caret = before.length + lead.length + caretOffset;
      commit(next, caret);
    },
    [commit, getSelection],
  );

  /** Puts `[selection]{.cls}` around the selection, replacing any colour/highlight already there. */
  const applyClass = useCallback(
    (className: string | null) => {
      const { value, start, end } = getSelection();
      let from = start;
      let to = end;
      let inner = value.slice(start, end);

      const wrapped = STYLED_SPAN.exec(inner);
      if (wrapped) {
        inner = wrapped[1];
      } else {
        // Selection is the text inside an existing span: "[" before it, "]{.x}" after it.
        const suffix = /^\]\{\.[a-z0-9-]+\}/.exec(value.slice(end));
        if (value[start - 1] === '[' && suffix) {
          from = start - 1;
          to = end + suffix[0].length;
        }
      }

      if (!className) {
        commit(value.slice(0, from) + inner + value.slice(to), from, from + inner.length);
        return;
      }
      const text = inner || 'nội dung';
      const next = `${value.slice(0, from)}[${text}]{.${className}}${value.slice(to)}`;
      commit(next, from + 1, from + 1 + text.length);
    },
    [commit, getSelection],
  );

  const insertLink = useCallback(
    (url: string) => {
      const { value, start, end } = getSelection();
      const text = value.slice(start, end) || 'văn bản liên kết';
      const next = `${value.slice(0, start)}[${text}](${url})${value.slice(end)}`;
      commit(next, start + 1, start + 1 + text.length);
    },
    [commit, getSelection],
  );

  /** Replaces one source line (by index); `null` removes it together with one blank neighbour. */
  const replaceLine = useCallback(
    (lineIndex: number, nextLine: string | null) => {
      const value = getValue();
      const lines = value.split('\n');
      if (lineIndex < 0 || lineIndex >= lines.length) return;
      const changedAt = lines.slice(0, lineIndex).join('\n').length;
      if (nextLine === null) {
        lines.splice(lineIndex, 1);
        if (!lines[lineIndex]?.trim() && !lines[lineIndex - 1]?.trim()) lines.splice(lineIndex, 1);
      } else {
        lines[lineIndex] = nextLine;
      }
      writeKeepingCaret(value, lines.join('\n'), changedAt);
    },
    [getValue, writeKeepingCaret],
  );

  /** Replaces an exact snippet (e.g. an upload placeholder) wherever it now sits. */
  const replaceText = useCallback(
    (search: string, replacement: string) => {
      const value = getValue();
      const changedAt = value.indexOf(search);
      if (changedAt === -1) return false;
      let next = value.replace(search, replacement);
      if (!replacement) next = next.replace(/\n{3,}/g, '\n\n');
      writeKeepingCaret(value, next, changedAt);
      return true;
    },
    [getValue, writeKeepingCaret],
  );

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>, openLink: () => void) => {
      if (!(event.ctrlKey || event.metaKey) || event.altKey || event.shiftKey) return;
      const key = event.key.toLowerCase();
      if (key === 'b') {
        event.preventDefault();
        wrap('**');
      } else if (key === 'i') {
        event.preventDefault();
        wrap('_');
      } else if (key === 'k') {
        event.preventDefault();
        openLink();
      }
    },
    [wrap],
  );

  return {
    textareaRef,
    getValue,
    wrap,
    setLineStyle,
    insertBlock,
    applyClass,
    insertLink,
    replaceLine,
    replaceText,
    onKeyDown,
  };
}

export type MarkdownEditor = ReturnType<typeof useMarkdownEditor>;
