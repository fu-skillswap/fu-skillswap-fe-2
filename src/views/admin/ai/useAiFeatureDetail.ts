/**
 * @file useAiFeatureDetail.ts
 * @description Tải số liệu cho trang chi tiết một tính năng AI.
 */

'use client';

import type { AiFeatureDetail } from '@/constants/aiFeatures';
import type { AiBudget, AiFeatureConfig, AiFeedbackList, AiUsage } from '@/models/ai';
import { aiRepo } from '@/repositories/aiRepo';
import { useCallback, useEffect, useState } from 'react';
import { loadingSection, settle, type Section } from './useAiOverview';

export interface FeedbackSummary {
  total: number;
  unhelpful: number;
}

const RECENT_FEEDBACK_LIMIT = 10;

export function useAiFeatureDetail(detail: AiFeatureDetail) {
  const feedbackFeature = detail.feedbackFeature;
  const [budget, setBudget] = useState<Section<AiBudget>>(loadingSection);
  const [usage, setUsage] = useState<Section<AiUsage>>(loadingSection);
  const [features, setFeatures] = useState<Section<AiFeatureConfig[]>>(loadingSection);
  const [feedbackSummary, setFeedbackSummary] = useState<Section<FeedbackSummary>>(loadingSection);
  const [recentFeedback, setRecentFeedback] = useState<Section<AiFeedbackList>>(loadingSection);
  const [onlyUnhelpful, setOnlyUnhelpful] = useState(false);

  const loadStats = useCallback(async () => {
    setBudget(loadingSection);
    setUsage(loadingSection);
    setFeatures(loadingSection);
    setFeedbackSummary(loadingSection);
    const [budgetResult, usageResult, featuresResult, summaryResult] = await Promise.allSettled([
      aiRepo.getBudget(),
      aiRepo.getUsage(1),
      aiRepo.getFeatures(),
      feedbackFeature
        ? Promise.all([
            aiRepo.getFeedback(feedbackFeature, undefined, { limit: 1 }),
            aiRepo.getFeedback(feedbackFeature, -1, { limit: 1 }),
          ]).then(([all, unhelpful]) =>
            all && unhelpful ? { total: all.total, unhelpful: unhelpful.total } : null,
          )
        : Promise.resolve(null),
    ]);
    setBudget(settle(budgetResult, 'Không tải được chi phí AI.'));
    setUsage(settle(usageResult, 'Không tải được số liệu sử dụng AI.'));
    setFeatures(settle(featuresResult, 'Không tải được cấu hình tính năng AI.'));
    setFeedbackSummary(settle(summaryResult, 'Không tải được đánh giá.'));
  }, [feedbackFeature]);

  const loadRecentFeedback = useCallback(async () => {
    if (!feedbackFeature) return;
    setRecentFeedback(loadingSection);
    const [result] = await Promise.allSettled([
      aiRepo.getFeedback(feedbackFeature, onlyUnhelpful ? -1 : undefined, {
        limit: RECENT_FEEDBACK_LIMIT,
      }),
    ]);
    setRecentFeedback(settle(result, 'Không tải được đánh giá gần đây.'));
  }, [feedbackFeature, onlyUnhelpful]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  useEffect(() => {
    void loadRecentFeedback();
  }, [loadRecentFeedback]);

  return {
    budget,
    usage,
    features,
    feedbackSummary,
    recentFeedback,
    onlyUnhelpful,
    setOnlyUnhelpful,
    reload: () => Promise.all([loadStats(), loadRecentFeedback()]),
    reloadRecentFeedback: loadRecentFeedback,
  };
}
