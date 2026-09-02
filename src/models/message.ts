/**
 * @file message.ts
 * @description Contract frontend cho API Trò chuyện theo OpenAPI SkillSwap.
 */

export type ConversationType = 'DIRECT' | 'GROUP';
export type ConversationStatus = 'ACTIVE' | 'LOCKED';
export type MessagingAccess = 'OPEN' | 'READ_ONLY';
export type ConversationReadOnlyReason =
  | 'ADMIN_LOCKED'
  | 'ACCOUNT_RESTRICTED'
  | 'UNDER_REVIEW'
  | 'PARTICIPANT_BLOCKED'
  | 'GROUP_MEMBERSHIP_REVOKED'
  | 'NO_EFFECTIVE_BOOKING'
  | 'CHAT_WINDOW_EXPIRED';

export interface ConversationResponse {
  id: string;
  type: ConversationType;
  status: ConversationStatus;
  otherUserId?: string | null;
  otherUserName?: string | null;
  otherUserAvatarUrl?: string | null;
  lastMessageContent?: string | null;
  lastMessageAt?: string | null;
  createdAt: string;
  unreadCount: number;
  myLastReadSequence?: number | null;
  otherLastReadSequence?: number | null;
  messagingAccess?: MessagingAccess;
  canSendMessages?: boolean;
  canUploadAttachments?: boolean;
  canDownloadAttachments?: boolean;
  readOnlyReason?: ConversationReadOnlyReason | null;
  messagingWindowEndsAt?: string | null;
  postSessionChatPermanent?: boolean;
  participantCount?: number | null;
}

export interface ConversationCursorPageResponse {
  items: ConversationResponse[];
  nextCursor?: string | null;
  prevCursor?: string | null;
  hasNext: boolean;
  hasPrev: boolean;
  limit: number;
}

export interface ChatAttachmentResponse {
  id?: string;
  [key: string]: unknown;
}

export interface MessageResponse {
  id: string;
  sequence: number;
  conversationId: string;
  senderId?: string | null;
  senderName?: string | null;
  messageType: 'TEXT' | 'SYSTEM';
  content?: string | null;
  state: 'ACTIVE' | 'DELETED';
  version: number;
  editedAt?: string | null;
  deletedAt?: string | null;
  isReadByOther?: boolean;
  attachments?: ChatAttachmentResponse[];
  createdAt: string;
  isMine: boolean;
}

export interface SendMessageRequest {
  clientMessageId: string;
  content: string;
  replyToMessageId?: string;
  attachmentIntentIds?: string[];
}

export interface ConversationReadRequest {
  lastReadSequence?: number;
}

export interface ConversationReadResponse {
  conversationId?: string;
  lastReadSequence?: number;
  unreadCount?: number;
}
