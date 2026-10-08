/**
 * @file useMentorRecommendations.ts
 * @description Gợi ý mentor cho Mentee: ưu tiên danh sách KouKou AI xếp lại, lỗi thì lùi về gợi ý
 * rule-based của Backend. Chỉ chạy ở trình duyệt (server không có token người dùng).
 */

'use client';

import type { MentorRecommendationItem } from '@/models/ai';
import type { Mentor } from '@/models/entities';
import { useAuth } from '@/providers/AuthProvider';
import { aiRepo } from '@/repositories/aiRepo';
import { mapApiMentorToEntity, mentorRepo } from '@/repositories/mentorRepo';
import { useQuery } from '@tanstack/react-query';

export interface RecommendedMentor {
  mentor: Mentor;
  /** Personalised AI reason (only when the list was reranked). */
  aiReason?: string;
  /** First rule-based reason from the backend. */
  matchReason?: string;
}

export interface MentorRecommendations {
  items: RecommendedMentor[];
  /** True when KouKou AI reranked the list (shows the AI caption). */
  reranked: boolean;
}

/** `matchReasons` entries may be plain strings or objects with a text field. */
function reasonText(value: unknown): string | undefined {
  if (typeof value === 'string') return value.trim() || undefined;
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    for (const key of ['text', 'label', 'message', 'reason', 'description']) {
      const text = record[key];
      if (typeof text === 'string' && text.trim()) return text.trim();
    }
  }
  return undefined;
}

function toRecommendations(
  items: MentorRecommendationItem[],
  reranked: boolean,
  limit: number,
): MentorRecommendations {
  const mapped = items
    .map((item) => ({
      mentor: mapApiMentorToEntity(item),
      aiReason: reranked ? item.aiReason?.trim() || undefined : undefined,
      matchReason: Array.isArray(item.matchReasons)
        ? item.matchReasons.map(reasonText).find(Boolean)
        : undefined,
    }))
    // The id is only in mentor.identity; an item without one cannot link anywhere.
    .filter((item) => item.mentor.id);
  return { items: mapped.slice(0, limit), reranked };
}

async function fetchRecommendations(limit: number): Promise<MentorRecommendations> {
  try {
    const result = await aiRepo.getRecommendations(limit);
    return toRecommendations(result.items, result.reranked, limit);
  } catch {
    // AI unavailable (not configured, 502, network…): use the backend's own ranking.
    const items = await mentorRepo.getRecommendations();
    return toRecommendations(items, false, limit);
  }
}

export function useMentorRecommendations(limit = 6) {
  const { user, isAuthenticated, isBootstrapping } = useAuth();
  return useQuery({
    queryKey: ['mentor-recommendations', user?.id, limit],
    queryFn: () => fetchRecommendations(limit),
    enabled: isAuthenticated && !isBootstrapping,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
}
