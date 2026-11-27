/**
 * @file page.tsx
 * @description Route "Kho tri thức & chi phí" (`/[locale]/admin/ai-knowledge`, `?tab=cost` mở tab
 * Chi phí). Admin-only through the shared admin layout (AdminGuard + AdminSidebar).
 */

import { AiKnowledgeView } from '@/views/admin/ai-knowledge/AiKnowledgeView';

export default async function AdminAiKnowledgePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string | string[] }>;
}) {
  const { tab } = await searchParams;
  return <AiKnowledgeView initialTab={tab === 'cost' ? 'cost' : 'knowledge'} />;
}
