/**
 * @file AiStatusBadge.tsx
 * @description Nhãn trạng thái tính năng AI: Đang chạy / Đang tắt / Tạm hoãn / Chưa rõ.
 */

import { AI_FEATURE_STATUS_LABELS, type AiFeatureStatus } from '../aiFeatureStatus';
import styles from './AiStatusBadge.module.css';

export function AiStatusBadge({ status }: { status: AiFeatureStatus }) {
  return (
    <span className={`${styles.badge} ${styles[status]}`}>{AI_FEATURE_STATUS_LABELS[status]}</span>
  );
}
