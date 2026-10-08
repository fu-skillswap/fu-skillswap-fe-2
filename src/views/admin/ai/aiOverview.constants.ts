/**
 * @file aiOverview.constants.ts
 * @description Nội dung tĩnh, màu biểu đồ và hàm định dạng cho trang Tổng quan AI.
 */

import type { AiFeatureGroupKey } from '@/constants/aiFeatures';
import {
  BookOpen,
  MessageCircle,
  MessagesSquare,
  Mic,
  ShieldCheck,
  UserRoundSearch,
  type LucideIcon,
} from 'lucide-react';

/** Used when today's usage is unknown (no `/v1/ops/usage` yet or no chat calls today). */
export const FALLBACK_CHAT_COST_PER_ANSWER_VND = 9;

/** Defaults mirrored from ai-skillswap/app/config.py; `getFeatures().limits` overrides them. */
export const DEFAULT_LIMITS = {
  daily_budget_vnd: 25_000,
  chat_rate_limit_per_hour: 20,
  forum_max_replies_per_hour: 6,
  forum_grace_minutes: 15,
  rate_limit_rpm: 50,
} as const;

export type LimitKey = keyof typeof DEFAULT_LIMITS;

/**
 * Categorical slots 1–6 of the dataviz reference palette, in fixed order per feature group
 * (validated light-mode; values are always printed in the legend because 3 slots are < 3:1).
 */
export const GROUP_COLORS: Record<AiFeatureGroupKey, string> = {
  chatbot: '#2a78d6',
  moderation: '#eb6834',
  recommend: '#1baf7a',
  forum_bot: '#eda100',
  meeting_summary: '#e87ba4',
  knowledge: '#008300',
};

export const OTHER_COLOR = '#8394ac';

export interface FeatureCopy {
  icon: LucideIcon;
  description: string;
  /** Unit in "≈ 9,7đ / câu". */
  perUnit?: string;
  /** Shown under "Đang tắt" when the server gives no reason. */
  enableHint?: string;
}

export const FEATURE_COPY: Record<AiFeatureGroupKey, FeatureCopy> = {
  chatbot: {
    icon: MessageCircle,
    description:
      'Trả lời sinh viên trong khung chat: cách dùng SkillSwap, quy chế, gợi ý mentor, xem lịch học.',
    perUnit: 'câu',
  },
  moderation: {
    icon: ShieldCheck,
    description: 'Đọc mọi bài viết và bình luận mới, chấm 5 nhóm vi phạm. AI lỗi thì vẫn cho đăng.',
    perUnit: 'nội dung',
  },
  recommend: {
    icon: UserRoundSearch,
    description:
      'Xếp lại 20 mentor hợp nhất cho từng sinh viên, kèm lý do. Kết quả giữ 24 giờ nên mỗi người chỉ tốn 1 lần/ngày.',
    perUnit: 'lượt',
  },
  forum_bot: {
    icon: MessagesSquare,
    description:
      'Tự trả lời câu hỏi chưa ai trả lời sau 15 phút, kèm mentor phù hợp. Tối đa 6 câu/giờ.',
    perUnit: 'bài',
    enableHint: 'Bật bằng FORUM_BOT_ENABLED',
  },
  meeting_summary: {
    icon: Mic,
    description:
      'Chép lời từng người nói trong buổi mentoring rồi tóm tắt, giao việc. Trừ credit của người dùng.',
    enableHint: 'Bật bằng MEETINGS_ENABLED',
  },
  knowledge: {
    icon: BookOpen,
    description: 'Cắt và nhúng tài liệu vào kho tri thức để KouKou trích dẫn.',
  },
};

/** Groups shown as rows in "Các tính năng AI" (knowledge indexing has its own card). */
export const FEATURE_ROW_KEYS: AiFeatureGroupKey[] = [
  'chatbot',
  'moderation',
  'recommend',
  'forum_bot',
  'meeting_summary',
];

const vndFormatter = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 });
const numberFormatter = new Intl.NumberFormat('vi-VN');

/** "8.420đ" */
export function formatVnd(value: number) {
  return `${vndFormatter.format(Math.round(value))}đ`;
}

/** "≈ 9,7đ" for small per-unit costs, whole đồng otherwise. */
export function formatUnitVnd(value: number) {
  const digits = value < 100 ? 1 : 0;
  return `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: digits }).format(value)}đ`;
}

export function formatCount(value: number) {
  return numberFormatter.format(value);
}

/** Rounds an estimate so it doesn't look more precise than it is: 1.709 → 1.700, 487 → 490. */
export function roundEstimate(value: number) {
  if (value >= 1000) return Math.floor(value / 100) * 100;
  if (value >= 100) return Math.floor(value / 10) * 10;
  return Math.floor(value);
}
