/**
 * @file aiPricing.ts
 * @description Bảng giá model AI (VND / 1 triệu token) để ước tính chi phí trên trang quản trị.
 *
 * Mirror of ai-skillswap/app/llm/pricing.py — update both.
 * USD prices from that file × `usd_to_vnd` = 26.300 (ai-skillswap/app/config.py), rounded.
 */

export const AI_USD_TO_VND = 26_300;

export interface AiModelPrice {
  /** VND per 1M input tokens. */
  inputVndPerMillion: number;
  /** VND per 1M output tokens; null for embedding models (no output tokens). */
  outputVndPerMillion: number | null;
}

export const AI_MODEL_PRICES: Record<string, AiModelPrice> = {
  'DeepSeek-V4-Flash': { inputVndPerMillion: 3_682, outputVndPerMillion: 7_364 },
  'gemma-4-26B-A4B-it': { inputVndPerMillion: 3_682, outputVndPerMillion: 10_520 },
  'gpt-oss-120b': { inputVndPerMillion: 3_761, outputVndPerMillion: 15_912 },
  Vietnamese_Embedding: { inputVndPerMillion: 289, outputVndPerMillion: null },
};

/**
 * Estimated VND cost of one call. Returns null for a model missing from this table (pricing.py
 * then charges its highest fallback price, which we don't guess here).
 */
export function estimateCostVnd(model: string, inputTokens: number, outputTokens: number) {
  const price = AI_MODEL_PRICES[model];
  if (!price) return null;
  return (
    (inputTokens / 1_000_000) * price.inputVndPerMillion +
    (outputTokens / 1_000_000) * (price.outputVndPerMillion ?? 0)
  );
}
