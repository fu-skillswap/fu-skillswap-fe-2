/**
 * @file MentorPostRow.tsx
 * @description Một dòng bài viết trong "Bài viết của tôi": ảnh bìa, trạng thái, tiêu đề, tóm tắt,
 * việc còn thiếu (bản nháp) hoặc lượt đọc (đã đăng) và các thao tác.
 */

'use client';

import { stripFormatting } from '@/components/domain/blog/BlogMarkdown';
import { BlogCoverFallback } from '@/components/domain/blog/BlogPostCard';
import { Button } from '@/components/ui/Button';
import type { MentorBlogPostDetailResponse, MentorBlogVisibility } from '@/models/auth';
import { showError, showSuccess } from '@/utils/toast';
import {
  Check,
  ExternalLink,
  Eye,
  Heart,
  Link as LinkIcon,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';

const VISIBILITY_LABELS: Record<MentorBlogVisibility, string> = {
  PUBLIC: 'Công khai',
  AUTHENTICATED: 'Thành viên đã đăng nhập',
  BOOKED_MEMBERS: 'Mentee đã đặt lịch',
};

/** Content shorter than this counts as unfinished in the draft checklist. */
const MIN_CONTENT_LENGTH = 300;

export interface MentorPostStats {
  viewCount: number;
  likeCount: number;
}

function formatDate(value?: string | null) {
  const date = new Date(value ?? '');
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function formatTime(value?: string | null) {
  const date = new Date(value ?? '');
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(date);
}

/** Plain-text summary: the excerpt, else the content without the title repeated at its start. */
function summaryOf(post: MentorBlogPostDetailResponse) {
  const excerpt = post.excerpt?.trim();
  if (excerpt) return excerpt;
  const text = stripFormatting(post.contentMarkdown ?? '');
  const title = post.title.trim();
  return title && text.toLowerCase().startsWith(title.toLowerCase())
    ? text.slice(title.length).replace(/^[\s:.\-–—]+/, '')
    : text;
}

export function postPublicPath(locale: string, post: MentorBlogPostDetailResponse) {
  return post.slug ? `/${locale}/blog/${encodeURIComponent(post.slug)}` : undefined;
}

const actionButtonClass = 'h-11 sm:h-9';
const outlineLinkClass =
  'inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-solid border-border-color bg-white px-3.5 text-xs font-bold text-text-main no-underline transition-colors hover:border-primary-border hover:text-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 sm:h-9 [&>svg]:h-4 [&>svg]:w-4';

export function MentorPostRow({
  post,
  locale,
  stats,
  onEdit,
  onArchive,
}: {
  post: MentorBlogPostDetailResponse;
  locale: string;
  /** Reader counters for published posts, when they could be loaded. */
  stats?: MentorPostStats;
  onEdit: () => void;
  onArchive: () => void;
}) {
  const isPublished = post.status === 'PUBLISHED';
  const publicPath = isPublished ? postPublicPath(locale, post) : undefined;
  const summary = summaryOf(post);
  const category = post.categories?.[0]?.name;

  const copyLink = async () => {
    if (!publicPath) return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${publicPath}`);
      showSuccess({ title: 'Đã sao chép liên kết' });
    } catch (reason) {
      showError(reason, { title: 'Không thể sao chép liên kết' });
    }
  };

  const meta = isPublished
    ? [formatDate(post.publishedAt ?? post.updatedAt), VISIBILITY_LABELS[post.visibility], category]
        .filter(Boolean)
        .join(' · ')
    : `Sửa lần cuối ${formatDate(post.updatedAt)} lúc ${formatTime(post.updatedAt)}`;

  return (
    <article className="flex flex-col gap-4 rounded-[20px] border border-solid border-slate-200 bg-white p-4 sm:flex-row sm:p-5">
      <div className="w-full shrink-0 sm:w-[200px]">
        {post.coverImageUrl ? (
          <img
            src={post.coverImageUrl}
            alt=""
            loading="lazy"
            className="aspect-[16/10] w-full rounded-[14px] object-cover"
          />
        ) : isPublished ? (
          <div className="aspect-[16/10] w-full overflow-hidden rounded-[14px]">
            <BlogCoverFallback
              post={{
                id: post.id,
                title: post.title,
                slug: post.slug ?? '',
                categories: post.categories,
              }}
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={onEdit}
            className="flex aspect-[16/10] w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-[14px] border-2 border-dashed border-slate-300 bg-slate-50 text-sm font-semibold text-slate-500 transition-colors hover:border-primary-border hover:text-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
          >
            <Plus className="h-5 w-5" aria-hidden="true" />
            Thêm ảnh bìa
          </button>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <StatusPill published={isPublished} />
              <span className="text-[13.5px] text-slate-500">{meta}</span>
            </div>
            <h3 className="m-0 text-[19px] font-extrabold leading-snug text-text-main">
              {publicPath ? (
                <Link
                  href={publicPath}
                  className="text-inherit no-underline hover:text-primary focus-visible:rounded focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
                >
                  {post.title}
                </Link>
              ) : (
                post.title
              )}
            </h3>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {isPublished ? (
              <>
                {publicPath && (
                  <Link href={publicPath} className={outlineLinkClass}>
                    <ExternalLink aria-hidden="true" />
                    Xem bài
                  </Link>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  leftIcon={<Pencil />}
                  className={actionButtonClass}
                  onClick={onEdit}
                >
                  Chỉnh sửa
                </Button>
                <RowMenu
                  items={[
                    ...(publicPath
                      ? [
                          {
                            label: 'Sao chép liên kết',
                            icon: <LinkIcon />,
                            onSelect: () => void copyLink(),
                          },
                        ]
                      : []),
                    {
                      label: 'Gỡ bài và lưu trữ',
                      icon: <Trash2 />,
                      danger: true,
                      separated: Boolean(publicPath),
                      onSelect: onArchive,
                    },
                  ]}
                />
              </>
            ) : (
              <>
                <Button
                  type="button"
                  size="sm"
                  leftIcon={<Pencil />}
                  className={actionButtonClass}
                  onClick={onEdit}
                >
                  Tiếp tục viết
                </Button>
                {/* The composer has no standalone preview route, so "Xem trước" is omitted. */}
                <RowMenu
                  items={[
                    { label: 'Xóa bản nháp', icon: <Trash2 />, danger: true, onSelect: onArchive },
                  ]}
                />
              </>
            )}
          </div>
        </div>

        {summary && (
          <p className="m-0 line-clamp-2 text-[14.5px] leading-relaxed text-slate-600">{summary}</p>
        )}

        {isPublished ? stats && <PublishedStats stats={stats} /> : <DraftChecklist post={post} />}
      </div>
    </article>
  );
}

function StatusPill({ published }: { published: boolean }) {
  return published ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-800">
      <Check className="h-3.5 w-3.5" aria-hidden="true" />
      Đã đăng
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
      Bản nháp
    </span>
  );
}

function DraftChecklist({ post }: { post: MentorBlogPostDetailResponse }) {
  const items = [
    { label: 'Ảnh bìa', done: Boolean(post.coverImageUrl) },
    { label: 'Chủ đề', done: Boolean(post.categories?.length) },
    { label: 'Mô tả ngắn', done: Boolean(post.excerpt?.trim()) },
    {
      label: 'Nội dung',
      done: (post.contentMarkdown?.trim().length ?? 0) >= MIN_CONTENT_LENGTH,
    },
  ];

  if (items.every((item) => item.done)) {
    return (
      <p className="m-0 flex items-center gap-1.5 text-[13px] font-bold text-green-700">
        <Check className="h-4 w-4" aria-hidden="true" />
        Sẵn sàng đăng
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 pt-1">
      <span className="mr-1 text-[13px] font-semibold text-slate-600">
        Còn thiếu trước khi đăng:
      </span>
      {items.map((item) =>
        item.done ? (
          <span
            key={item.label}
            className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700"
          >
            <Check className="h-3 w-3" aria-hidden="true" />
            {item.label}
            <span className="sr-only"> (đã có)</span>
          </span>
        ) : (
          <span
            key={item.label}
            className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-semibold text-orange-700"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-orange-500" aria-hidden="true" />
            {item.label}
            <span className="sr-only"> (còn thiếu)</span>
          </span>
        ),
      )}
    </div>
  );
}

function PublishedStats({ stats }: { stats: MentorPostStats }) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 pt-1 text-[13px] text-slate-600">
      <span className="flex items-center gap-1.5">
        <Eye className="h-4 w-4 text-slate-400" aria-hidden="true" />
        <span>
          <b className="text-text-main">{stats.viewCount}</b> lượt đọc
        </span>
      </span>
      <span className="flex items-center gap-1.5">
        <Heart className="h-4 w-4 text-slate-400" aria-hidden="true" />
        {stats.likeCount > 0 ? (
          <span>{stats.likeCount} lượt thích</span>
        ) : (
          <span className="text-text-muted">Chưa có lượt thích</span>
        )}
      </span>
    </div>
  );
}

interface RowMenuItem {
  label: string;
  icon: ReactNode;
  onSelect: () => void;
  danger?: boolean;
  /** Draws a divider above the item. */
  separated?: boolean;
}

function RowMenu({ items }: { items: RowMenuItem[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    itemRefs.current[0]?.focus();
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [isOpen]);

  const close = (restoreFocus: boolean) => {
    setIsOpen(false);
    if (restoreFocus) buttonRef.current?.focus();
  };

  const onMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const focusable = itemRefs.current.filter(Boolean) as HTMLButtonElement[];
    const index = focusable.indexOf(document.activeElement as HTMLButtonElement);
    const focusAt = (next: number) =>
      focusable[(next + focusable.length) % focusable.length]?.focus();
    if (event.key === 'Escape') {
      event.preventDefault();
      close(true);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      focusAt(index + 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      focusAt(index - 1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      focusAt(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      focusAt(focusable.length - 1);
    } else if (event.key === 'Tab') {
      close(false);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-label="Thêm thao tác"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' && !isOpen) {
            event.preventDefault();
            setIsOpen(true);
          }
        }}
        className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-solid border-border-color bg-white text-text-secondary transition-colors hover:border-primary-border hover:text-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 aria-expanded:border-primary-border aria-expanded:text-primary sm:h-9 sm:w-9"
      >
        <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
      </button>
      {isOpen && (
        <div
          role="menu"
          aria-label="Thao tác bài viết"
          onKeyDown={onMenuKeyDown}
          className="absolute right-0 top-full z-20 mt-1.5 w-56 rounded-xl border border-solid border-slate-200 bg-white p-1.5 shadow-[0_12px_32px_rgba(16,50,90,0.14)]"
        >
          {items.map((item, index) => (
            <div key={item.label} role="none">
              {item.separated && <div className="my-1 h-px bg-slate-200" role="separator" />}
              <button
                ref={(element) => {
                  itemRefs.current[index] = element;
                }}
                type="button"
                role="menuitem"
                tabIndex={-1}
                onClick={() => {
                  close(false);
                  item.onSelect();
                }}
                className={`flex min-h-11 w-full cursor-pointer items-center gap-2 rounded-lg border-0 bg-transparent px-2.5 text-left text-sm font-semibold focus-visible:outline-none sm:min-h-9 [&>svg]:h-4 [&>svg]:w-4 ${
                  item.danger
                    ? 'text-red-600 hover:bg-red-50 focus:bg-red-50'
                    : 'text-text-main hover:bg-surface-subtle focus:bg-surface-subtle'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function MentorPostRowSkeleton() {
  return (
    <div
      className="flex flex-col gap-4 rounded-[20px] border border-solid border-slate-200 bg-white p-4 animate-pulse motion-reduce:animate-none sm:flex-row sm:p-5"
      aria-hidden="true"
    >
      <div className="aspect-[16/10] w-full shrink-0 rounded-[14px] bg-surface-subtle sm:w-[200px]" />
      <div className="flex flex-1 flex-col gap-2.5">
        <span className="block h-5 w-48 rounded-full bg-surface-subtle" />
        <span className="block h-5 w-4/5 rounded bg-surface-subtle" />
        <span className="block h-4 w-full rounded bg-surface-subtle" />
        <span className="block h-4 w-2/3 rounded bg-surface-subtle" />
      </div>
    </div>
  );
}
