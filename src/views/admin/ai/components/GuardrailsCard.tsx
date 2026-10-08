/**
 * @file GuardrailsCard.tsx
 * @description Thẻ "Rào chắn để không tốn tiền ngoài ý muốn": các giới hạn chi phí và tần suất.
 */

import type { AiBudget, AiFeatureConfig } from '@/models/ai';
import styles from '../AiOverviewView.module.css';
import { DEFAULT_LIMITS, formatCount, formatVnd, type LimitKey } from '../aiOverview.constants';
import type { Section } from '../useAiOverview';

/** First value found for `key` across every feature's `limits`, else the config default. */
function readLimit(configs: AiFeatureConfig[], key: LimitKey) {
  for (const config of configs) {
    const value = config.limits[key];
    if (typeof value === 'number') return value;
  }
  return DEFAULT_LIMITS[key];
}

export function GuardrailsCard({
  budget,
  features,
}: {
  budget: Section<AiBudget>;
  features: Section<AiFeatureConfig[]>;
}) {
  const configs = features.status === 'ready' ? features.data : [];
  const dailyBudget =
    budget.status === 'ready' ? budget.data.budgetVnd : readLimit(configs, 'daily_budget_vnd');
  const chatPerHour = readLimit(configs, 'chat_rate_limit_per_hour');
  const forumPerHour = readLimit(configs, 'forum_max_replies_per_hour');
  const forumGrace = readLimit(configs, 'forum_grace_minutes');
  const rpm = readLimit(configs, 'rate_limit_rpm');

  const rows: Array<[string, string]> = [
    [
      `${formatVnd(dailyBudget)}/ngày`,
      'Trần chi phí cho toàn hệ thống. Ngân sách AI cả dự án là 5 triệu đồng, trần này giữ tiền không cạn chỉ vì một lỗi lặp.',
    ],
    [
      `${formatCount(chatPerHour)} câu/giờ`,
      `Mỗi sinh viên hỏi KouKou tối đa ${chatPerHour} câu trong 1 giờ. Quá thì được báo thử lại sau.`,
    ],
    [
      `${formatCount(forumPerHour)} câu/giờ`,
      `Bot diễn đàn trả lời tối đa ${forumPerHour} bài mỗi giờ, và chỉ trả lời bài đã chờ ${forumGrace} phút mà chưa có ai bình luận.`,
    ],
    [
      `${formatCount(rpm)} lượt/phút`,
      'Giới hạn của nhà cung cấp FPT AI cho mỗi model. Mỗi tính năng dùng model khác nhau nên ít khi chạm.',
    ],
  ];

  return (
    <section className={styles.card} aria-labelledby="ai-guardrails-title">
      <h2 id="ai-guardrails-title" className="admin-card-title">
        Rào chắn để không tốn tiền ngoài ý muốn
      </h2>
      <dl className={styles.guardrails}>
        {rows.map(([value, explanation]) => (
          <div key={value + explanation.slice(0, 12)}>
            <dt>{value}</dt>
            <dd>{explanation}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
