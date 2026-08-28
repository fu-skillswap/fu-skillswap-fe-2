/**
 * @file notification.ts
 * @description Kiểu dữ liệu thông báo cá nhân trả về từ API.
 */

export interface Notification {
  notificationId: string;
  type: string;
  title: string;
  message: string;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  deepLink: string | null;
  actionType: string | null;
  read: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationsResponse {
  items: Notification[];
  nextCursor: string | null;
  prevCursor: string | null;
  hasNext: boolean;
  hasPrev: boolean;
  limit: number;
}

export interface NotificationsQuery {
  unreadOnly?: boolean;
  cursor?: string;
  limit?: number;
}

export interface UnreadNotificationCount {
  unreadCount: number;
}
