/**
 * @file BlogMarkdown.tsx
 * @description Hiển thị nội dung Markdown của bài Blog thành phần tử React (không dùng HTML thô).
 * Hỗ trợ tiêu đề, đoạn văn, danh sách, trích dẫn, khối code, ảnh, liên kết, in đậm / nghiêng / code.
 */

import { Fragment, type ReactNode } from 'react';

/** Only http(s) and site-relative URLs are rendered; anything else (javascript:, data:…) is dropped. */
function safeUrl(url: string) {
  const value = url.trim();
  if (/^https?:\/\//i.test(value) || (value.startsWith('/') && !value.startsWith('//'))) {
    return value;
  }
  return undefined;
}

const INLINE_PATTERN =
  /(!\[([^\]]*)\]\(([^)\s]+)\))|(\[([^\]]+)\]\(([^)\s]+)\))|(`([^`]+)`)|(\*\*([^*]+)\*\*)|(__([^_]+)__)|(\*([^*]+)\*)|(_([^_]+)_)/g;

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let index = 0;
  for (const match of text.matchAll(INLINE_PATTERN)) {
    const start = match.index ?? 0;
    if (start > lastIndex) nodes.push(text.slice(lastIndex, start));
    const key = `${keyPrefix}-${index++}`;
    if (match[1]) {
      const src = safeUrl(match[3]);
      if (src) {
        nodes.push(
          <img
            key={key}
            src={src}
            alt={match[2]}
            loading="lazy"
            className="my-4 block max-w-full rounded-2xl"
          />,
        );
      } else {
        nodes.push(match[2]);
      }
    } else if (match[4]) {
      const href = safeUrl(match[6]);
      nodes.push(
        href ? (
          <a
            key={key}
            href={href}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="font-semibold text-primary underline underline-offset-2"
          >
            {renderInline(match[5], key)}
          </a>
        ) : (
          <Fragment key={key}>{renderInline(match[5], key)}</Fragment>
        ),
      );
    } else if (match[7]) {
      nodes.push(
        <code
          key={key}
          className="rounded-md bg-surface-subtle px-1.5 py-0.5 font-mono text-[0.9em] text-text-main"
        >
          {match[8]}
        </code>,
      );
    } else if (match[9] || match[11]) {
      nodes.push(
        <strong key={key} className="font-bold text-text-main">
          {renderInline(match[10] ?? match[12], key)}
        </strong>,
      );
    } else {
      nodes.push(<em key={key}>{renderInline(match[14] ?? match[16], key)}</em>);
    }
    lastIndex = start + match[0].length;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

const HEADING_CLASS: Record<number, string> = {
  1: 'mt-8 mb-3 text-2xl font-extrabold',
  2: 'mt-8 mb-3 text-xl font-extrabold',
  3: 'mt-6 mb-2 text-lg font-bold',
  4: 'mt-5 mb-2 text-base font-bold',
};

const LIST_ITEM = /^\s*([-*+]|\d+[.)])\s+(.*)$/;

export function BlogMarkdown({ content }: { content: string }) {
  const lines = content.replace(/\r\n?/g, '\n').split('\n');
  const blocks: ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const key = `b${i}`;

    if (!line.trim()) {
      i += 1;
      continue;
    }

    // Fenced code block.
    if (line.trimStart().startsWith('```')) {
      const code: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i].trimStart().startsWith('```')) code.push(lines[i++]);
      i += 1;
      blocks.push(
        <pre
          key={key}
          className="my-4 overflow-x-auto rounded-2xl bg-surface-subtle p-4 text-sm leading-6 text-text-main"
        >
          <code className="font-mono">{code.join('\n')}</code>
        </pre>,
      );
      continue;
    }

    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      const level = Math.min(heading[1].length + 1, 4);
      const Tag = `h${level}` as 'h2' | 'h3' | 'h4';
      blocks.push(
        <Tag key={key} className={`${HEADING_CLASS[level]} text-text-main`}>
          {renderInline(heading[2], key)}
        </Tag>,
      );
      i += 1;
      continue;
    }

    if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) {
      blocks.push(
        <hr key={key} className="my-6 border-0 border-t border-solid border-border-light" />,
      );
      i += 1;
      continue;
    }

    if (line.trimStart().startsWith('>')) {
      const quote: string[] = [];
      while (i < lines.length && lines[i].trimStart().startsWith('>')) {
        quote.push(lines[i++].trimStart().replace(/^>\s?/, ''));
      }
      blocks.push(
        <blockquote
          key={key}
          className="my-4 border-0 border-l-4 border-solid border-primary-border bg-primary-light/60 px-4 py-3 text-text-secondary"
        >
          {renderInline(quote.join(' '), key)}
        </blockquote>,
      );
      continue;
    }

    const listMatch = LIST_ITEM.exec(line);
    if (listMatch) {
      const ordered = /\d/.test(listMatch[1]);
      const items: string[] = [];
      while (i < lines.length) {
        const item = LIST_ITEM.exec(lines[i]);
        if (!item || /\d/.test(item[1]) !== ordered) break;
        items.push(item[2]);
        i += 1;
      }
      const ListTag = ordered ? 'ol' : 'ul';
      blocks.push(
        <ListTag
          key={key}
          className={`my-4 space-y-1.5 pl-6 ${ordered ? 'list-decimal' : 'list-disc'}`}
        >
          {items.map((item, itemIndex) => (
            <li key={itemIndex}>{renderInline(item, `${key}-${itemIndex}`)}</li>
          ))}
        </ListTag>,
      );
      continue;
    }

    // Paragraph: consecutive plain lines, joined with line breaks.
    // The first line is always taken so an unmatched line can never stall the loop.
    const paragraph: string[] = [lines[i++]];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{1,6}\s|>|```)/.test(lines[i].trimStart()) &&
      !LIST_ITEM.test(lines[i])
    ) {
      paragraph.push(lines[i++]);
    }
    blocks.push(
      <p key={key} className="my-4">
        {paragraph.map((text, lineIndex) => (
          <Fragment key={lineIndex}>
            {lineIndex > 0 && <br />}
            {renderInline(text, `${key}-${lineIndex}`)}
          </Fragment>
        ))}
      </p>,
    );
  }

  return <div className="break-words text-[15px] leading-7 text-text-secondary">{blocks}</div>;
}
