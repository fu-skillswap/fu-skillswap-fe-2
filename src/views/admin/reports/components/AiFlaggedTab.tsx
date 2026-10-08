/**
 * @file AiFlaggedTab.tsx
 * @description Bài viết / bình luận AI đánh dấu "review": vẫn đang hiển thị, chờ quản trị viên quyết định.
 * Chỉ hiển thị khi `AI_FLAGGED_ENABLED` bật (chưa có API).
 */

'use client';

import { AdminDialog } from '@/components/domain/admin/AdminDialog';
import {
  AdminPagination,
  adminListStyles as list,
} from '@/components/domain/admin/AdminListControls';
import { AdminTableState } from '@/components/domain/admin/AdminTableState';
import type {
  AiFlaggedItem,
  AiFlaggedQuery,
  AiFlaggedResponse,
  AiModerationCategory,
  AiModerationSeverity,
} from '@/models/admin';
import { getUserFriendlyErrorMessage, showError, showSuccess } from '@/utils/toast';
import { EyeOff, Info, Search } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import styles from '../AdminReportsView.module.css';
import {
  categoryLabels,
  categoryOptions,
  formatDateTime,
  getSeverity,
  severityOptions,
} from '../reports.constants';
import { ContentCell } from './ContentCell';

const pageSize = 10;
const columnCount = 5;

// TODO(api): GET /api/admin/moderation/queue?decision=review — move into adminRepo once it exists.
async function getAiFlaggedItems(query: AiFlaggedQuery): Promise<AiFlaggedResponse> {
  void query;
  throw new Error('Danh sách nội dung AI gắn cờ chưa có API.');
}

// TODO(api): endpoints to keep (dismiss the flag) or hide a flagged post/comment.
async function resolveAiFlaggedItem(itemId: string, action: 'keep' | 'hide'): Promise<void> {
  void itemId;
  void action;
  throw new Error('Thao tác xử lý nội dung AI gắn cờ chưa có API.');
}

export function AiFlaggedTab({ onCountChange }: { onCountChange?: (count: number) => void }) {
  const [items, setItems] = useState<AiFlaggedItem[]>([]);
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [keywordInput, setKeywordInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState<AiModerationCategory | ''>('');
  const [severity, setSeverity] = useState<AiModerationSeverity | ''>('');
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [pendingId, setPendingId] = useState<string>();
  const [hideTarget, setHideTarget] = useState<AiFlaggedItem>();
  const [hiding, setHiding] = useState(false);
  const [hideError, setHideError] = useState<string>();

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setKeyword(keywordInput.trim());
      setPage(0);
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [keywordInput]);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      const data = await getAiFlaggedItems({
        page,
        size: pageSize,
        keyword: keyword || undefined,
        category: category || undefined,
        severity: severity === '' ? undefined : severity,
      });
      setItems(data.content);
      setTotalElements(data.totalElements);
      setTotalPages(data.totalPages);
      if (!keyword && !category && severity === '') onCountChange?.(data.totalElements);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [category, keyword, page, severity, onCountChange]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const removeItem = (itemId: string) => {
    setItems((current) => current.filter((item) => item.id !== itemId));
    setTotalElements((current) => Math.max(0, current - 1));
  };

  const keep = async (item: AiFlaggedItem) => {
    setPendingId(item.id);
    try {
      await resolveAiFlaggedItem(item.id, 'keep');
      removeItem(item.id);
      showSuccess('Đã giữ lại nội dung');
    } catch (reason) {
      showError(reason, { title: 'Không thể giữ lại nội dung' });
    } finally {
      setPendingId(undefined);
    }
  };

  const confirmHide = async () => {
    if (!hideTarget) return;
    setHiding(true);
    setHideError(undefined);
    try {
      await resolveAiFlaggedItem(hideTarget.id, 'hide');
      removeItem(hideTarget.id);
      showSuccess('Đã ẩn nội dung');
      setHideTarget(undefined);
    } catch (reason) {
      setHideError(getUserFriendlyErrorMessage(reason, 'Không thể ẩn nội dung.'));
    } finally {
      setHiding(false);
    }
  };

  const clearFilters = () => {
    setKeywordInput('');
    setKeyword('');
    setCategory('');
    setSeverity('');
    setPage(0);
  };

  const isFiltered = Boolean(keyword || category || severity !== '');
  const first = items.length ? page * pageSize + 1 : 0;
  const last = page * pageSize + items.length;

  return (
    <>
      <div className={styles.infoBox} role="note">
        <Info aria-hidden="true" />
        <p>
          Nội dung ở đây vẫn đang hiển thị với mọi người. AI chỉ đánh dấu, quyết định ẩn hay giữ là
          của bạn. Nội dung AI chặn hẳn không đăng được nên không có trong danh sách.
        </p>
      </div>
      <div className={list.toolbar}>
        <label className="admin-search-field admin-toolbar-search">
          <Search aria-hidden="true" />
          <input
            type="search"
            value={keywordInput}
            onChange={(event) => setKeywordInput(event.target.value)}
            placeholder="Tìm theo nội dung hoặc người đăng"
            aria-label="Tìm nội dung gắn cờ"
          />
        </label>
        <label className={list.selectField}>
          <span>Nhóm</span>
          <select
            value={category}
            onChange={(event) => {
              setCategory(event.target.value as AiModerationCategory | '');
              setPage(0);
            }}
          >
            <option value="">Tất cả</option>
            {categoryOptions.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className={list.selectField}>
          <span>Mức độ</span>
          <select
            value={severity}
            onChange={(event) => {
              setSeverity(
                event.target.value === ''
                  ? ''
                  : (Number(event.target.value) as AiModerationSeverity),
              );
              setPage(0);
            }}
          >
            <option value="">Tất cả</option>
            {severityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className={list.tableScroll}>
        <table className={`${list.table} ${styles.aiTable}`}>
          <thead>
            <tr>
              <th>Nội dung</th>
              <th>Nhóm vi phạm</th>
              <th>Mức độ</th>
              <th>Lúc đăng</th>
              <th>
                <span className="sr-only">Thao tác</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <AdminTableState
                variant="loading"
                colSpan={columnCount}
                title="Đang tải nội dung gắn cờ…"
              />
            ) : failed ? (
              <AdminTableState
                variant="error"
                colSpan={columnCount}
                onRetry={() => void loadItems()}
              />
            ) : items.length ? (
              items.map((item) => {
                const level = getSeverity(item.maxSeverity);
                return (
                  <tr key={item.id}>
                    <td>
                      <ContentCell
                        targetType={item.targetType}
                        title={item.title}
                        parentPostTitle={item.parentPostTitle}
                        excerpt={item.excerpt}
                        authorName={item.authorFullName}
                      />
                    </td>
                    <td>
                      <div className={styles.tags}>
                        {item.categories.map((value) => (
                          <span key={value} className={styles.tag}>
                            {categoryLabels[value]}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span className={`${styles.severity} ${styles[level.tone]}`}>
                        {level.label}
                      </span>
                    </td>
                    <td className={list.date}>{formatDateTime(item.publishedAt)}</td>
                    <td className={list.actionCell}>
                      <div className={styles.rowActions}>
                        <button
                          type="button"
                          className="admin-button"
                          disabled={pendingId === item.id}
                          onClick={() => void keep(item)}
                        >
                          Giữ lại
                        </button>
                        <button
                          type="button"
                          className={`admin-button ${styles.hideButton}`}
                          disabled={pendingId === item.id}
                          onClick={() => {
                            setHideError(undefined);
                            setHideTarget(item);
                          }}
                        >
                          Ẩn nội dung
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : isFiltered ? (
              <AdminTableState
                variant="no-results"
                colSpan={columnCount}
                searchTerm={keyword}
                onClearFilters={clearFilters}
              />
            ) : (
              <AdminTableState
                variant="empty"
                colSpan={columnCount}
                title="Không có nội dung cần xem lại"
                description="Khi AI đánh dấu một bài viết hoặc bình luận cần xem lại, nội dung sẽ hiện ở đây."
              />
            )}
          </tbody>
        </table>
      </div>
      <footer className={list.footer}>
        <span>
          Hiển thị {first}–{last} trong {totalElements} nội dung
        </span>
        <AdminPagination
          page={page}
          totalPages={totalPages}
          disabled={loading}
          onChange={setPage}
        />
      </footer>
      {hideTarget && (
        <AdminDialog
          titleId="ai-hide-title"
          tone="danger"
          icon={<EyeOff aria-hidden="true" />}
          title="Ẩn nội dung này?"
          description={`${hideTarget.targetType === 'COMMENT' ? 'Bình luận' : 'Bài viết'} của ${
            hideTarget.authorFullName
          } sẽ không còn hiển thị với người dùng.`}
          busy={hiding}
          onClose={() => setHideTarget(undefined)}
          footer={
            <>
              <button
                type="button"
                className="admin-button"
                disabled={hiding}
                onClick={() => setHideTarget(undefined)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="admin-button is-danger-solid"
                disabled={hiding}
                onClick={() => void confirmHide()}
              >
                {hiding ? 'Đang ẩn...' : 'Ẩn nội dung'}
              </button>
            </>
          }
        >
          {hideError && (
            <p className="mentor-form-error" role="alert">
              {hideError}
            </p>
          )}
        </AdminDialog>
      )}
    </>
  );
}
