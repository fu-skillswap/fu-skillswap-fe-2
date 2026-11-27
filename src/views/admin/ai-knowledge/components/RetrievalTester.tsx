/**
 * @file RetrievalTester.tsx
 * @description "Thử tìm trong kho": gõ một câu hỏi như sinh viên và xem chatbot sẽ lấy những đoạn
 * nào để trả lời (`GET /v1/knowledge/search`, chỉ truy xuất, không sinh câu trả lời).
 */

'use client';

import type { AiKnowledgeSearchResult } from '@/models/ai';
import { aiRepo } from '@/repositories/aiRepo';
import { getUserFriendlyErrorMessage } from '@/utils/toast';
import { LoaderCircle, Search } from 'lucide-react';
import { useId, useState, type FormEvent } from 'react';
import styles from '../AiKnowledgeView.module.css';
import { QUERY_MAX, QUERY_MIN, SCHOOL_CODE_MAX, TOP_K_OPTIONS } from '../aiKnowledge.constants';

type SearchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: AiKnowledgeSearchResult };

const scoreFormatter = new Intl.NumberFormat('vi-VN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function RetrievalTester() {
  const id = useId();
  const [query, setQuery] = useState('');
  const [schoolCode, setSchoolCode] = useState('');
  const [topK, setTopK] = useState(5);
  const [state, setState] = useState<SearchState>({ status: 'idle' });
  const [formError, setFormError] = useState<string>();

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const q = query.trim();
    if (q.length < QUERY_MIN) return setFormError(`Nhập ít nhất ${QUERY_MIN} ký tự.`);
    setFormError(undefined);
    setState({ status: 'loading' });
    try {
      const data = await aiRepo.searchKnowledge({
        q,
        topK,
        schoolCode: schoolCode.trim() || undefined,
      });
      setState({ status: 'ready', data });
    } catch (reason) {
      setState({
        status: 'error',
        message: getUserFriendlyErrorMessage(reason, 'Không tìm được trong kho tri thức.'),
      });
    }
  };

  return (
    <section className={styles.card} aria-labelledby={`${id}-title`}>
      <header className={styles.cardHeader}>
        <div>
          <h2 id={`${id}-title`} className="admin-card-title">
            Thử tìm trong kho
          </h2>
          <p className={styles.cardSub}>
            Gõ một câu hỏi như sinh viên sẽ hỏi để xem chatbot lấy những đoạn nào làm căn cứ trả
            lời. Không tốn lượt chat của ai.
          </p>
        </div>
      </header>

      <form className={styles.searchForm} onSubmit={submit} noValidate>
        <label className={styles.searchQuery}>
          <span className="sr-only">Câu hỏi</span>
          <Search aria-hidden="true" />
          <input
            className={styles.input}
            value={query}
            maxLength={QUERY_MAX}
            placeholder="VD: Hủy lịch hẹn trước bao lâu thì được hoàn tiền?"
            aria-invalid={Boolean(formError)}
            aria-describedby={formError ? `${id}-error` : undefined}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <label className={styles.filterField}>
          <span>Mã trường</span>
          <input
            className={styles.input}
            value={schoolCode}
            maxLength={SCHOOL_CODE_MAX}
            placeholder="Mọi trường"
            onChange={(event) => setSchoolCode(event.target.value)}
          />
        </label>
        <label className={styles.filterField}>
          <span>Số đoạn</span>
          <select
            className={styles.input}
            value={topK}
            onChange={(event) => setTopK(Number(event.target.value))}
          >
            {TOP_K_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {value} đoạn
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="admin-button primary"
          disabled={state.status === 'loading'}
          aria-busy={state.status === 'loading'}
        >
          {state.status === 'loading' ? (
            <LoaderCircle className={styles.spin} aria-hidden="true" />
          ) : (
            <Search aria-hidden="true" />
          )}
          Tìm
        </button>
      </form>
      {formError && (
        <p id={`${id}-error`} className="mentor-form-error" role="alert">
          {formError}
        </p>
      )}

      <div aria-live="polite">
        {state.status === 'error' && (
          <p className={styles.notice} role="alert">
            {state.message}
          </p>
        )}
        {state.status === 'ready' &&
          (state.data.passages.length ? (
            <ol className={styles.passages}>
              {state.data.passages.map((passage, index) => (
                <li key={passage.chunkId}>
                  <div className={styles.passageHead}>
                    <span className={styles.rank}>#{index + 1}</span>
                    <div>
                      <strong>{passage.documentTitle}</strong>
                      {passage.heading && <small>{passage.heading}</small>}
                    </div>
                    <span
                      className={styles.score}
                      title="Điểm liên quan do AI chấm, càng cao càng sát câu hỏi"
                    >
                      Điểm {scoreFormatter.format(passage.score)}
                    </span>
                  </div>
                  <p>{passage.content}</p>
                </li>
              ))}
            </ol>
          ) : (
            <p className={styles.notice}>
              Không có đoạn nào khớp, nên chatbot không có tài liệu làm căn cứ cho câu hỏi này. Cân
              nhắc nạp thêm tài liệu về chủ đề này.
            </p>
          ))}
      </div>
    </section>
  );
}
