/**
 * @file SettingsCard.tsx
 * @description "Cài đặt đang dùng": danh sách khóa – giá trị chỉ để xem.
 */

import type { AiSettingRow } from '@/constants/aiFeatures';
import type { AiFeatureConfig } from '@/models/ai';
import styles from '../../AiFeatureDetailView.module.css';
import { formatCount, formatVnd } from '../../aiOverview.constants';
import type { Section } from '../../useAiOverview';

/** Readable labels for `limits` keys (names match ai-skillswap app/config.py). */
const LIMIT_LABELS: Record<string, (value: number) => AiSettingRow> = {
  daily_budget_vnd: (v) => ({ label: 'Trần chi phí mỗi ngày', value: formatVnd(v) }),
  chat_rate_limit_per_hour: (v) => ({ label: 'Giới hạn mỗi sinh viên', value: `${v} câu/giờ` }),
  chat_max_history: (v) => ({ label: 'Số tin nhắn nhớ trong hội thoại', value: String(v) }),
  forum_max_replies_per_hour: (v) => ({ label: 'Tối đa', value: `${v} bài/giờ` }),
  forum_grace_minutes: (v) => ({ label: 'Chờ người thật trả lời', value: `${v} phút` }),
  recommend_top_n: (v) => ({ label: 'Số mentor xếp lại', value: String(v) }),
  recommend_cache_hours: (v) => ({ label: 'Giữ kết quả', value: `${v} giờ` }),
  rate_limit_rpm: (v) => ({ label: 'Giới hạn FPT mỗi model', value: `${v} lượt/phút` }),
  rate_limit_tpm: (v) => ({ label: 'Token mỗi phút', value: formatCount(v) }),
};

function toRows(config: AiFeatureConfig): AiSettingRow[] {
  const rows: AiSettingRow[] = [{ label: 'Model chính', value: config.modelMain }];
  if (config.modelClassify) rows.push({ label: 'Model phân loại', value: config.modelClassify });
  Object.entries(config.limits).forEach(([key, value]) => {
    rows.push(LIMIT_LABELS[key]?.(value) ?? { label: key, value: formatCount(value) });
  });
  return rows;
}

export function SettingsCard({
  config,
  features,
  defaults,
}: {
  config?: AiFeatureConfig;
  features: Section<AiFeatureConfig[]>;
  defaults: AiSettingRow[];
}) {
  const rows = config ? toRows(config) : defaults;

  return (
    <section className={styles.card} aria-labelledby="ai-settings-title">
      <h2 id="ai-settings-title" className="admin-card-title">
        Cài đặt đang dùng
      </h2>
      {!config && (
        <p className={styles.sourceNote}>
          {features.status === 'loading'
            ? 'Đang đọc cấu hình từ server AI…'
            : 'Giá trị mặc định trong mã nguồn. Chưa đọc được cấu hình thật trên server (cần API /v1/ops/features).'}
        </p>
      )}
      <dl className={styles.settings}>
        {rows.map((row) => (
          <div key={row.label}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
      <p className={styles.readOnlyNote}>
        Thay đổi trong file cấu hình trên server AI. Trang này chỉ để xem.
      </p>
    </section>
  );
}
