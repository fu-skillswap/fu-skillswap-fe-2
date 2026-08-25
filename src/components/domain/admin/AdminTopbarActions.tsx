/**
 * @file AdminTopbarActions.tsx
 * @description Nhóm thao tác và thông báo dùng chung trên top bar quản trị.
 */

'use client';

import { ApiClientError } from '@/models/apiClient';
import type { AdminNotification } from '@/models/admin';
import { adminRepo } from '@/repositories/adminRepo';
import { Bell, CheckCheck, Search, Settings } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export function AdminTopbarActions() {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const loadUnreadCount = useCallback(async () => {
    try {
      const result = await adminRepo.getUnreadNotificationCount();
      setUnreadCount(result.unreadCount);
    } catch {
      // Lỗi polling không nên làm gián đoạn thao tác quản trị.
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const result = await adminRepo.getNotifications({ limit: 10 });
      setItems(result.items);
      setUnreadCount(result.items.filter((item) => !item.read).length);
    } catch (reason) {
      setError(reason instanceof ApiClientError ? reason.message : 'Không thể tải thông báo.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUnreadCount();
    const interval = window.setInterval(() => void loadUnreadCount(), 30000);
    return () => window.clearInterval(interval);
  }, [loadUnreadCount]);

  const markRead = async (notification: AdminNotification) => {
    if (notification.read) return;
    try {
      await adminRepo.markNotificationAsRead(notification.notificationId);
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
      await adminRepo.markAllNotificationsAsRead();
      setItems((current) => current.map((item) => ({ ...item, read: true })));
      setUnreadCount(0);
    } catch (reason) {
      setError(reason instanceof ApiClientError ? reason.message : 'Không thể cập nhật thông báo.');
    }
  };

  return (
    <div className="admin-topbar-actions">
      <label>
        <Search aria-hidden="true" />
        <input aria-label="Tìm kiếm" placeholder="Tìm kiếm..." />
      </label>
      <div className="admin-notifications">
        <button
          aria-label="Thông báo"
          aria-expanded={isOpen}
          type="button"
          onClick={() => {
            setIsOpen((current) => !current);
            if (!isOpen) void loadNotifications();
          }}
        >
          <Bell aria-hidden="true" />
          {unreadCount > 0 && <b>{unreadCount > 99 ? '99+' : unreadCount}</b>}
        </button>
        {isOpen && (
          <section className="admin-notification-panel" aria-label="Thông báo">
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
                    className={item.read ? '' : 'is-unread'}
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
      <button aria-label="Cài đặt" type="button">
        <Settings aria-hidden="true" />
      </button>
      <div className="admin-avatar" aria-label="Hồ sơ quản trị viên">
        A
      </div>
    </div>
  );
}
