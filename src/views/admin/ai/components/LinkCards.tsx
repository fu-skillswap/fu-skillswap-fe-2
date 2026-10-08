/**
 * @file LinkCards.tsx
 * @description Hai thẻ dẫn nhanh: Kho tri thức và Nội dung AI gắn cờ.
 */

import { AI_FLAGGED_ENABLED } from '@/constants/featureFlags';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import styles from '../AiOverviewView.module.css';
import { formatCount } from '../aiOverview.constants';
import type { KnowledgeSummary, Section } from '../useAiOverview';

export function LinkCards({
  knowledge,
  knowledgeHref,
  flaggedHref,
}: {
  knowledge: Section<KnowledgeSummary>;
  knowledgeHref: string;
  flaggedHref: string;
}) {
  return (
    <div className={styles.linkCards}>
      <Link href={knowledgeHref} className={`${styles.card} ${styles.linkCard}`}>
        <span>
          <strong>Kho tri thức</strong>
          {knowledge.status === 'ready' ? (
            <p>
              {formatCount(knowledge.data.total)} tài liệu KouKou dùng để trả lời.
              {knowledge.data.failed > 0 && (
                <>
                  {' '}
                  <b className={styles.dangerText}>
                    {formatCount(knowledge.data.failed)} tài liệu lỗi
                  </b>{' '}
                  cần tải lại.
                </>
              )}
            </p>
          ) : knowledge.status === 'loading' ? (
            <p className={styles.muted}>Đang tải…</p>
          ) : (
            <p className={styles.muted}>Không tải được kho tri thức.</p>
          )}
        </span>
        <ChevronRight aria-hidden="true" />
      </Link>

      {AI_FLAGGED_ENABLED ? (
        <Link href={flaggedHref} className={`${styles.card} ${styles.linkCard}`}>
          <span>
            <strong>Nội dung AI gắn cờ</strong>
            {/* TODO(api): pending count from GET /api/admin/moderation/queue?decision=review */}
            <p>Nội dung đang chờ bạn quyết định giữ hay ẩn.</p>
          </span>
          <ChevronRight aria-hidden="true" />
        </Link>
      ) : (
        <div className={`${styles.card} ${styles.linkCard} ${styles.isDisabled}`}>
          <span>
            <strong>Nội dung AI gắn cờ</strong>
            <p className={styles.muted}>Chưa có dữ liệu. Cần API hàng đợi kiểm duyệt từ backend.</p>
          </span>
        </div>
      )}
    </div>
  );
}
