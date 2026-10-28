/**
 * @file NotificationMenu.tsx
 * @description Header bell: unread count, the latest notifications and a toast for new ones.
 * Each row is a link to the exact page and item (see notificationTargets); opening it marks the
 * notification read first.
 */

'use client';

import Link from 'next/link';
import {
  BadgeCheck,
  Bell,
  CalendarDays,
  LayoutGrid,
  MessageCircle,
  MessagesSquare,
  Newspaper,
  Settings,
  Star,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { showInfo } from '@/utils/toast';
import { BadgeCount } from './NavBadge';
import type { NavSection } from './notificationTargets';
import { useNotificationCenter, type NotificationEntry } from './useNotificationCenter';

const SECTION_ICONS: Record<NavSection, LucideIcon> = {
  home: MessagesSquare,
  findMentor: LayoutGrid,
  blog: Newspaper,
  booking: CalendarDays,
  mentorBookings: CalendarDays,
  schedule: Settings,
  courses: LayoutGrid,
  wallet: Wallet,
  profile: BadgeCheck,
  messages: MessageCircle,
};

type Filter = 'all' | 'unread';

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ''
    : new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(date);
}

function NotificationRow({ entry, onOpen }: { entry: NotificationEntry; onOpen: () => void }) {
  const { notification, target } = entry;
  const Icon = target.destination === 'Đánh giá buổi học' ? Star : SECTION_ICONS[target.section];
  const unread = !notification.read;
  return (
    <li>
      <Link
        href={target.href}
        onClick={onOpen}
        className={`flex w-full min-w-0 items-start gap-2.5 rounded-lg p-2.5 text-left no-underline transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary ${
          unread ? 'bg-primary-light/60 hover:bg-primary-light' : 'hover:bg-surface-subtle'
        }`}
      >
        <span
          aria-hidden="true"
          className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
            target.kind === 'action' ? 'bg-primary text-white' : 'bg-surface-subtle text-text-muted'
          }`}
        >
          <Icon className="h-4 w-4" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span
            className={`break-words text-xs leading-tight text-text-main ${unread ? 'font-semibold' : 'font-normal'}`}
          >
            {notification.title}
            {unread && <span className="sr-only"> (chưa đọc)</span>}
          </span>
          <span className="line-clamp-2 break-words text-[11px] leading-snug text-text-secondary">
            {notification.message}
          </span>
          <span className="text-[10px] text-text-muted">
            {formatDate(notification.createdAt)} · Mở {target.destination}
          </span>
        </span>
        {unread && (
          <span
            aria-hidden="true"
            className="mt-1 h-[9px] w-[9px] shrink-0 rounded-full bg-primary"
          />
        )}
      </Link>
    </li>
  );
}

export function NotificationMenu() {
  const { entries, unreadCount, isLoading, isError, refetch, markRead, markAllRead } =
    useNotificationCenter();
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const menuRef = useRef<HTMLDivElement>(null);
  const knownIdsRef = useRef<Set<string> | null>(null);
  const unreadEntries = entries.filter(({ notification }) => !notification.read);
  const visible = filter === 'unread' ? unreadEntries : entries;

  // Toast for notifications that arrive after the first load.
  useEffect(() => {
    if (isLoading) return;
    const ids = new Set(entries.map(({ notification }) => notification.notificationId));
    if (knownIdsRef.current) {
      entries
        .filter(
          ({ notification }) =>
            !notification.read && !knownIdsRef.current?.has(notification.notificationId),
        )
        .forEach(({ notification }) =>
          showInfo({ title: notification.title, description: notification.message }),
        );
    }
    knownIdsRef.current = new Set([...(knownIdsRef.current ?? []), ...ids]);
  }, [entries, isLoading]);

  useEffect(() => {
    const closeMenu = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', closeMenu);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeMenu);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  const open = (entry: NotificationEntry) => {
    if (!entry.notification.read) markRead([entry.notification.notificationId]);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        className="relative flex h-9.5 w-9.5 cursor-pointer items-center justify-center rounded-xl border border-solid border-border-color bg-white text-text-secondary transition-all hover:border-border-strong hover:text-text-main"
        aria-label={unreadCount > 0 ? `Thông báo, ${unreadCount} chưa đọc` : 'Thông báo'}
        aria-expanded={isOpen}
        aria-controls="notification-panel"
        onClick={() => {
          setIsOpen((current) => !current);
          if (!isOpen) refetch();
        }}
      >
        <Bell className="h-4.5 w-4.5" aria-hidden="true" />
        {unreadCount > 0 && <BadgeCount count={unreadCount} className="absolute -top-2 -right-2" />}
      </button>

      {isOpen && (
        <section
          id="notification-panel"
          className="fixed inset-x-2 top-[4.25rem] z-50 flex max-h-[calc(100dvh-4.75rem)] w-auto flex-col gap-2 overflow-hidden rounded-xl border border-solid border-border-light/80 bg-white p-3 shadow-2xl sm:absolute sm:inset-x-auto sm:top-full sm:right-0 sm:mt-2 sm:max-h-[480px] sm:w-96"
          aria-label="Thông báo"
        >
          <header className="flex shrink-0 items-center justify-between gap-2">
            <h2 className="m-0 text-sm font-bold text-text-main">Thông báo</h2>
            <button
              type="button"
              onClick={markAllRead}
              disabled={unreadEntries.length === 0 && unreadCount === 0}
              className="min-h-9 cursor-pointer rounded-lg border-0 bg-transparent px-2 text-xs font-semibold text-primary hover:bg-primary-light disabled:cursor-not-allowed disabled:text-text-disabled disabled:hover:bg-transparent"
            >
              Đánh dấu đã đọc hết
            </button>
          </header>

          <div className="flex shrink-0 gap-1.5" role="group" aria-label="Lọc thông báo">
            {(['all', 'unread'] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={filter === value}
                onClick={() => setFilter(value)}
                className={`min-h-9 cursor-pointer rounded-full border border-solid px-3 text-xs font-semibold transition-colors ${
                  filter === value
                    ? 'border-primary bg-primary text-white'
                    : 'border-border-color bg-white text-text-secondary hover:border-primary hover:text-primary'
                }`}
              >
                {value === 'all' ? 'Tất cả' : `Chưa đọc (${unreadEntries.length})`}
              </button>
            ))}
          </div>

          <div className="min-h-0 overflow-y-auto overscroll-contain border-0 border-t border-solid border-border-light pt-2">
            {isLoading ? (
              <p className="m-0 py-4 text-center text-xs text-text-muted">Đang tải thông báo...</p>
            ) : isError ? (
              <p className="m-0 py-4 text-center text-xs text-text-muted">
                Không thể tải thông báo.
              </p>
            ) : visible.length === 0 ? (
              <p className="m-0 py-6 text-center text-xs text-text-muted">
                Bạn đã xem hết thông báo.
              </p>
            ) : (
              <ul className="m-0 flex list-none flex-col gap-1 p-0">
                {visible.map((entry) => (
                  <NotificationRow
                    key={entry.notification.notificationId}
                    entry={entry}
                    onOpen={() => open(entry)}
                  />
                ))}
              </ul>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
