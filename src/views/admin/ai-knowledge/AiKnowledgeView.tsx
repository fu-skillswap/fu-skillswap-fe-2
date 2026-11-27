/**
 * @file AiKnowledgeView.tsx
 * @description Trang "Kho tri thức & chi phí" (`/admin/ai-knowledge`): quản lý tài liệu AI dùng để
 * trả lời và xem chi phí AI. Tab hiện tại nằm trong `?tab=` để link thẳng được tới tab Chi phí.
 */

'use client';

import { AdminListTabs } from '@/components/domain/admin/AdminListControls';
import { AdminTopbarActions } from '@/components/domain/admin/AdminTopbarActions';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import styles from './AiKnowledgeView.module.css';
import { CostTab } from './components/CostTab';
import { KnowledgeTab } from './components/KnowledgeTab';

export type AiKnowledgeTab = 'knowledge' | 'cost';

export function AiKnowledgeView({ initialTab }: { initialTab: AiKnowledgeTab }) {
  const router = useRouter();
  const pathname = usePathname();
  const [tab, setTab] = useState<AiKnowledgeTab>(initialTab);

  const changeTab = (value: AiKnowledgeTab) => {
    setTab(value);
    router.replace(value === 'knowledge' ? pathname : `${pathname}?tab=${value}`, {
      scroll: false,
    });
  };

  return (
    <main className="admin-workspace">
      <header className="admin-topbar">
        <div className="admin-breadcrumb">
          Quản trị <span>›</span> Trợ lý AI <span>›</span> <b>Kho tri thức & chi phí</b>
        </div>
        <AdminTopbarActions />
      </header>
      <div className="admin-page-content">
        <section className="admin-page-heading">
          <div>
            <h1>Kho tri thức & chi phí</h1>
            <p>
              Tài liệu mà chatbot KouKou và bot diễn đàn dùng để trả lời, cùng số tiền AI đã tiêu.
            </p>
          </div>
        </section>

        <div className={styles.pageTabs}>
          <AdminListTabs
            ariaLabel="Chọn mục"
            value={tab}
            onChange={changeTab}
            tabs={[
              { value: 'knowledge', label: 'Kho tri thức' },
              { value: 'cost', label: 'Chi phí AI' },
            ]}
          />
        </div>

        {tab === 'knowledge' ? <KnowledgeTab /> : <CostTab />}
      </div>
    </main>
  );
}
