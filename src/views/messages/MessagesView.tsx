/**
 * @file MessagesView.tsx
 * @description Giao diện trò chuyện giữa Mentor và Mentee dùng API SkillSwap.
 */

'use client';

import { useMemo, useState } from 'react';
import { ChatPanel } from './ChatPanel';
import { ConversationSidebar } from './ConversationSidebar';
import { useMessages } from './useMessages';

export function MessagesView({ preferredParticipantId }: { preferredParticipantId?: string }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [draft, setDraft] = useState('');
  const [isMobileThreadOpen, setIsMobileThreadOpen] = useState(false);
  const messages = useMessages(preferredParticipantId);

  const filteredConversations = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLocaleLowerCase('vi');
    if (!normalizedSearch) return messages.conversations;
    return messages.conversations.filter((conversation) =>
      (conversation.otherUserName ?? '').toLocaleLowerCase('vi').includes(normalizedSearch),
    );
  }, [messages.conversations, searchTerm]);

  const selectConversation = (conversationId: string) => {
    messages.setActiveConversationId(conversationId);
    setDraft('');
    setIsMobileThreadOpen(true);
  };

  const sendMessage = async () => {
    const text = draft.trim();
    if (!text) return;
    if (await messages.sendMessage(text)) setDraft('');
  };

  return (
    <div className="relative flex h-[calc(100dvh-7rem)] min-h-0 overflow-hidden rounded-2xl border border-border-color bg-white shadow-xs">
      <ConversationSidebar
        conversations={filteredConversations}
        activeConversationId={messages.activeConversationId}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onSelectConversation={selectConversation}
        mobileHidden={isMobileThreadOpen}
        isLoading={messages.isLoadingConversations}
        error={messages.conversationError}
        onRetry={messages.retryConversations}
      />
      <ChatPanel
        conversation={messages.activeConversation}
        messages={messages.messages}
        draft={draft}
        mobileVisible={isMobileThreadOpen}
        onDraftChange={setDraft}
        onSend={() => void sendMessage()}
        onBack={() => setIsMobileThreadOpen(false)}
        isLoading={messages.isLoadingMessages}
        isSending={messages.isSending}
        error={messages.messageError}
        onRetry={messages.retryMessages}
      />
    </div>
  );
}
