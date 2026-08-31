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
    <div className="flex items-center gap-3 relative">
      <label className="relative hidden sm:flex items-center">
        <Search aria-hidden="true" className="w-4 h-4 text-text-muted absolute left-3 pointer-events-none" />
        <input className="w-48 lg:w-64 h-9 pl-9 pr-3 rounded-xl border border-solid border-border-color bg-surface-subtle text-xs text-text-main transition-all outline-none focus:bg-white focus:border-primary focus:ring-3 focus:ring-primary-border" aria-label="Tìm kiếm" placeholder="Tìm kiếm..." />
      </label>
      <div className="relative">
        <button
          aria-label="Thông báo"
          aria-expanded={isOpen}
          type="button"
          className="relative w-9 h-9 rounded-xl border border-solid border-border-color hover:border-border-strong bg-white text-text-secondary hover:text-text-main flex items-center justify-center transition-colors cursor-pointer"
          onClick={() => {
            setIsOpen((current) => !current);
            if (!isOpen) void loadNotifications();
          }}
        >
          <Bell aria-hidden="true" className="w-4.5 h-4.5" />
          {unreadCount > 0 && <b className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-danger text-white text-[10px] font-bold leading-none">{unreadCount > 99 ? '99+' : unreadCount}</b>}
        </button>
        {isOpen && (
          <section className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-solid border-border-light p-3 z-50 flex flex-col gap-2" aria-label="Thông báo">
            <header className="flex items-center justify-between pb-2 border-b border-solid border-border-light">
              <div className="flex items-center gap-2">
                <strong className="text-xs font-bold text-text-main">Thông báo</strong>
                {unreadCount > 0 && <span className="text-[11px] font-semibold text-primary bg-primary-light px-2 py-0.5 rounded-full">{unreadCount} chưa đọc</span>}
              </div>
              <button
                type="button"
                className="p-1 text-text-muted hover:text-primary transition-colors border-none bg-transparent cursor-pointer disabled:opacity-40"
                onClick={() => void markAllRead()}
                disabled={!unreadCount}
                aria-label="Đánh dấu tất cả đã đọc"
              >
                <CheckCheck aria-hidden="true" className="w-4 h-4" />
              </button>
            </header>
            {loading ? (
              <p className="text-xs text-text-muted p-3 text-center m-0">Đang tải thông báo...</p>
            ) : error ? (
              <p className="text-xs text-danger p-3 text-center m-0">{error}</p>
            ) : items.length ? (
              <div className="flex flex-col gap-1 max-h-80 overflow-y-auto">
                {items.map((item) => (
                  <button
                    key={item.notificationId}
                    type="button"
                    className={`w-full p-2.5 rounded-xl border border-solid transition-colors text-left flex flex-col gap-1 border-none cursor-pointer ${item.read ? 'bg-white hover:bg-surface-subtle' : 'bg-primary-light/40 hover:bg-primary-light/70'}`}
                    onClick={() => void markRead(item)}
                  >
                    <strong className="text-xs font-bold text-text-main block">{item.title}</strong>
                    <span className="text-xs text-text-secondary leading-relaxed block">{item.message}</span>
                    <small className="text-[10px] text-text-muted block">{formatDate(item.createdAt)}</small>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-text-muted p-3 text-center m-0">Chưa có thông báo nào.</p>
            )}
          </section>
        )}
      </div>
      <button aria-label="Cài đặt" type="button" className="w-9 h-9 rounded-xl border border-solid border-border-color hover:border-border-strong bg-white text-text-secondary hover:text-text-main flex items-center justify-center transition-colors cursor-pointer">
        <Settings aria-hidden="true" className="w-4.5 h-4.5" />
      </button>

      <div className="relative" ref={profileMenuRef}>
        <button
          type="button"
          className="w-9 h-9 rounded-full bg-primary-light border border-solid border-primary-border text-primary font-bold text-xs flex items-center justify-center overflow-hidden cursor-pointer shrink-0"
          aria-label="Hồ sơ quản trị viên"
          aria-expanded={isProfileOpen}
          onClick={() => setIsProfileOpen((current) => !current)}
        >
          {user?.avatarUrl ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" /> : initials || 'A'}
        </button>
        {isProfileOpen && (
          <section className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-solid border-border-light p-2 z-50 flex flex-col gap-1" aria-label="Tùy chọn hồ sơ">
            <div className="p-2 border-b border-solid border-border-light/60 flex flex-col">
              <strong className="text-xs font-bold text-text-main">{user?.fullName || 'Quản trị viên'}</strong>
              <span className="text-[11px] text-text-muted truncate">{user?.email}</span>
            </div>
            <button
              type="button"
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-text-secondary hover:text-text-main hover:bg-surface-subtle transition-colors border-none bg-transparent cursor-pointer text-left"
              onClick={() => {
                setIsProfileOpen(false);
                router.push(`/${locale}/admin/profile`);
              }}
            >
              <UserRound aria-hidden="true" className="w-4 h-4 text-text-muted" /> Xem hồ sơ
            </button>
            <button
              type="button"
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-danger hover:bg-danger-soft transition-colors border-none bg-transparent cursor-pointer text-left border-t border-solid border-border-light/60 pt-2 mt-1"
              onClick={() => void handleLogout()}
            >
              <LogOut aria-hidden="true" className="w-4 h-4 text-danger" /> Đăng xuất
            </button>
          </section>
        )}
      </div>
    </div>
  );
}
