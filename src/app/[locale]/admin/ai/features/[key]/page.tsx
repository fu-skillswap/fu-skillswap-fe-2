/** @file page.tsx @description Route chi tiết một tính năng AI cho quản trị viên. */

import { resolveAiFeatureKey } from '@/constants/aiFeatures';
import { AiFeatureDetailView } from '@/views/admin/ai/AiFeatureDetailView';
import { notFound } from 'next/navigation';

export default async function AdminAiFeaturePage({
  params,
}: {
  params: Promise<{ locale: string; key: string }>;
}) {
  const { key } = await params;
  const featureKey = resolveAiFeatureKey(key);
  if (!featureKey || featureKey === 'knowledge') notFound();
  return <AiFeatureDetailView featureKey={featureKey} />;
}
