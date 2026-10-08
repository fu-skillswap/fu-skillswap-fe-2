/**
 * @file BlogMarkdown.tsx
 * @description Hiển thị nội dung Markdown của bài Blog thành phần tử React (không dùng HTML thô).
 * Hỗ trợ tiêu đề (## và ### có id cho mục lục), đoạn văn, danh sách, trích dẫn, khối ghi chú
 * (> [!meo] / [!luu-y] / [!quan-trong]), khối code, ảnh (khối ảnh có chú thích và cỡ),
 * liên kết, in đậm / nghiêng / gạch ngang / code, chữ màu và tô nền ([chữ]{.xanh}, [chữ]{.to-vang}).
 */

import { Info, Lightbulb, TriangleAlert, type LucideIcon } from 'lucide-react';
import { Fragment, type ReactNode } from 'react';

/** Only http(s) and site-relative URLs are rendered; anything else (javascript:, data:…) is dropped. */
function safeUrl(url: string) {
  const value = url.trim();
  if (/^https?:\/\//i.test(value) || (value.startsWith('/') && !value.startsWith('//'))) {
    return value;
  }
  return undefined;
}

const TEXT_COLOR_CLASS: Record<string, string> = {
  xanh: 'text-[#0369A1]',
  cam: 'text-[#C2410C]',
  la: 'text-[#047857]',
  tim: 'text-[#6D28D9]',
};

const HIGHLIGHT_CLASS: Record<string, string> = {
  'to-vang': 'bg-[#FEF08A]',
  'to-xanh': 'bg-[#BAE6FD]',
  'to-la': 'bg-[#BBF7D0]',
  'to-hong': 'bg-[#FBCFE8]',
};

// Groups: 1 image (2 alt, 3 url) | 4 styled span (5 text, 6 class) | 7 link (8 text, 9 url)
// | 10 code (11) | 12 **bold** (13) | 14 __bold__ (15) | 16 ~~strike~~ (17)
// | 18 *italic* (19) | 20 _italic_ (21)
const INLINE_PATTERN =
  /(!\[([^\]]*)\]\(([^)\s]+)\))|(\[([^\]]+)\]\{\.([a-z0-9-]+)\})|(\[([^\]]+)\]\(([^)\s]+)\))|(`([^`]+)`)|(\*\*([^*]+)\*\*)|(__([^_]+)__)|(~~([^~]+)~~)|(\*([^*]+)\*)|(_([^_]+)_)/g;

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
      const colorClass = TEXT_COLOR_CLASS[match[6]];
      const highlightClass = HIGHLIGHT_CLASS[match[6]];
      const children = renderInline(match[5], key);
      if (colorClass) {
        nodes.push(
          <span key={key} className={`font-semibold ${colorClass}`}>
            {children}
          </span>,
        );
      } else if (highlightClass) {
        nodes.push(
          <mark key={key} className={`rounded-[4px] px-[3px] text-[#1E293B] ${highlightClass}`}>
            {children}
          </mark>,
        );
      } else {
        // Unknown class: show the text only, never the raw "{.x}".
        nodes.push(<Fragment key={key}>{children}</Fragment>);
      }
    } else if (match[7]) {
      const href = safeUrl(match[9]);
      nodes.push(
        href ? (
          <a
            key={key}
            href={href}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="font-semibold text-primary underline underline-offset-2"
          >
            {renderInline(match[8], key)}
          </a>
        ) : (
          <Fragment key={key}>{renderInline(match[8], key)}</Fragment>
        ),
      );
    } else if (match[10]) {
      nodes.push(
        <code
          key={key}
          className="rounded-md bg-surface-subtle px-1.5 py-0.5 font-mono text-[0.9em] text-text-main"
        >
          {match[11]}
        </code>,
      );
    } else if (match[12] || match[14]) {
      nodes.push(
        <strong key={key} className="font-bold text-text-main">
          {renderInline(match[13] ?? match[15], key)}
        </strong>,
      );
    } else if (match[16]) {
      nodes.push(<s key={key}>{renderInline(match[17], key)}</s>);
    } else {
      nodes.push(<em key={key}>{renderInline(match[19] ?? match[21], key)}</em>);
    }
    lastIndex = start + match[0].length;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

/** Inline markup reduced to its visible text (used for table-of-contents labels and ids). */
function plainText(text: string) {
  return text
    .replace(/!\[([^\]]*)\]\([^)\s]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\{\.[a-z0-9-]+\}/g, '$1')
    .replace(/\[([^\]]+)\]\([^)\s]+\)/g, '$1')
    .replace(/(\*\*|__|~~|`|\*|_)(.+?)\1/g, '$2')
    .trim();
}

function slugify(text: string) {
  return (
    text
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/đ/gi, 'd')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'muc'
  );
}

const HEADING_LINE = /^(#{1,6})\s+(.*)$/;
const isFence = (line: string) => line.trimStart().startsWith('```');

export interface BlogTocItem {
  id: string;
  title: string;
  level: 2 | 3;
}

/** "## " and "### " headings in document order, with the ids the renderer gives them. */
export function extractToc(content: string): BlogTocItem[] {
  const headings: BlogTocItem[] = [];
  const used = new Map<string, number>();
  let inFence = false;
  for (const line of content.replace(/\r\n?/g, '\n').split('\n')) {
    if (isFence(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const heading = HEADING_LINE.exec(line);
    const hashes = heading?.[1].length;
    if (!heading || (hashes !== 2 && hashes !== 3)) continue;
    const title = plainText(heading[2]);
    const base = `muc-${slugify(title)}`;
    const count = (used.get(base) ?? 0) + 1;
    used.set(base, count);
    headings.push({
      id: count > 1 ? `${base}-${count}` : base,
      title,
      level: hashes === 2 ? 2 : 3,
    });
  }
  return headings;
}

const normalizeEcho = (text: string) => plainText(text).replace(/\s+/g, ' ').toLowerCase();

/**
 * Drops a first heading that repeats the post title, then a first paragraph that repeats the
 * excerpt; the reader page already shows both above the content.
 */
export function removeLeadingTitleEcho(
  content: string,
  title?: string | null,
  excerpt?: string | null,
) {
  const lines = content.replace(/\r\n?/g, '\n').split('\n');
  let start = 0;
  const skipBlank = () => {
    while (start < lines.length && !lines[start].trim()) start += 1;
  };

  skipBlank();
  const heading = HEADING_LINE.exec(lines[start] ?? '');
  if (title?.trim() && heading && normalizeEcho(heading[2]) === normalizeEcho(title)) {
    start += 1;
    skipBlank();
  }

  if (excerpt?.trim()) {
    let end = start;
    while (end < lines.length && lines[end].trim()) end += 1;
    const paragraph = lines.slice(start, end).join(' ');
    if (paragraph.trim() && normalizeEcho(paragraph) === normalizeEcho(excerpt)) start = end;
  }

  return lines.slice(start).join('\n');
}

/** "preview" looks like "reader" and tags image blocks with their source line for the editor. */
type BlogMarkdownVariant = 'default' | 'reader' | 'preview';

const HEADING_CLASS: Record<BlogMarkdownVariant, Record<number, string>> = {
  default: {
    2: 'mt-8 mb-3 text-xl font-extrabold',
    3: 'mt-6 mb-2 text-lg font-bold',
    4: 'mt-5 mb-2 text-base font-bold',
  },
  reader: {
    2: 'mt-10 mb-4 text-[26px] leading-tight font-extrabold tracking-[-0.02em]',
    3: 'mt-8 mb-3 text-xl leading-snug font-bold',
    4: 'mt-6 mb-2 text-lg font-bold',
  },
  preview: {
    2: 'mt-8 mb-3 text-[22px] leading-tight font-extrabold tracking-[-0.02em]',
    3: 'mt-6 mb-2 text-lg leading-snug font-bold',
    4: 'mt-5 mb-2 text-base font-bold',
  },
};

const BODY_CLASS: Record<BlogMarkdownVariant, string> = {
  default: 'break-words text-[15px] leading-7 text-text-secondary',
  reader: 'break-words text-[17px] leading-[1.8] text-slate-700',
  preview: 'break-words text-[15px] leading-[1.8] text-slate-700',
};

const LIST_ITEM = /^\s*([-*+]|\d+[.)])\s+(.*)$/;
const IMAGE_BLOCK =
  /^\s*!\[([^\]]*)\]\(\s*([^)\s]+)(?:\s+"([^"]*)")?\s*\)(?:\{\.([a-z0-9-]+)\})?\s*$/;

export type BlogImageSize = 'nho' | 'vua' | 'rong';

export interface BlogImageBlock {
  alt: string;
  url: string;
  caption: string;
  size: BlogImageSize;
}

/** Reads a line that holds only an image block; undefined for any other line. */
export function parseImageBlock(line: string): BlogImageBlock | undefined {
  const image = IMAGE_BLOCK.exec(line);
  if (!image) return undefined;
  const size = image[4] === 'nho' || image[4] === 'rong' ? image[4] : 'vua';
  return { alt: image[1], url: image[2], caption: image[3] ?? '', size };
}

const cleanImageText = (value: string) =>
  value
    .replace(/[[\]"\n]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export function formatImageBlock({ alt, url, caption, size }: BlogImageBlock) {
  return `![${cleanImageText(alt)}](${url} "${cleanImageText(caption)}"){.${size}}`;
}

/** Visible words of the whole document, for word counts. */
export function stripFormatting(content: string) {
  return content
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .filter((line) => !isFence(line) && !parseImageBlock(line))
    .map((line) =>
      plainText(
        line.replace(/^\s*>\s?(\[![a-z-]+\])?/, '').replace(/^\s*(#{1,6}|[-*+]|\d+[.)])\s+/, ''),
      ),
    )
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const PREVIEW_RONG = 'my-8 -mx-5';

const FIGURE_CLASS: Record<string, string> = {
  vua: 'mx-0 my-6',
  rong: 'mx-0 my-8 lg:-mx-10',
  nho: 'mx-auto my-6 max-w-[460px]',
};

const CALLOUTS: Record<string, { label: string; icon: LucideIcon; className: string }> = {
  meo: { label: 'Mẹo', icon: Lightbulb, className: 'bg-[#ECFDF5] text-[#065F46]' },
  'luu-y': { label: 'Lưu ý', icon: TriangleAlert, className: 'bg-[#FFF7ED] text-[#7C2D12]' },
  'quan-trong': { label: 'Quan trọng', icon: Info, className: 'bg-[#EFF6FF] text-[#12386E]' },
};

function renderLines(lines: string[], keyPrefix: string) {
  return lines.map((text, lineIndex) => (
    <Fragment key={lineIndex}>
      {lineIndex > 0 && <br />}
      {renderInline(text, `${keyPrefix}-${lineIndex}`)}
    </Fragment>
  ));
}

export function BlogMarkdown({
  content,
  title,
  excerpt,
  variant = 'default',
}: {
  content: string;
  /** With title/excerpt, a leading heading or paragraph that repeats them is not rendered again. */
  title?: string | null;
  excerpt?: string | null;
  variant?: BlogMarkdownVariant;
}) {
  const body = title || excerpt ? removeLeadingTitleEcho(content, title, excerpt) : content;
  const lines = body.replace(/\r\n?/g, '\n').split('\n');
  const sectionIds = extractToc(body).map((heading) => heading.id);
  let sectionIndex = 0;
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
    if (isFence(line)) {
      const code: string[] = [];
      i += 1;
      while (i < lines.length && !isFence(lines[i])) code.push(lines[i++]);
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

    const heading = HEADING_LINE.exec(line);
    if (heading) {
      const hashes = heading[1].length;
      // "#" and "##" → h2, "###" → h3, deeper → h4. "##" and "###" get table-of-contents ids.
      const level = hashes <= 2 ? 2 : Math.min(hashes, 4);
      const Tag = `h${level}` as 'h2' | 'h3' | 'h4';
      const id = hashes === 2 || hashes === 3 ? sectionIds[sectionIndex++] : undefined;
      blocks.push(
        <Tag
          key={key}
          id={id}
          className={`${HEADING_CLASS[variant][level]} text-text-main ${id ? 'scroll-mt-24' : ''}`.trim()}
        >
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

    const image = IMAGE_BLOCK.exec(line);
    if (image) {
      const lineIndex = i;
      i += 1;
      const isPreview = variant === 'preview';
      if (isPreview && image[2].startsWith('uploading:')) {
        blocks.push(
          <div
            key={key}
            className="my-6 flex h-32 items-center justify-center rounded-2xl bg-surface-subtle text-sm text-text-muted"
          >
            Ảnh đang tải lên…
          </div>,
        );
        continue;
      }
      const src = safeUrl(image[2]);
      if (!src) continue;
      const caption = image[3]?.trim();
      const size = image[4] && FIGURE_CLASS[image[4]] ? image[4] : 'vua';
      blocks.push(
        <figure
          key={key}
          data-line={isPreview ? lineIndex : undefined}
          tabIndex={isPreview ? 0 : undefined}
          aria-label={isPreview ? `Chỉnh ảnh${image[1] ? `: ${image[1]}` : ''}` : undefined}
          className={`${isPreview && size === 'rong' ? PREVIEW_RONG : FIGURE_CLASS[size]} ${
            isPreview
              ? 'cursor-pointer rounded-2xl outline-offset-4 hover:outline hover:outline-2 hover:outline-primary-border'
              : ''
          }`.trim()}
        >
          <img
            src={src}
            alt={image[1]}
            loading="lazy"
            decoding="async"
            className="block h-auto w-full rounded-2xl"
          />
          {caption && (
            <figcaption className="mt-2 text-center text-sm leading-5 text-[#64748B]">
              {caption}
            </figcaption>
          )}
        </figure>,
      );
      continue;
    }

    if (line.trimStart().startsWith('>')) {
      const quote: string[] = [];
      while (i < lines.length && lines[i].trimStart().startsWith('>')) {
        quote.push(lines[i++].trimStart().replace(/^>\s?/, ''));
      }
      const marker = /^\[!([a-z-]+)\]$/.exec(quote[0].trim());
      const callout = marker ? CALLOUTS[marker[1]] : undefined;
      if (callout) {
        const Icon = callout.icon;
        const body = quote.slice(1);
        while (body.length && !body[body.length - 1].trim()) body.pop();
        blocks.push(
          <aside
            key={key}
            role="note"
            aria-label={callout.label}
            className={`my-5 flex gap-3 rounded-2xl px-4 py-3.5 ${callout.className}`}
          >
            <Icon className="mt-1 h-5 w-5 shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <p className="m-0 font-bold">{callout.label}</p>
              {body.length > 0 && <p className="m-0">{renderLines(body, key)}</p>}
            </div>
          </aside>,
        );
        continue;
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
      !LIST_ITEM.test(lines[i]) &&
      !IMAGE_BLOCK.test(lines[i])
    ) {
      paragraph.push(lines[i++]);
    }
    blocks.push(
      <p key={key} className="my-4">
        {renderLines(paragraph, key)}
      </p>,
    );
  }

  return <div className={BODY_CLASS[variant]}>{blocks}</div>;
}
