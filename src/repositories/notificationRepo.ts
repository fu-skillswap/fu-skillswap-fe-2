/**
 * @file notificationRepo.ts
 * @description Repository truy xuất và cập nhật thông báo cá nhân của người dùng.
 */

import { apiClient } from '@/models/apiClient';
import type {
  NotificationsQuery,
  NotificationsResponse,
  UnreadNotificationCount,
} from '@/models/notification';

function queryString(query: NotificationsQuery) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined) params.set(key, String(value));
  });
  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

/** Các thao tác với thông báo của người dùng đang đăng nhập. */
export const notificationRepo = {
  getNotifications: (query: NotificationsQuery = {}) =>
    apiClient<NotificationsResponse>(`/api/me/notifications${queryString(query)}`),

  getUnreadCount: () => apiClient<UnreadNotificationCount>('/api/me/notifications/unread-count'),

  markAsRead: (notificationId: string) =>
    apiClient<unknown>(`/api/me/notifications/${notificationId}/read`, { method: 'PATCH' }),

  markAllAsRead: () => apiClient<unknown>('/api/me/notifications/read-all', { method: 'PATCH' }),
};
