/**
 * @file useMessages.ts
 * @description Điều phối danh sách hội thoại, thread và thao tác gửi tin nhắn từ API SkillSwap.
 */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ConversationResponse, MessageResponse } from '@/models/message';
import { messageRepo } from '@/repositories/messageRepo';
import { getUserFriendlyError, showError } from '@/utils/toast';

function chronological(messages: MessageResponse[]) {
  return [...messages].sort((left, right) => {
    if (left.sequence !== right.sequence) return left.sequence - right.sequence;
    return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
  });
}

export function useMessages(preferredParticipantId?: string) {
  const [conversations, setConversations] = useState<ConversationResponse[]>([]);
  const [activeConversationId, setActiveConversationId] = useState('');
  const [messagesByConversation, setMessagesByConversation] = useState<
    Record<string, MessageResponse[]>
  >({});
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [conversationError, setConversationError] = useState<string>();
  const [messageError, setMessageError] = useState<string>();
  const [threadReloadKey, setThreadReloadKey] = useState(0);

  const loadConversations = useCallback(async () => {
    setIsLoadingConversations(true);
    setConversationError(undefined);
    try {
      const page = await messageRepo.getConversations({ limit: 50 });
      const items = page.items ?? [];
      setConversations(items);
      setActiveConversationId((current) => {
        if (preferredParticipantId) {
          return items.find((item) => item.otherUserId === preferredParticipantId)?.id ?? '';
        }
        return current && items.some((item) => item.id === current)
          ? current
          : (items[0]?.id ?? '');
      });
    } catch (reason) {
      console.error('[Messages] Failed to load conversations', reason);
      setConversationError(
        getUserFriendlyError(reason, {
          title: 'Không thể tải cuộc trò chuyện',
          description: 'Vui lòng thử lại sau.',
        }).description,
      );
    } finally {
      setIsLoadingConversations(false);
    }
  }, [preferredParticipantId]);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (!activeConversationId) return;
    let isCurrent = true;

    const loadThread = async () => {
      setIsLoadingMessages(true);
      setMessageError(undefined);
      try {
        const [detail, messages] = await Promise.all([
          messageRepo.getConversationDetail(activeConversationId),
          messageRepo.getMessages(activeConversationId, { limit: 50 }),
        ]);
        if (!isCurrent) return;

        const sortedMessages = chronological(messages);
        setMessagesByConversation((current) => ({
          ...current,
          [activeConversationId]: sortedMessages,
        }));
        setConversations((current) =>
          current.map((conversation) =>
            conversation.id === detail.id ? { ...conversation, ...detail } : conversation,
          ),
        );

        const lastReadSequence = sortedMessages.at(-1)?.sequence;
        if (lastReadSequence !== undefined && detail.unreadCount > 0) {
          void messageRepo
            .markAsRead(activeConversationId, { lastReadSequence })
            .then(() => {
              if (!isCurrent) return;
              setConversations((current) =>
                current.map((conversation) =>
                  conversation.id === activeConversationId
                    ? { ...conversation, unreadCount: 0, myLastReadSequence: lastReadSequence }
                    : conversation,
                ),
              );
            })
            .catch((reason) =>
              console.error('[Messages] Failed to mark conversation read', reason),
            );
        }
      } catch (reason) {
        if (!isCurrent) return;
        console.error('[Messages] Failed to load thread', reason);
        setMessageError(
          getUserFriendlyError(reason, {
            title: 'Không thể tải tin nhắn',
            description: 'Vui lòng thử lại sau.',
            notFoundDescription: 'Cuộc trò chuyện này không còn khả dụng.',
          }).description,
        );
      } finally {
        if (isCurrent) setIsLoadingMessages(false);
      }
    };

    void loadThread();
    return () => {
      isCurrent = false;
    };
  }, [activeConversationId, threadReloadKey]);

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId),
    [activeConversationId, conversations],
  );

  const sendMessage = useCallback(
    async (content: string) => {
      if (!activeConversation || isSending || !content.trim()) return false;
      setIsSending(true);
      try {
        const sentMessage = await messageRepo.sendMessage(activeConversation.id, {
          clientMessageId: crypto.randomUUID(),
          content: content.trim(),
        });
        setMessagesByConversation((current) => ({
          ...current,
          [activeConversation.id]: chronological([
            ...(current[activeConversation.id] ?? []),
            sentMessage,
          ]),
        }));
        setConversations((current) =>
          current.map((conversation) =>
            conversation.id === activeConversation.id
              ? {
                  ...conversation,
                  lastMessageContent: sentMessage.content,
                  lastMessageAt: sentMessage.createdAt,
                }
              : conversation,
          ),
        );
        return true;
      } catch (reason) {
        showError(reason, {
          title: 'Không thể gửi tin nhắn',
          description: 'Tin nhắn chưa được gửi. Vui lòng thử lại.',
        });
        return false;
      } finally {
        setIsSending(false);
      }
    },
    [activeConversation, isSending],
  );

  return {
    conversations,
    activeConversation,
    activeConversationId,
    messages: activeConversation ? (messagesByConversation[activeConversation.id] ?? []) : [],
    isLoadingConversations,
    isLoadingMessages,
    isSending,
    conversationError,
    messageError,
    setActiveConversationId,
    sendMessage,
    retryConversations: loadConversations,
    retryMessages: () => setThreadReloadKey((current) => current + 1),
  };
}
