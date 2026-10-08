/**
 * @file aiFeatures.ts
 * @description Gom các khóa tính năng trong sổ cái chi phí AI (`ai_usage.feature`) thành nhóm hiển thị
 * cho trang quản trị.
 */

import type { AiUsageFeatureToday } from '@/models/ai';

export type AiFeatureGroupKey =
  'chatbot' | 'moderation' | 'recommend' | 'forum_bot' | 'meeting_summary' | 'knowledge';

export interface AiFeatureGroup {
  key: AiFeatureGroupKey;
  label: string;
  /** Ledger feature keys written by ai-skillswap for this group. */
  ledgerKeys: string[];
  /** Unit of work shown to admins, e.g. "câu trả lời". */
  unit?: string;
  /** Ledger keys whose call count equals the unit count (other keys are internal steps). */
  unitLedgerKeys?: string[];
}

export const AI_FEATURE_GROUPS: AiFeatureGroup[] = [
  {
    key: 'chatbot',
    label: 'Chatbot KouKou',
    ledgerKeys: ['chat', 'chat_triage', 'chat_rag'],
    unit: 'câu trả lời',
    unitLedgerKeys: ['chat'],
  },
  {
    key: 'moderation',
    label: 'Kiểm duyệt nội dung',
    ledgerKeys: ['moderation'],
    unit: 'nội dung',
    unitLedgerKeys: ['moderation'],
  },
  {
    key: 'recommend',
    label: 'Gợi ý mentor',
    ledgerKeys: ['recommend', 'recommendation'],
    unit: 'lượt xếp hạng',
    unitLedgerKeys: ['recommend', 'recommendation'],
  },
  {
    key: 'forum_bot',
    label: 'Bot diễn đàn',
    ledgerKeys: ['forum_triage', 'forum_rag', 'forum_answer'],
    unit: 'bài đã trả lời',
    unitLedgerKeys: ['forum_answer'],
  },
  {
    key: 'meeting_summary',
    label: 'Tóm tắt buổi học',
    ledgerKeys: ['transcribe', 'meeting_summary'],
  },
  {
    key: 'knowledge',
    label: 'Kho tri thức',
    ledgerKeys: ['embedding', 'rag_translate'],
  },
];

/** Prefixes for ledger keys added later on the AI side (e.g. `chat_rewrite`). */
const PREFIX_FALLBACKS: Array<[string, AiFeatureGroupKey]> = [
  ['chat', 'chatbot'],
  ['forum', 'forum_bot'],
  ['recommend', 'recommend'],
  ['meeting', 'meeting_summary'],
];

export function getAiFeatureGroup(ledgerKey: string): AiFeatureGroup | undefined {
  const exact = AI_FEATURE_GROUPS.find((group) => group.ledgerKeys.includes(ledgerKey));
  if (exact) return exact;
  const prefix = PREFIX_FALLBACKS.find(([value]) => ledgerKey.startsWith(value));
  return prefix && AI_FEATURE_GROUPS.find((group) => group.key === prefix[1]);
}

export interface AiFeatureGroupSpend {
  group: AiFeatureGroup;
  costVnd: number;
}

/**
 * Sums `GET /v1/ops/budget` `by_feature` into display groups (only groups that spent something).
 * Unknown ledger keys are returned in `otherVnd` so the total still adds up.
 */
export function groupSpendByFeature(byFeature: Record<string, number>) {
  const totals = new Map<AiFeatureGroupKey, number>();
  let otherVnd = 0;
  Object.entries(byFeature).forEach(([ledgerKey, vnd]) => {
    const group = getAiFeatureGroup(ledgerKey);
    if (group) totals.set(group.key, (totals.get(group.key) ?? 0) + vnd);
    else otherVnd += vnd;
  });
  const groups: AiFeatureGroupSpend[] = AI_FEATURE_GROUPS.filter((group) =>
    totals.has(group.key),
  ).map((group) => ({ group, costVnd: totals.get(group.key) ?? 0 }));
  return { groups, otherVnd };
}

/** Unit count for a group from `GET /v1/ops/usage` `today` rows (e.g. chat answers today). */
export function getUnitCount(group: AiFeatureGroup, today: AiUsageFeatureToday[]) {
  if (!group.unitLedgerKeys) return undefined;
  return today
    .filter((row) => group.unitLedgerKeys?.includes(row.feature))
    .reduce((sum, row) => sum + row.calls, 0);
}

/* -------------------------------------------------------------------------- */
/* Feature detail pages (/admin/ai/features/[key])                             */
/* Facts mirror ai-skillswap app/config.py + app/services/*.py — update both.  */
/* -------------------------------------------------------------------------- */

export interface AiPipelineStep {
  title: string;
  description: string;
  /** Model name shown as a chip. */
  model?: string;
  /** Cost hint, e.g. "~20% chi phí" or "0đ". */
  cost?: string;
}

export interface AiSettingRow {
  label: string;
  value: string;
}

/** Stats shown in the strip under the header, in order. */
export type AiDetailStat = 'units' | 'cost' | 'feedback' | 'rateLimited';

export interface AiFeatureDetail {
  /** One paragraph under the title. */
  description: string;
  /** Title of the pipeline card. */
  pipelineTitle: string;
  steps: AiPipelineStep[];
  stats: AiDetailStat[];
  /** `ai_feedback.feature` value, when users can rate this feature. */
  feedbackFeature?: 'chat' | 'forum_answer' | 'rerank';
  /** Show "Hôm nay KouKou đã dùng dữ liệu gì" (chat tools). */
  showToolUsage?: boolean;
  /** Defaults from ai-skillswap config, shown until GET /v1/ops/features returns live values. */
  defaultSettings: AiSettingRow[];
}

export const AI_FEATURE_DETAILS: Record<AiFeatureGroupKey, AiFeatureDetail> = {
  chatbot: {
    description:
      'KouKou là trợ lý trong khung chat của sinh viên. KouKou trả lời câu hỏi về cách dùng SkillSwap và quy chế học tập, gợi ý mentor phù hợp và xem lịch học của chính sinh viên đó. Mỗi câu trả lời đi qua 4 bước bên dưới.',
    pipelineTitle: 'KouKou trả lời một câu hỏi như thế nào',
    steps: [
      {
        title: 'Nhận câu hỏi',
        description: 'Sinh viên gõ câu hỏi trong khung chat. Mỗi người hỏi tối đa 20 câu mỗi giờ.',
        cost: '0đ',
      },
      {
        title: 'Đoán cần dữ liệu gì',
        description:
          'Một model nhỏ đọc câu hỏi và chọn cần tra tài liệu, tìm mentor hay xem lịch học.',
        model: 'gemma-4-26B-A4B-it',
        cost: '~20% chi phí',
      },
      {
        title: 'Lấy dữ liệu',
        description:
          'Tìm đoạn tài liệu liên quan trong kho tri thức, hỏi backend về mentor hoặc lịch học. Dùng quyền của chính sinh viên nên không thấy dữ liệu người khác.',
        model: 'Vietnamese_Embedding',
        cost: '~0đ',
      },
      {
        title: 'Viết câu trả lời',
        description: 'Model chính viết câu trả lời từ dữ liệu vừa lấy, tối đa 800 token.',
        model: 'DeepSeek-V4-Flash',
        cost: '~80% chi phí',
      },
    ],
    stats: ['units', 'cost', 'feedback', 'rateLimited'],
    feedbackFeature: 'chat',
    showToolUsage: true,
    defaultSettings: [
      { label: 'Model viết câu trả lời', value: 'DeepSeek-V4-Flash' },
      { label: 'Model phân loại câu hỏi', value: 'gemma-4-26B-A4B-it' },
      { label: 'Model tìm tài liệu', value: 'Vietnamese_Embedding' },
      { label: 'Giới hạn mỗi sinh viên', value: '20 câu/giờ' },
      { label: 'Số tin nhắn nhớ trong hội thoại', value: '20' },
      { label: 'Độ dài trả lời tối đa', value: '800 token' },
      { label: 'Tra tài liệu song ngữ (Việt + Anh)', value: 'Bật' },
    ],
  },
  moderation: {
    description:
      'Mọi bài viết và bình luận mới trên diễn đàn được AI đọc và chấm điểm 5 nhóm vi phạm ngay khi đăng. Nội dung nặng bị chặn, nội dung đáng ngờ vẫn hiển thị nhưng được đưa cho quản trị viên xem lại.',
    pipelineTitle: 'AI kiểm duyệt một nội dung như thế nào',
    steps: [
      {
        title: 'Đọc nội dung',
        description: 'Backend gửi bài viết hoặc bình luận sang AI ngay khi người dùng bấm đăng.',
        cost: '0đ',
      },
      {
        title: 'Chấm 5 nhóm',
        description:
          'Chấm mức 0–3 cho xúc phạm, spam, chính trị, thù ghét và nhạy cảm. Lấy mức cao nhất.',
        model: 'gemma-4-26B-A4B-it',
      },
      {
        title: 'Cho đăng, xem lại hoặc chặn',
        description:
          'Mức 3: chặn, không đăng. Mức 2: vẫn đăng nhưng vào hàng đợi cho quản trị viên. Dưới 2: cho đăng.',
      },
      {
        title: 'AI lỗi thì cho đăng',
        description:
          'Hết hạn mức, hết ngân sách hay model lỗi đều cho đăng bình thường, chỉ không chấm điểm.',
      },
    ],
    stats: ['units', 'cost'],
    defaultSettings: [
      { label: 'Model chấm điểm', value: 'gemma-4-26B-A4B-it' },
      { label: 'Đưa vào hàng đợi khi', value: 'Mức ≥ 2' },
      { label: 'Chặn không đăng khi', value: 'Mức 3' },
      { label: 'Khi AI lỗi', value: 'Cho đăng' },
    ],
  },
  recommend: {
    description:
      'Khi sinh viên tìm mentor, backend lọc danh sách theo luật có sẵn rồi AI xếp lại những người hợp nhất và viết lý do ngắn cho từng người. Kết quả được giữ 24 giờ nên chi phí rất thấp.',
    pipelineTitle: 'AI gợi ý mentor như thế nào',
    steps: [
      {
        title: 'Backend lọc',
        description:
          'Backend lọc mentor theo chuyên ngành, môn học và lịch trống bằng luật có sẵn.',
        cost: '0đ',
      },
      {
        title: 'AI xếp lại 20 mentor',
        description: 'AI xếp lại 20 mentor hợp nhất và viết một lý do ngắn cho từng người.',
        model: 'gpt-oss-120b',
      },
      {
        title: 'Giữ 24 giờ',
        description: 'Kết quả được giữ 24 giờ. Mở lại trong thời gian đó không tốn thêm tiền.',
        cost: '0đ',
      },
    ],
    stats: ['units', 'cost', 'feedback'],
    feedbackFeature: 'rerank',
    defaultSettings: [
      { label: 'Model xếp hạng', value: 'gpt-oss-120b' },
      { label: 'Số mentor xếp lại', value: '20' },
      { label: 'Giữ kết quả', value: '24 giờ' },
    ],
  },
  forum_bot: {
    description:
      'Bot diễn đàn tự trả lời những câu hỏi chưa có ai trả lời, kèm gợi ý mentor phù hợp. Bot luôn chờ người thật trả lời trước và giới hạn số bài mỗi giờ.',
    pipelineTitle: 'Bot diễn đàn trả lời một bài như thế nào',
    steps: [
      {
        title: 'Chờ 15 phút',
        description: 'Chỉ xét bài chưa có ai bình luận sau 15 phút, để người thật trả lời trước.',
        cost: '0đ',
      },
      {
        title: 'Phân loại',
        description: 'Kiểm tra bài có phải câu hỏi cần trả lời hay không.',
        model: 'gemma-4-26B-A4B-it',
      },
      {
        title: 'Tra tài liệu',
        description: 'Tìm đoạn tài liệu liên quan trong kho tri thức.',
        model: 'Vietnamese_Embedding',
        cost: '~0đ',
      },
      {
        title: 'Tìm mentor',
        description: 'Gợi ý mentor phù hợp với nội dung câu hỏi.',
      },
      {
        title: 'Viết câu trả lời',
        description: 'Viết câu trả lời không quá 150 từ. Tối đa 6 bài mỗi giờ.',
        model: 'DeepSeek-V4-Flash',
      },
    ],
    stats: ['units', 'cost', 'feedback'],
    feedbackFeature: 'forum_answer',
    defaultSettings: [
      { label: 'Model viết câu trả lời', value: 'DeepSeek-V4-Flash' },
      { label: 'Model phân loại', value: 'gemma-4-26B-A4B-it' },
      { label: 'Chờ người thật trả lời', value: '15 phút' },
      { label: 'Tối đa', value: '6 bài/giờ' },
      { label: 'Trạng thái mặc định', value: 'Tắt (FORUM_BOT_ENABLED)' },
    ],
  },
  meeting_summary: {
    description:
      'Sau buổi mentoring, AI chép lời từng người nói rồi tóm tắt nội dung và các việc cần làm. Người dùng trả credit theo độ dài buổi học.',
    pipelineTitle: 'AI tóm tắt một buổi học như thế nào',
    steps: [
      {
        title: 'Chép lời từng người',
        description: 'Mỗi người có một bản ghi âm riêng nên biết chính xác ai nói câu nào.',
        model: 'FPT.AI-whisper-large-v3-turbo',
      },
      {
        title: 'Tóm tắt và giao việc',
        description: 'Tóm tắt nội dung chính và liệt kê việc cần làm cho từng người.',
        model: 'gpt-oss-120b',
      },
      {
        title: 'Trừ credit',
        description: 'Báo giá trước khi chạy, trừ credit của người dùng theo độ dài buổi học.',
      },
    ],
    stats: ['units', 'cost'],
    defaultSettings: [
      { label: 'Model chép lời', value: 'FPT.AI-whisper-large-v3-turbo' },
      { label: 'Model tóm tắt', value: 'gpt-oss-120b' },
      { label: 'Độ dài tóm tắt tối đa', value: '2000 token' },
      { label: 'Tối đa', value: '12 người, 240 phút' },
      { label: 'Trạng thái mặc định', value: 'Tạm hoãn (server chưa cài ffmpeg)' },
    ],
  },
  knowledge: {
    description:
      'Tài liệu trong kho tri thức được cắt thành đoạn và nhúng vector để KouKou và bot diễn đàn tìm lại khi trả lời.',
    pipelineTitle: 'Tài liệu được đưa vào kho như thế nào',
    steps: [
      {
        title: 'Đọc file',
        description: 'Hỗ trợ PDF, DOCX, MD, TXT tới 20MB. PDF scan ảnh cần OCR trước.',
      },
      {
        title: 'Cắt đoạn và nhúng',
        description: 'Cắt tài liệu thành đoạn nhỏ và tạo vector để tìm kiếm.',
        model: 'Vietnamese_Embedding',
      },
    ],
    stats: ['cost'],
    defaultSettings: [{ label: 'Model nhúng', value: 'Vietnamese_Embedding' }],
  },
};

/** URL key → group key. Accepts group keys plus the ledger aliases used elsewhere ("chat"). */
export function resolveAiFeatureKey(key: string): AiFeatureGroupKey | undefined {
  const direct = AI_FEATURE_GROUPS.find((group) => group.key === key);
  return (direct ?? getAiFeatureGroup(key))?.key;
}
