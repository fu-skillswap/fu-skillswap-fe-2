/**
 * @file NotificationMenu.tsx
 * @description Chuông thông báo cá nhân, tự làm mới định kỳ và hiển thị toast cho thông báo mới.
 */

'use client';

import { ApiClientError } from '@/models/apiClient';
import type { Notification } from '@/models/notification';
import { notificationRepo } from '@/repositories/notificationRepo';
import { Bell, CheckCheck } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';

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
            toast(`${item.title}: ${item.message}`, { duration: 5000 });
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
    <div className="figma-notifications" ref={menuRef}>
      <button
        type="button"
        className="figma-icon-button"
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
        <Bell className="figma-bell" aria-hidden="true" />
        {unreadCount > 0 && <span className="figma-notification-dot" aria-hidden="true" />}
      </button>

      {isOpen && (
        <section className="figma-notification-panel" aria-label="Danh sách thông báo">
          <header>
            <div>
              <strong>Thông báo</strong>
              {unreadCount > 0 && <span>{unreadCount} chưa đọc</span>}
            </div>
            <button
              type="button"
              onClick={() => void markAllRead()}
              disabled={!unreadCount}
              aria-label="Đánh dấu tất cả đã đọc"
            >
              <CheckCheck aria-hidden="true" />
            </button>
          </header>
          {loading ? (
            <p>Đang tải thông báo...</p>
          ) : error ? (
            <p>{error}</p>
          ) : items.length ? (
            <div>
              {items.map((item) => (
                <button
                  key={item.notificationId}
                  type="button"
                  className={item.read ? 'is-read' : 'is-unread'}
                  onClick={() => void markRead(item)}
                >
                  <strong>{item.title}</strong>
                  <span>{item.message}</span>
                  <small>{formatDate(item.createdAt)}</small>
                </button>
              ))}
            </div>
          ) : (
            <p>Chưa có thông báo nào.</p>
          )}
        </section>
      )}
    </div>
  );
}
