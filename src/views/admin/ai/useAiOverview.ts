/**
 * @file useAiOverview.ts
 * @description Tải số liệu cho trang Tổng quan AI. Mỗi khối có trạng thái riêng để một API lỗi
 * hoặc chưa có không làm hỏng cả trang.
 */

'use client';

import type { AiBudget, AiFeatureConfig, AiUsage } from '@/models/ai';
import { aiRepo } from '@/repositories/aiRepo';
import { getUserFriendlyErrorMessage } from '@/utils/toast';
import { useCallback, useEffect, useState } from 'react';

/**
 * `loading` → request in flight; `missing` → endpoint not deployed yet (404);
 * `error` → request failed; `ready` → data available.
 */
export type Section<T> =
  | { status: 'loading' }
  | { status: 'missing' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: T };

export interface KnowledgeSummary {
  total: number;
  failed: number;
}

export const loadingSection = { status: 'loading' } as const;

export function settle<T>(result: PromiseSettledResult<T | null>, fallback: string): Section<T> {
  if (result.status === 'rejected') {
    return { status: 'error', message: getUserFriendlyErrorMessage(result.reason, fallback) };
  }
  return result.value === null ? { status: 'missing' } : { status: 'ready', data: result.value };
}

export function useAiOverview() {
  const [budget, setBudget] = useState<Section<AiBudget>>(loadingSection);
  const [usage, setUsage] = useState<Section<AiUsage>>(loadingSection);
  const [features, setFeatures] = useState<Section<AiFeatureConfig[]>>(loadingSection);
  const [knowledge, setKnowledge] = useState<Section<KnowledgeSummary>>(loadingSection);

  const load = useCallback(async () => {
    setBudget(loadingSection);
    setUsage(loadingSection);
    setFeatures(loadingSection);
    setKnowledge(loadingSection);
    const [budgetResult, usageResult, featuresResult, knowledgeResult] = await Promise.allSettled([
      aiRepo.getBudget(),
      aiRepo.getUsage(1),
      aiRepo.getFeatures(),
      Promise.all([
        aiRepo.listDocuments({ limit: 1 }),
        aiRepo.listDocuments({ status: 'failed', limit: 1 }),
      ]).then(([all, failed]) => ({ total: all.total, failed: failed.total })),
    ]);
    setBudget(settle(budgetResult, 'Không tải được chi phí AI.'));
    setUsage(settle(usageResult, 'Không tải được số liệu sử dụng AI.'));
    setFeatures(settle(featuresResult, 'Không tải được trạng thái tính năng AI.'));
    setKnowledge(settle(knowledgeResult, 'Không tải được kho tri thức.'));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { budget, usage, features, knowledge, reload: load };
}
