/**
 * @file useNotificationCenter.ts
 * @description Shared notification state for the header bell, both sidebars and the pages:
 * the latest notifications, the unread counts and optimistic mark-read. Every consumer reads the
 * same React Query cache, so one poll feeds all badges.
 *
 * TODO(api): the backend also pushes badge updates over WebSocket (`/user/queue/notifications/badge`);
 * the FE has no STOMP client yet, so this polls every 30 s while the tab is visible and on focus.
 */

'use client';

import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useMemo } from 'react';
import type { Notification } from '@/models/notification';
import { useAuth } from '@/providers/AuthProvider';
import { messageRepo } from '@/repositories/messageRepo';
import { notificationRepo } from '@/repositories/notificationRepo';
import {
  getNotificationTarget,
  type NavSection,
  type NotificationTarget,
} from './notificationTargets';

export const NOTIFICATION_POLL_MS = 30_000;
const NOTIFICATION_LIST_LIMIT = 50;

export const notificationKeys = {
  list: ['notifications', 'list'] as const,
  unreadCount: ['notifications', 'unread-count'] as const,
  chatUnread: ['conversations', 'unread-count'] as const,
  /** Notifications marked seen when their section was opened (see useMarkSectionSeen). */
  seen: (section: NavSection) => ['notifications', 'seen', section] as const,
};

/** Shared polling options: visible tab only, refresh on focus, never retry into a badge. */
export const POLL_OPTIONS = {
  refetchInterval: NOTIFICATION_POLL_MS,
  refetchIntervalInBackground: false,
  refetchOnWindowFocus: true,
  retry: false,
  staleTime: 10_000,
} as const;

export interface NotificationEntry {
  notification: Notification;
  target: NotificationTarget;
}

function setReadLocally(queryClient: QueryClient, ids: ReadonlySet<string> | 'all') {
  queryClient.setQueryData<Notification[]>(notificationKeys.list, (items) =>
    items?.map((item) =>
      ids === 'all' || ids.has(item.notificationId) ? { ...item, read: true } : item,
    ),
  );
  queryClient.setQueryData<number>(notificationKeys.unreadCount, (count) => {
    if (count === undefined) return count;
    return ids === 'all' ? 0 : Math.max(0, count - ids.size);
  });
}

export function useNotificationCenter() {
  const { user, isAuthenticated, isBootstrapping } = useAuth();
  const queryClient = useQueryClient();
  const enabled = isAuthenticated && !isBootstrapping;
  const isMentor = Boolean(user?.roles?.includes('MENTOR'));
  const params = useParams<{ locale?: string }>();
  const locale = params?.locale || 'vi';

  const list = useQuery({
    queryKey: notificationKeys.list,
    queryFn: async () =>
      (await notificationRepo.getNotifications({ limit: NOTIFICATION_LIST_LIMIT })).items ?? [],
    enabled,
    ...POLL_OPTIONS,
  });

  const unreadCount = useQuery({
    queryKey: notificationKeys.unreadCount,
    queryFn: async () => (await notificationRepo.getUnreadCount()).unreadCount ?? 0,
    enabled,
    ...POLL_OPTIONS,
  });

  const chatUnread = useQuery({
    queryKey: notificationKeys.chatUnread,
    queryFn: () => messageRepo.getUnreadCount(),
    enabled,
    ...POLL_OPTIONS,
  });

  const entries = useMemo<NotificationEntry[]>(
    () =>
      (list.data ?? []).map((notification) => ({
        notification,
        target: getNotificationTarget(notification, {
          locale,
          userId: user?.id,
          isMentor,
        }),
      })),
    [isMentor, list.data, locale, user?.id],
  );

  /** Optimistic: badges drop at once and come back if the request fails. */
  const markRead = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map((id) => notificationRepo.markAsRead(id)));
    },
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      const previous = {
        list: queryClient.getQueryData<Notification[]>(notificationKeys.list),
        count: queryClient.getQueryData<number>(notificationKeys.unreadCount),
      };
      setReadLocally(queryClient, new Set(ids));
      return previous;
    },
    onError: (_error, _ids, previous) => {
      queryClient.setQueryData(notificationKeys.list, previous?.list);
      queryClient.setQueryData(notificationKeys.unreadCount, previous?.count);
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount }),
  });

  const markAllRead = useMutation({
    mutationFn: () => notificationRepo.markAllAsRead(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      const previous = {
        list: queryClient.getQueryData<Notification[]>(notificationKeys.list),
        count: queryClient.getQueryData<number>(notificationKeys.unreadCount),
      };
      setReadLocally(queryClient, 'all');
      return previous;
    },
    onError: (_error, _vars, previous) => {
      queryClient.setQueryData(notificationKeys.list, previous?.list);
      queryClient.setQueryData(notificationKeys.unreadCount, previous?.count);
    },
  });

  return {
    enabled,
    isMentor,
    entries,
    isLoading: enabled && list.isPending,
    isError: list.isError,
    refetch: () => void list.refetch(),
    /** Failed requests hide the badge rather than show a stale or invented number. */
    unreadCount: unreadCount.isError ? 0 : (unreadCount.data ?? 0),
    hasUnreadMessages: !chatUnread.isError && (chatUnread.data ?? 0) > 0,
    markRead: (ids: string[]) => {
      if (ids.length) markRead.mutate(ids);
    },
    markAllRead: () => markAllRead.mutate(),
  };
}
