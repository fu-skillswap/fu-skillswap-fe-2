/**
 * @file AdminReportsView.tsx
 * @description Báo cáo do người dùng gửi và nội dung AI gắn cờ, dành cho quản trị viên.
 */

'use client';

import {
  AdminListTabs,
  adminListStyles as list,
} from '@/components/domain/admin/AdminListControls';
import { AdminTopbarActions } from '@/components/domain/admin/AdminTopbarActions';
import { AI_FLAGGED_ENABLED } from '@/constants/featureFlags';
import { adminRepo } from '@/repositories/adminRepo';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { AiFlaggedTab } from './components/AiFlaggedTab';
import { UserReportsTab } from './components/UserReportsTab';
import type { ReportsTab } from './reports.constants';

function getTabFromUrl(searchParams: URLSearchParams): ReportsTab {
  if (AI_FLAGGED_ENABLED && searchParams.get('source') === 'ai') return 'ai';
  if (searchParams.get('tab') === 'resolved') return 'resolved';
  return 'reports';
}

export function AdminReportsView() {
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = getTabFromUrl(searchParams);
  const [openCount, setOpenCount] = useState<number>();
  const [aiCount, setAiCount] = useState<number>();

  const loadOpenCount = useCallback(async () => {
    try {
      const data = await adminRepo.getForumReports({ status: 'OPEN', page: 0, size: 1 });
      setOpenCount(data.totalElements);
    } catch {
      // The tab count is optional; the list shows its own error state.
    }
  }, []);

  useEffect(() => {
    void loadOpenCount();
  }, [loadOpenCount]);

  // The URL is the source of truth so the sidebar link (`?source=ai`) and back button work.
  const selectTab = (tab: ReportsTab) => {
    const query = tab === 'ai' ? '?source=ai' : tab === 'resolved' ? '?tab=resolved' : '';
    router.replace(`${pathname}${query}`, { scroll: false });
  };

  const tabs: Array<{ value: ReportsTab; label: string; count?: number }> = [
    { value: 'reports', label: 'Người dùng báo cáo', count: openCount },
    ...(AI_FLAGGED_ENABLED ? [{ value: 'ai' as const, label: 'AI gắn cờ', count: aiCount }] : []),
    { value: 'resolved', label: 'Đã xử lý' },
  ];

  return (
    <main className="admin-reports-page">
      <header className="admin-topbar">
        <div className="admin-breadcrumb">
          Quản trị <span>›</span> <b>Báo cáo &amp; đánh giá</b>
        </div>
        <AdminTopbarActions />
      </header>
      <div className="admin-reports-content">
        <section className="admin-page-heading">
          <div>
            <h1>Báo cáo &amp; nội dung gắn cờ</h1>
            <p>Báo cáo do người dùng gửi và bài viết, bình luận AI đánh dấu cần xem lại.</p>
          </div>
        </section>
        <section className={list.card} aria-label="Báo cáo và nội dung gắn cờ">
          <AdminListTabs
            ariaLabel="Nguồn báo cáo"
            tabs={tabs}
            value={activeTab}
            onChange={selectTab}
          />
          {activeTab === 'ai' ? (
            <AiFlaggedTab onCountChange={setAiCount} />
          ) : (
            <UserReportsTab
              key={activeTab}
              mode={activeTab === 'resolved' ? 'resolved' : 'open'}
              locale={locale}
              onShowResolved={() => selectTab('resolved')}
              onLoaded={activeTab === 'reports' ? loadOpenCount : undefined}
            />
          )}
        </section>
      </div>
    </main>
  );
}
