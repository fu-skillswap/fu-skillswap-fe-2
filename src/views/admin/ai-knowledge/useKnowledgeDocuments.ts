/**
 * @file useKnowledgeDocuments.ts
 * @description Danh sách tài liệu kho tri thức (`GET /v1/documents`) kèm số đếm theo trạng thái,
 * lọc, phân trang và tự làm mới khi còn tài liệu đang được xử lý.
 */

'use client';

import type { AiDocument } from '@/models/ai';
import { aiRepo } from '@/repositories/aiRepo';
import { getUserFriendlyErrorMessage } from '@/utils/toast';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  PAGE_SIZE,
  POLL_INTERVAL_MS,
  isIndexing,
  type DocumentStatusFilter,
} from './aiKnowledge.constants';

export type DocumentCounts = Record<DocumentStatusFilter, number>;

type ListState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; items: AiDocument[]; total: number };

const COUNT_KEYS: DocumentStatusFilter[] = ['ALL', 'indexed', 'pending', 'processing', 'failed'];

export function useKnowledgeDocuments() {
  const [filter, setFilter] = useState<DocumentStatusFilter>('ALL');
  const [schoolCode, setSchoolCode] = useState('');
  const [topic, setTopic] = useState('');
  const [page, setPage] = useState(0);
  const [list, setList] = useState<ListState>({ status: 'loading' });
  const [counts, setCounts] = useState<DocumentCounts>();
  // Background refreshes (polling, after an action) keep the current rows on screen.
  const silentRef = useRef(false);

  const load = useCallback(async () => {
    if (!silentRef.current) setList({ status: 'loading' });
    silentRef.current = false;
    const scope = { schoolCode: schoolCode.trim() || undefined, topic: topic.trim() || undefined };
    const [listResult, countResult] = await Promise.allSettled([
      aiRepo.listDocuments({
        ...scope,
        status: filter === 'ALL' ? undefined : filter,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      }),
      Promise.all(
        COUNT_KEYS.map((key) =>
          aiRepo
            .listDocuments({ ...scope, status: key === 'ALL' ? undefined : key, limit: 1 })
            .then((result) => [key, result.total] as const),
        ),
      ),
    ]);
    if (listResult.status === 'fulfilled') {
      setList({ status: 'ready', items: listResult.value.items, total: listResult.value.total });
    } else {
      setList({
        status: 'error',
        message: getUserFriendlyErrorMessage(listResult.reason, 'Không tải được kho tri thức.'),
      });
    }
    if (countResult.status === 'fulfilled') {
      setCounts(Object.fromEntries(countResult.value) as DocumentCounts);
    }
  }, [filter, schoolCode, topic, page]);

  // Debounce typing in the scope filters; status/page changes load right away.
  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 300);
    return () => window.clearTimeout(timer);
  }, [load]);

  const refresh = useCallback(() => {
    silentRef.current = true;
    return load();
  }, [load]);

  const hasIndexing =
    list.status === 'ready' && list.items.some((document) => isIndexing(document.status));
  useEffect(() => {
    if (!hasIndexing) return;
    const timer = window.setInterval(() => void refresh(), POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [hasIndexing, refresh]);

  const changeFilter = (value: DocumentStatusFilter) => {
    setFilter(value);
    setPage(0);
  };
  const changeSchoolCode = (value: string) => {
    setSchoolCode(value);
    setPage(0);
  };
  const changeTopic = (value: string) => {
    setTopic(value);
    setPage(0);
  };
  const clearFilters = () => {
    setFilter('ALL');
    setSchoolCode('');
    setTopic('');
    setPage(0);
  };

  return {
    list,
    counts,
    filter,
    schoolCode,
    topic,
    page,
    totalPages: list.status === 'ready' ? Math.ceil(list.total / PAGE_SIZE) : 0,
    hasIndexing,
    changeFilter,
    changeSchoolCode,
    changeTopic,
    clearFilters,
    setPage,
    reload: load,
    refresh,
  };
}
