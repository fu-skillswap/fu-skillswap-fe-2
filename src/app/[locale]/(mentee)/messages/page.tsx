/**
 * @file page.tsx
 * @description Route giao diện tin nhắn dùng chung cho Mentor và Mentee.
 */

import { MessagesView } from '@/views/messages/MessagesView';

interface MessagesPageProps {
  searchParams: Promise<{ participantId?: string }>;
}

export default async function MessagesPage({ searchParams }: MessagesPageProps) {
  const { participantId } = await searchParams;
  return <MessagesView preferredParticipantId={participantId} />;
}
