/**
 * @file NotificationMenu.tsx
 * @description Chuông thông báo cá nhân, tự làm mới định kỳ và hiển thị toast cho thông báo mới.
 */

'use client';

import { ApiClientError } from '@/models/apiClient';
import type { Notification } from '@/models/notification';
import { notificationRepo } from '@/repositories/notificationRepo';
import { showInfo } from '@/utils/toast';
import { Bell, CheckCheck } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

const POLLING_INTERVAL_MS = 30_000;
const NOTIFICATION_LIMIT = 20;

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export function NotificationMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const initializedRef = useRef(false);
  const knownNotificationIdsRef = useRef(new Set<string>());
  const menuRef = useRef<HTMLDivElement>(null);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const result = await notificationRepo.getNotifications({ limit: NOTIFICATION_LIMIT });

      if (initializedRef.current) {
        result.items
          .filter((item) => !knownNotificationIdsRef.current.has(item.notificationId))
          .forEach((item) => {
            showInfo({ title: item.title, description: item.message });
          });
      }

      result.items.forEach((item) => knownNotificationIdsRef.current.add(item.notificationId));
      initializedRef.current = true;
      setItems(result.items);
      setUnreadCount(result.items.filter((item) => !item.read).length);
    } catch (reason) {
      setError(reason instanceof ApiClientError ? reason.message : 'Không thể tải thông báo.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUnreadCount = useCallback(async () => {
    try {
      const result = await notificationRepo.getUnreadCount();
      setUnreadCount(result.unreadCount);
    } catch {
      // Lỗi polling không nên làm gián đoạn trải nghiệm chính của người dùng.
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
    const interval = window.setInterval(() => {
      void loadNotifications();
    }, POLLING_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [loadNotifications]);

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

  const markRead = async (notification: Notification) => {
    if (notification.read) return;
    try {
      await notificationRepo.markAsRead(notification.notificationId);
      setItems((current) =>
        current.map((item) =>
          item.notificationId === notification.notificationId ? { ...item, read: true } : item,
        ),
      );
      setUnreadCount((current) => Math.max(0, current - 1));
    } catch (reason) {
      setError(reason instanceof ApiClientError ? reason.message : 'Không thể cập nhật thông báo.');
    }
  };

  const markAllRead = async () => {
    try {
      await notificationRepo.markAllAsRead();
      setItems((current) => current.map((item) => ({ ...item, read: true })));
      setUnreadCount(0);
    } catch (reason) {
      setError(reason instanceof ApiClientError ? reason.message : 'Không thể cập nhật thông báo.');
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        className="w-9.5 h-9.5 rounded-xl border border-solid border-border-color hover:border-border-strong bg-white text-text-secondary hover:text-text-main flex items-center justify-center transition-all cursor-pointer relative"
        aria-label="Thông báo"
        aria-expanded={isOpen}
        onClick={() => {
          setIsOpen((current) => !current);
          if (!isOpen) {
            void loadNotifications();
            void loadUnreadCount();
          }
        }}
      >
        <Bell className="w-4.5 h-4.5" aria-hidden="true" />
        {unreadCount > 0 && (
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-danger ring-2 ring-white"
            aria-hidden="true"
          />
        )}
      </button>

      {isOpen && (
        <section
          className="fixed inset-x-2 top-[4.25rem] z-50 flex max-h-[calc(100dvh-4.75rem)] w-auto flex-col gap-2 overflow-hidden rounded-xl border border-solid border-border-light/80 bg-white p-3 shadow-2xl backdrop-blur-md duration-150 animate-in fade-in-0 zoom-in-95 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:max-h-[420px] sm:w-80 sm:bg-white/95"
          aria-label="Danh sách thông báo"
        >
          <header className="flex shrink-0 items-center justify-between border-b border-solid border-border-light pb-2">
            <div className="flex items-center gap-2">
              <strong className="text-xs font-bold text-text-main">Thông báo</strong>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary-light text-primary">
                  {unreadCount} chưa đọc
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => void markAllRead()}
              disabled={!unreadCount}
              aria-label="Đánh dấu tất cả đã đọc"
              className="p-1 rounded-lg text-text-muted hover:text-primary hover:bg-primary-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors border-none bg-transparent cursor-pointer"
              title="Đánh dấu tất cả đã đọc"
            >
              <CheckCheck className="w-4 h-4" aria-hidden="true" />
            </button>
          </header>
          <div className="min-h-0 overflow-y-auto overscroll-contain">
            {loading ? (
              <p className="m-0 py-4 text-center text-xs text-text-muted">Đang tải thông báo...</p>
            ) : error ? (
              <p className="m-0 py-4 text-center text-xs text-danger">{error}</p>
            ) : items.length ? (
              <div className="flex flex-col gap-1">
                {items.map((item) => (
                  <button
                    key={item.notificationId}
                    type="button"
                    className={`flex w-full min-w-0 cursor-pointer flex-col gap-1 rounded-lg border-none p-2.5 text-left transition-all ${
                      item.read
                        ? 'bg-transparent text-text-secondary hover:bg-surface-subtle'
                        : 'bg-primary-light/50 font-semibold text-text-main hover:bg-primary-light'
                    }`}
                    onClick={() => void markRead(item)}
                  >
                    <div className="flex w-full min-w-0 items-start justify-between gap-2">
                      <strong className="min-w-0 break-words text-xs font-bold leading-tight">
                        {item.title}
                      </strong>
                      {!item.read && (
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      )}
                    </div>
                    <span className="line-clamp-2 break-words text-[11px] leading-snug text-text-secondary">
                      {item.message}
                    </span>
                    <small className="text-[10px] text-text-muted">
                      {formatDate(item.createdAt)}
                    </small>
                  </button>
                ))}
              </div>
            ) : (
              <p className="m-0 py-6 text-center text-xs text-text-muted">Chưa có thông báo nào.</p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
