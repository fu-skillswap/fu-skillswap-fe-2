/**
 * @file useAdminReportDetail.ts
 * @description Dữ liệu và thao tác của trang chi tiết báo cáo cộng đồng: nhận / nhả xử lý, đóng báo
 * cáo, khôi phục nội dung và tìm báo cáo tiếp theo. Không cập nhật lạc quan: luôn tải lại sau khi
 * thao tác thành công.
 */

'use client';

import { ApiClientError } from '@/models/apiClient';
import type { AdminCaseActivity, AdminCaseOwnership, AdminForumReport } from '@/models/admin';
import { useAuth } from '@/providers/AuthProvider';
import { adminRepo } from '@/repositories/adminRepo';
import { showError, showInfo, showSuccess, showWarning } from '@/utils/toast';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FORUM_REPORT_CASE_TYPE,
  getResolveAction,
  getTargetType,
  personName,
  type ReportDecision,
} from '../reports/reportModeration.constants';

const ACTIVITY_QUERY = { page: 0, size: 20, sortBy: 'occurredAt', direction: 'DESC' } as const;

const RESOLVE_SUCCESS: Record<ReportDecision, string> = {
  HIDE: 'Đã ẩn nội dung và đóng báo cáo.',
  KEEP: 'Đã giữ nội dung và đóng báo cáo.',
  DISMISS: 'Đã bỏ qua báo cáo.',
};

function statusOf(reason: unknown) {
  return reason instanceof ApiClientError ? reason.status : undefined;
}

export type Busy = 'assign' | 'unassign' | 'resolve' | 'restore' | undefined;

export function useAdminReportDetail(reportId: string) {
  const { user } = useAuth();
  const currentUserId = user?.id;
  const isSystemAdmin = Boolean(user?.roles?.includes('SYSTEM_ADMIN'));

  const [report, setReport] = useState<AdminForumReport>();
  const [ownership, setOwnership] = useState<AdminCaseOwnership>();
  const [activity, setActivity] = useState<AdminCaseActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<{ notFound: boolean }>();
  const [busy, setBusy] = useState<Busy>();
  /** Set after this admin closes the report here, to offer "Báo cáo tiếp theo". */
  const [justResolved, setJustResolved] = useState(false);
  const [nextReportId, setNextReportId] = useState<string | null>();
  const busyRef = useRef(false);

  const loadReport = useCallback(async () => {
    const [reportResult, ownershipResult, activityResult] = await Promise.all([
      adminRepo.getForumReport(reportId),
      adminRepo.getCaseOwnership(FORUM_REPORT_CASE_TYPE, reportId),
      adminRepo.getCaseActivity(FORUM_REPORT_CASE_TYPE, reportId, ACTIVITY_QUERY),
    ]);
    setReport(reportResult);
    setOwnership(ownershipResult);
    setActivity(activityResult.content);
    return { report: reportResult, ownership: ownershipResult };
  }, [reportId]);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(undefined);
    try {
      await loadReport();
    } catch (reason) {
      setLoadError({ notFound: statusOf(reason) === 404 });
    } finally {
      setLoading(false);
    }
  }, [loadReport]);

  useEffect(() => {
    void load();
  }, [load]);

  /** Refetch quietly after an action; keeps the current data if the refetch fails. */
  const refetch = useCallback(async () => {
    try {
      return await loadReport();
    } catch {
      return undefined;
    }
  }, [loadReport]);

  /** Runs one action at a time so a double click never sends two requests. */
  const run = async (kind: Exclude<Busy, undefined>, action: () => Promise<void>) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(kind);
    try {
      await action();
    } finally {
      busyRef.current = false;
      setBusy(undefined);
    }
  };

  const assign = () =>
    run('assign', async () => {
      try {
        await adminRepo.assignCase(FORUM_REPORT_CASE_TYPE, reportId);
        await refetch();
      } catch (reason) {
        if (statusOf(reason) === 409) {
          const latest = await refetch();
          const holder = personName(latest?.ownership.assignedAdminDisplayName);
          showWarning(`${holder === 'Không rõ' ? 'Một admin khác' : holder} vừa nhận báo cáo này.`);
          return;
        }
        showError(reason, { title: 'Không thể nhận xử lý' });
      }
    });

  const unassign = (force = false) =>
    run('unassign', async () => {
      try {
        await adminRepo.unassignCase(FORUM_REPORT_CASE_TYPE, reportId);
        await refetch();
        showInfo(
          force
            ? 'Đã gỡ người xử lý. Admin khác có thể nhận báo cáo này.'
            : 'Đã nhả xử lý. Admin khác có thể nhận báo cáo này.',
        );
      } catch (reason) {
        await refetch();
        showError(reason, { title: force ? 'Không thể gỡ người xử lý' : 'Không thể nhả xử lý' });
      }
    });

  const resolve = (decision: ReportDecision, reviewNote: string) =>
    run('resolve', async () => {
      if (!report) return;
      try {
        const note = reviewNote.trim();
        await adminRepo.resolveForumReport(reportId, {
          action: getResolveAction(decision, report.targetType),
          ...(note ? { reviewNote: note } : {}),
        });
        await refetch();
        setJustResolved(true);
        showSuccess(RESOLVE_SUCCESS[decision]);
      } catch (reason) {
        const status = statusOf(reason);
        if (status === 409 || status === 400) {
          await refetch();
          showWarning('Báo cáo này đã được xử lý hoặc đang do admin khác giữ.');
          return;
        }
        showError(reason, { title: 'Không thể xử lý báo cáo' });
      }
    });

  const restore = () =>
    run('restore', async () => {
      if (!report) return;
      try {
        if (getTargetType(report.targetType) === 'COMMENT') {
          await adminRepo.restoreForumComment(report.targetId);
        } else {
          await adminRepo.restoreForumPost(report.targetId);
        }
        await refetch();
        showSuccess('Đã khôi phục nội dung.');
      } catch (reason) {
        showError(reason, { title: 'Không thể khôi phục nội dung' });
      }
    });

  // After closing a report, look for the next OPEN one that is free or already mine.
  useEffect(() => {
    if (!justResolved) return;
    let cancelled = false;
    setNextReportId(undefined);
    (async () => {
      try {
        const page = await adminRepo.getForumReports({ status: 'OPEN', page: 0, size: 20 });
        const candidates = page.content.filter((item) => item.reportId !== reportId);
        const owners = await Promise.all(
          candidates.map((item) =>
            adminRepo
              .getCaseOwnership(FORUM_REPORT_CASE_TYPE, item.reportId)
              .catch(() => undefined),
          ),
        );
        const index = owners.findIndex(
          (owner) => owner && (!owner.assigned || owner.assignedAdminUserId === currentUserId),
        );
        if (!cancelled) setNextReportId(index >= 0 ? candidates[index].reportId : null);
      } catch {
        if (!cancelled) setNextReportId(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentUserId, justResolved, reportId]);

  const isMine =
    Boolean(ownership?.assigned) &&
    Boolean(currentUserId) &&
    ownership?.assignedAdminUserId === currentUserId;

  return {
    report,
    ownership,
    activity,
    loading,
    loadError,
    busy,
    isMine,
    isSystemAdmin,
    currentUserId,
    justResolved,
    nextReportId,
    reload: load,
    assign,
    unassign,
    resolve,
    restore,
  };
}

export type AdminReportDetailState = ReturnType<typeof useAdminReportDetail>;
