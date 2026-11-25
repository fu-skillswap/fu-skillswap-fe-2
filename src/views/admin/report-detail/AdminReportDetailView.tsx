/**
 * @file AdminReportDetailView.tsx
 * @description Chi tiết một báo cáo cộng đồng: nội dung bị báo cáo, thông tin báo cáo, quyết định xử lý,
 * hoạt động xử lý và mã vụ việc.
 */

'use client';

import { AdminTopbarActions } from '@/components/domain/admin/AdminTopbarActions';
import { showError, showSuccess } from '@/utils/toast';
import { ChevronLeft, ClipboardCopy, ExternalLink, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import styles from './AdminReportDetailView.module.css';
import { DecisionCard } from './components/DecisionCard';
import { useAdminReportDetail, type AdminReportDetailState } from './useAdminReportDetail';
import {
  ReasonPill,
  TargetStatusPill,
  TargetTypeChip,
  TonePill,
} from '../reports/components/ReportPills';
import {
  formatReportTime,
  getForumHref,
  getHeaderStatusUi,
  getTargetPreview,
  getTargetState,
  getTargetTitle,
  getWait,
  personName,
  shortenId,
  targetNoun,
} from '../reports/reportModeration.constants';

function Topbar({ locale }: { locale: string }) {
  return (
    <header className="admin-topbar">
      <div className="admin-breadcrumb">
        Quản trị <span>›</span>{' '}
        <Link href={`/${locale}/admin/reports`}>Báo cáo &amp; đánh giá</Link> <span>›</span>{' '}
        <b>Chi tiết</b>
      </div>
      <AdminTopbarActions />
    </header>
  );
}

function BackLink({ locale }: { locale: string }) {
  return (
    <Link className={styles.backLink} href={`/${locale}/admin/reports`}>
      <ChevronLeft aria-hidden="true" /> Quay lại danh sách báo cáo
    </Link>
  );
}

function LoadingState({ locale }: { locale: string }) {
  return (
    <main className="admin-report-detail-page">
      <Topbar locale={locale} />
      <div className={styles.content} aria-busy="true">
        <span className="sr-only" role="status">
          Đang tải chi tiết báo cáo…
        </span>
        <span className={`admin-skeleton ${styles.skeletonTitle}`} aria-hidden="true" />
        <div className={styles.layout} aria-hidden="true">
          <div className={styles.main}>
            {[180, 140, 200].map((height) => (
              <div
                key={height}
                className={`${styles.card} ${styles.skeletonCard}`}
                style={{ height }}
              >
                <span className="admin-skeleton" />
                <span className="admin-skeleton is-short" />
              </div>
            ))}
          </div>
          <div className={styles.side}>
            <div className={`${styles.card} ${styles.skeletonCard}`} style={{ height: 220 }}>
              <span className="admin-skeleton" />
              <span className="admin-skeleton is-short" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function ContentCard({ state, locale }: { state: AdminReportDetailState; locale: string }) {
  const report = state.report!;
  const title = getTargetTitle(report);
  const preview = getTargetPreview(report);
  const deleted = getTargetState(report.targetStatus) === 'deleted';
  const forumHref = getForumHref(locale, report);
  return (
    <section className={`${styles.card} ${styles.orderContent}`} aria-labelledby="report-content">
      <h2 id="report-content" className={styles.cardTitle}>
        Nội dung bị báo cáo
      </h2>
      <div className={styles.targetBox}>
        <div className={styles.chips}>
          <TargetTypeChip targetType={report.targetType} />
          <TargetStatusPill targetStatus={report.targetStatus} />
        </div>
        <h3 className={title.fallback ? styles.fallbackText : undefined}>{title.text}</h3>
        <p className={`${styles.preLine} ${preview.fallback ? styles.fallbackText : ''}`}>
          {preview.text}
        </p>
        <span className={styles.metaLine}>Tác giả: {personName(report.targetAuthorFullName)}</span>
      </div>
      {!deleted && forumHref && (
        <a
          className={`admin-button ${styles.forumLink}`}
          href={forumHref}
          target="_blank"
          rel="noopener"
        >
          <ExternalLink aria-hidden="true" /> Mở {targetNoun(report.targetType)} trên Forum
        </a>
      )}
    </section>
  );
}

function InfoCard({ state }: { state: AdminReportDetailState }) {
  const report = state.report!;
  return (
    <section className={`${styles.card} ${styles.orderInfo}`} aria-labelledby="report-info">
      <h2 id="report-info" className={styles.cardTitle}>
        Thông tin báo cáo
      </h2>
      <dl className={styles.fields}>
        <div>
          <dt>Lý do</dt>
          <dd>
            <ReasonPill reasonType={report.reasonType} />
          </dd>
        </div>
        <div>
          <dt>Người báo cáo</dt>
          <dd>{personName(report.reporterFullName)}</dd>
        </div>
        <div>
          <dt>Gửi lúc</dt>
          <dd>{formatReportTime(report.createdAt)}</dd>
        </div>
        <div className={styles.fieldWide}>
          <dt>Mô tả thêm</dt>
          <dd>
            {report.description?.trim() ? (
              <span className={styles.preLine}>{report.description}</span>
            ) : (
              <span className={styles.mutedText}>Người báo cáo không viết mô tả.</span>
            )}
          </dd>
        </div>
      </dl>
    </section>
  );
}

function ActivityCard({ state }: { state: AdminReportDetailState }) {
  const items = [...state.activity].sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  );
  return (
    <section className={`${styles.card} ${styles.orderActivity}`} aria-labelledby="report-activity">
      <h2 id="report-activity" className={styles.cardTitle}>
        Hoạt động xử lý
      </h2>
      {items.length ? (
        <ol className={styles.timeline}>
          {items.map((item, index) => (
            <li key={`${item.occurredAt}-${index}`}>
              <span className={styles.timelineDot} aria-hidden="true" />
              <div>
                <b>{item.title}</b>
                <span className={styles.metaLine}>
                  {item.actorDisplayName?.trim() || 'Hệ thống'}, {formatReportTime(item.occurredAt)}
                </span>
                {item.description?.trim() && (
                  <p className={styles.timelineNote}>{item.description}</p>
                )}
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className={styles.mutedText}>Chưa có hoạt động xử lý.</p>
      )}
    </section>
  );
}

function CaseIdCard({ reportId }: { reportId: string }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(reportId);
      showSuccess('Đã sao chép mã báo cáo.');
    } catch (reason) {
      showError(reason, { title: 'Không thể sao chép mã báo cáo' });
    }
  };
  return (
    <section className={`${styles.card} ${styles.orderCase}`} aria-labelledby="report-case">
      <h2 id="report-case" className={styles.cardTitle}>
        Mã vụ việc
      </h2>
      <div className={styles.caseId}>
        <code title={reportId}>{shortenId(reportId)}</code>
        <button
          type="button"
          className={styles.iconButton}
          aria-label="Sao chép mã báo cáo"
          onClick={() => void copy()}
        >
          <ClipboardCopy aria-hidden="true" />
        </button>
      </div>
      <p className={styles.metaLine}>Loại vụ việc: Báo cáo cộng đồng</p>
    </section>
  );
}

export function AdminReportDetailView({ locale, reportId }: { locale: string; reportId: string }) {
  const state = useAdminReportDetail(reportId);
  const { report } = state;

  if (state.loading && !report) return <LoadingState locale={locale} />;

  if (!report) {
    return (
      <main className="admin-report-detail-state">
        <div className={styles.errorState}>
          <p>
            {state.loadError?.notFound
              ? 'Không tìm thấy báo cáo.'
              : 'Không thể tải chi tiết báo cáo.'}
          </p>
          <div className={styles.errorActions}>
            <BackLink locale={locale} />
            <button
              type="button"
              className="admin-button is-primary"
              onClick={() => void state.reload()}
            >
              <RefreshCw aria-hidden="true" /> Thử lại
            </button>
          </div>
        </div>
      </main>
    );
  }

  const headerStatus = getHeaderStatusUi(report.status);
  const isOpen = report.status === 'OPEN';
  const wait = getWait(report.createdAt, isOpen ? undefined : report.resolvedAt);

  return (
    <main className="admin-report-detail-page">
      <Topbar locale={locale} />
      <div className={styles.content}>
        <BackLink locale={locale} />
        <header className={styles.header}>
          <div className={styles.titleRow}>
            <h1>Báo cáo {targetNoun(report.targetType)}</h1>
            <TonePill ui={headerStatus} />
          </div>
          <p className={styles.subline}>
            Gửi lúc {formatReportTime(report.createdAt)}, đã chờ {wait.text}
            {!isOpen && `, đóng lúc ${formatReportTime(report.resolvedAt)}`}
          </p>
        </header>
        <div className={styles.layout}>
          <div className={styles.main}>
            <ContentCard state={state} locale={locale} />
            <InfoCard state={state} />
            <ActivityCard state={state} />
          </div>
          <div className={styles.side}>
            <DecisionCard state={state} locale={locale} />
            <CaseIdCard reportId={report.reportId} />
          </div>
        </div>
      </div>
    </main>
  );
}
