/**
 * @file AdminTopbarActions.tsx
 * @description Nhóm thao tác và thông báo dùng chung trên top bar quản trị.
 */

'use client';

import { ApiClientError } from '@/models/apiClient';
import type { Notification } from '@/models/notification';
import { useAuth } from '@/providers/AuthProvider';
import { notificationRepo } from '@/repositories/notificationRepo';
import { Bell, CheckCheck, LogOut, Search, Settings, UserRound } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export function AdminTopbarActions() {
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();
  const { logout, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const loadUnreadCount = useCallback(async () => {
    try {
      const result = await notificationRepo.getUnreadCount();
      setUnreadCount(result.unreadCount);
    } catch {
      // Lỗi polling không nên làm gián đoạn thao tác quản trị.
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const result = await notificationRepo.getNotifications({ limit: 10 });
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

  useEffect(() => {
    const closeMenu = (event: MouseEvent) => {
      if (!profileMenuRef.current?.contains(event.target as Node)) setIsProfileOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsProfileOpen(false);
    };
    document.addEventListener('mousedown', closeMenu);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeMenu);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  const initials = user?.fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  const handleLogout = async () => {
    setIsProfileOpen(false);
    await logout();
    router.replace(`/${locale}/admin/login`);
  };

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
      <div className="admin-profile-menu" ref={profileMenuRef}>
        <button
          type="button"
          className="admin-avatar"
          aria-label="Hồ sơ quản trị viên"
          aria-expanded={isProfileOpen}
          onClick={() => setIsProfileOpen((current) => !current)}
        >
          {user?.avatarUrl ? <img src={user.avatarUrl} alt="" /> : initials || 'A'}
        </button>
        {isProfileOpen && (
          <section className="admin-profile-menu-panel" aria-label="Tùy chọn hồ sơ">
            <div>
              <strong>{user?.fullName || 'Quản trị viên'}</strong>
              <span>{user?.email}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsProfileOpen(false);
                router.push(`/${locale}/admin/profile`);
              }}
            >
              <UserRound aria-hidden="true" /> Xem hồ sơ
            </button>
            <button
              type="button"
              className="admin-profile-logout"
              onClick={() => void handleLogout()}
            >
              <LogOut aria-hidden="true" /> Đăng xuất
            </button>
          </section>
        )}
      </div>
    </div>
  );
}
