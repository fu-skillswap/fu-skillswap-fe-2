/**
 * @file KnowledgeTab.tsx
 * @description Tab "Kho tri thức": số tài liệu theo trạng thái, bảng tài liệu (tải lên, dán văn
 * bản, tải tệp gốc, nạp lại, xóa) và công cụ thử truy xuất.
 *
 * APIs (ai-skillswap): `GET/POST /v1/documents`, `POST /v1/documents/text`,
 * `GET /v1/documents/{id}/download`, `POST /v1/documents/{id}/reindex`, `DELETE /v1/documents/{id}`.
 */

'use client';

import {
  AdminListTabs,
  AdminPagination,
  adminListStyles as list,
} from '@/components/domain/admin/AdminListControls';
import { AdminTableState } from '@/components/domain/admin/AdminTableState';
import type { AiDocument } from '@/models/ai';
import { aiRepo } from '@/repositories/aiRepo';
import { showError, showSuccess } from '@/utils/toast';
import {
  CircleCheck,
  CircleAlert,
  ClipboardPaste,
  Download,
  FileText,
  LoaderCircle,
  RotateCw,
  Trash2,
  Upload,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';
import styles from '../AiKnowledgeView.module.css';
import {
  PAGE_SIZE,
  formatBytes,
  formatDateTime,
  getDocumentStatus,
  isIndexing,
} from '../aiKnowledge.constants';
import { useKnowledgeDocuments } from '../useKnowledgeDocuments';
import { DeleteDocumentDialog, TextDocumentDialog, UploadDocumentDialog } from './DocumentDialogs';
import { RetrievalTester } from './RetrievalTester';

const COLUMN_COUNT = 6;

type DialogState =
  { kind: 'upload' } | { kind: 'text' } | { kind: 'delete'; document: AiDocument } | undefined;

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  label: string;
  value?: number;
  hint: string;
  icon: LucideIcon;
  tone: 'blue' | 'green' | 'amber' | 'red';
}) {
  return (
    <article className={`${styles.stat} ${styles[`tone-${tone}`]}`}>
      <i>
        <Icon aria-hidden="true" />
      </i>
      <div>
        <span>{label}</span>
        <strong>{value === undefined ? '…' : value.toLocaleString('vi-VN')}</strong>
        <small>{hint}</small>
      </div>
    </article>
  );
}

export function KnowledgeTab() {
  const docs = useKnowledgeDocuments();
  const [dialog, setDialog] = useState<DialogState>();
  const [busyId, setBusyId] = useState<string>();
  const counts = docs.counts;
  const indexingCount = counts ? counts.pending + counts.processing : undefined;
  const hasScope = Boolean(docs.schoolCode.trim() || docs.topic.trim());

  const afterCreate = (document: AiDocument) => {
    setDialog(undefined);
    showSuccess({
      title: 'Đã nhận tài liệu',
      description: `“${document.title}” đang được xử lý, bảng sẽ tự cập nhật khi xong.`,
    });
    docs.changeFilter('ALL');
    void docs.refresh();
  };

  const download = async (document: AiDocument) => {
    setBusyId(document.id);
    try {
      const url = await aiRepo.getDocumentDownloadUrl(document.id);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (reason) {
      showError(reason, { title: 'Không tải được tệp gốc' });
    } finally {
      setBusyId(undefined);
    }
  };

  const reindex = async (document: AiDocument) => {
    setBusyId(document.id);
    try {
      await aiRepo.reindexDocument(document.id);
      showSuccess({
        title: 'Đang nạp lại tài liệu',
        description: `“${document.title}” sẽ được cắt đoạn lại từ tệp gốc.`,
      });
      await docs.refresh();
    } catch (reason) {
      showError(reason, { title: 'Không nạp lại được tài liệu' });
    } finally {
      setBusyId(undefined);
    }
  };

  const renderRows = () => {
    if (docs.list.status === 'loading') {
      return (
        <AdminTableState
          variant="loading"
          colSpan={COLUMN_COUNT}
          skeletonRows={5}
          title="Đang tải tài liệu…"
        />
      );
    }
    if (docs.list.status === 'error') {
      return (
        <AdminTableState
          variant="error"
          colSpan={COLUMN_COUNT}
          title="Không tải được kho tri thức"
          description={docs.list.message}
          onRetry={() => void docs.reload()}
        />
      );
    }
    if (!docs.list.items.length) {
      return docs.filter !== 'ALL' || hasScope ? (
        <AdminTableState
          variant="no-results"
          colSpan={COLUMN_COUNT}
          onClearFilters={docs.clearFilters}
        />
      ) : (
        <AdminTableState
          variant="empty"
          colSpan={COLUMN_COUNT}
          title="Kho tri thức đang trống"
          description="Tải quy chế, FAQ hoặc hướng dẫn lên để chatbot KouKou trả lời đúng hơn."
          action={
            <button
              type="button"
              className="admin-button primary"
              onClick={() => setDialog({ kind: 'upload' })}
            >
              <Upload aria-hidden="true" /> Tải tài liệu đầu tiên
            </button>
          }
        />
      );
    }
    return docs.list.items.map((document) => {
      const status = getDocumentStatus(document.status);
      const busy = busyId === document.id;
      const isUpload = document.sourceType === 'upload';
      return (
        <tr key={document.id}>
          <td>
            <div className={styles.docCell}>
              <i aria-hidden="true">{isUpload ? <FileText /> : <ClipboardPaste />}</i>
              <div>
                <strong title={document.title}>{document.title}</strong>
                <small>
                  {isUpload
                    ? [document.filename, formatBytes(document.sizeBytes)]
                        .filter(Boolean)
                        .join(' · ')
                    : 'Văn bản dán trực tiếp'}
                </small>
              </div>
            </div>
          </td>
          <td>
            <span className={styles.scope}>{document.schoolCode ?? 'Mọi trường'}</span>
            {document.topic && <small className={styles.cellSub}>{document.topic}</small>}
          </td>
          <td className={styles.numeric}>
            {document.status === 'indexed' ? document.chunkCount.toLocaleString('vi-VN') : '—'}
          </td>
          <td>
            <span
              className={`${styles.badge} ${styles[`badge-${status.tone}`]}`}
              title={status.hint}
            >
              {isIndexing(document.status) && (
                <LoaderCircle className={styles.spin} aria-hidden="true" />
              )}
              {status.label}
            </span>
            {document.status === 'failed' && document.error && (
              <small className={styles.errorLine}>{document.error}</small>
            )}
          </td>
          <td>
            <span className={styles.cellMain}>{formatDateTime(document.createdAt)}</span>
            {document.indexedAt && (
              <small className={styles.cellSub}>
                Sẵn sàng {formatDateTime(document.indexedAt)}
              </small>
            )}
          </td>
          <td>
            <div className={styles.rowActions}>
              {isUpload && (
                <button
                  type="button"
                  className={styles.iconButton}
                  title="Tải tệp gốc"
                  aria-label={`Tải tệp gốc ${document.title}`}
                  disabled={busy}
                  onClick={() => void download(document)}
                >
                  <Download aria-hidden="true" />
                </button>
              )}
              {isUpload && (
                <button
                  type="button"
                  className={styles.iconButton}
                  title="Nạp lại từ tệp gốc"
                  aria-label={`Nạp lại ${document.title}`}
                  disabled={busy || isIndexing(document.status)}
                  onClick={() => void reindex(document)}
                >
                  <RotateCw aria-hidden="true" />
                </button>
              )}
              <button
                type="button"
                className={`${styles.iconButton} ${styles.iconDanger}`}
                title="Xóa tài liệu"
                aria-label={`Xóa ${document.title}`}
                disabled={busy}
                onClick={() => setDialog({ kind: 'delete', document })}
              >
                <Trash2 aria-hidden="true" />
              </button>
            </div>
          </td>
        </tr>
      );
    });
  };

  const total = docs.list.status === 'ready' ? docs.list.total : 0;

  return (
    <div className={styles.stack}>
      <section className={styles.statGrid} aria-label="Tình trạng kho tri thức">
        <StatCard
          label="Tổng tài liệu"
          value={counts?.ALL}
          hint={hasScope ? 'Theo mã trường / chủ đề đang lọc' : 'Đang có trong kho'}
          icon={FileText}
          tone="blue"
        />
        <StatCard
          label="Sẵn sàng"
          value={counts?.indexed}
          hint="AI đã dùng được để trả lời"
          icon={CircleCheck}
          tone="green"
        />
        <StatCard
          label="Đang xử lý"
          value={indexingCount}
          hint="Tự cập nhật khi xong"
          icon={LoaderCircle}
          tone="amber"
        />
        <StatCard
          label="Lỗi"
          value={counts?.failed}
          hint="Cần xem lý do và nạp lại"
          icon={CircleAlert}
          tone="red"
        />
      </section>

      <section className={list.card} aria-labelledby="knowledge-docs-title">
        <header className={styles.listHeader}>
          <div>
            <h2 id="knowledge-docs-title" className="admin-card-title">
              Tài liệu trong kho
            </h2>
            <p className={styles.cardSub}>
              Chatbot KouKou và bot diễn đàn chỉ trả lời dựa trên các tài liệu “Sẵn sàng”.
            </p>
          </div>
          <div className={styles.headerActions}>
            <button
              type="button"
              className="admin-button"
              onClick={() => setDialog({ kind: 'text' })}
            >
              <ClipboardPaste aria-hidden="true" /> Dán văn bản
            </button>
            <button
              type="button"
              className="admin-button primary"
              onClick={() => setDialog({ kind: 'upload' })}
            >
              <Upload aria-hidden="true" /> Tải tài liệu lên
            </button>
          </div>
        </header>

        <AdminListTabs
          ariaLabel="Lọc theo trạng thái"
          value={docs.filter}
          onChange={docs.changeFilter}
          tabs={[
            { value: 'ALL', label: 'Tất cả', count: counts?.ALL },
            { value: 'indexed', label: 'Sẵn sàng', count: counts?.indexed },
            { value: 'pending', label: 'Đang chờ', count: counts?.pending },
            { value: 'processing', label: 'Đang xử lý', count: counts?.processing },
            { value: 'failed', label: 'Lỗi', count: counts?.failed },
          ]}
        />

        <div className={list.toolbar}>
          <label className={styles.filterField}>
            <span>Mã trường</span>
            <input
              className={styles.input}
              value={docs.schoolCode}
              placeholder="Tất cả"
              onChange={(event) => docs.changeSchoolCode(event.target.value)}
            />
          </label>
          <label className={styles.filterField}>
            <span>Chủ đề</span>
            <input
              className={styles.input}
              value={docs.topic}
              placeholder="Tất cả"
              onChange={(event) => docs.changeTopic(event.target.value)}
            />
          </label>
          {docs.hasIndexing && (
            <p className={styles.pollNote} role="status">
              <LoaderCircle className={styles.spin} aria-hidden="true" /> Đang tự cập nhật trạng
              thái…
            </p>
          )}
        </div>

        <div className={list.tableScroll}>
          <table className={`${list.table} ${styles.docTable}`}>
            <thead>
              <tr>
                <th>Tài liệu</th>
                <th>Phạm vi</th>
                <th className={styles.numeric}>Số đoạn</th>
                <th>Trạng thái</th>
                <th>Ngày nạp</th>
                <th>
                  <span className="sr-only">Thao tác</span>
                </th>
              </tr>
            </thead>
            <tbody>{renderRows()}</tbody>
          </table>
        </div>

        {docs.totalPages > 1 && (
          <div className={list.footer}>
            <span>
              Hiển thị {docs.page * PAGE_SIZE + 1}–{Math.min((docs.page + 1) * PAGE_SIZE, total)}{' '}
              trên {total.toLocaleString('vi-VN')} tài liệu
            </span>
            <AdminPagination
              page={docs.page}
              totalPages={docs.totalPages}
              onChange={docs.setPage}
            />
          </div>
        )}
      </section>

      <RetrievalTester />

      {dialog?.kind === 'upload' && (
        <UploadDocumentDialog onClose={() => setDialog(undefined)} onCreated={afterCreate} />
      )}
      {dialog?.kind === 'text' && (
        <TextDocumentDialog onClose={() => setDialog(undefined)} onCreated={afterCreate} />
      )}
      {dialog?.kind === 'delete' && (
        <DeleteDocumentDialog
          document={dialog.document}
          onClose={() => setDialog(undefined)}
          onDeleted={() => {
            showSuccess(`Đã xóa “${dialog.document.title}”.`);
            setDialog(undefined);
            void docs.refresh();
          }}
        />
      )}
    </div>
  );
}
