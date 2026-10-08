/**
 * @file aiFeatureStatus.ts
 * @description Suy ra trạng thái hiển thị của một nhóm tính năng AI từ `GET /v1/ops/features`.
 */

import { getAiFeatureGroup, type AiFeatureGroupKey } from '@/constants/aiFeatures';
import type { AiFeatureConfig } from '@/models/ai';

export type AiFeatureStatus = 'running' | 'off' | 'paused' | 'unknown';

export const AI_FEATURE_STATUS_LABELS: Record<AiFeatureStatus, string> = {
  running: 'Đang chạy',
  off: 'Đang tắt',
  paused: 'Tạm hoãn',
  unknown: 'Chưa rõ',
};

export function findFeatureConfig(groupKey: AiFeatureGroupKey, configs: AiFeatureConfig[]) {
  return configs.find(
    (config) => config.key === groupKey || getAiFeatureGroup(config.key)?.key === groupKey,
  );
}

/** `unknown` until the features endpoint answers; paused = disabled with a reason. */
export function getFeatureStatus(config: AiFeatureConfig | undefined): AiFeatureStatus {
  if (!config) return 'unknown';
  if (config.enabled) return 'running';
  return config.pausedReason ? 'paused' : 'off';
}
