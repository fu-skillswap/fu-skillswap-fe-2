/**
 * @file CostTab.tsx
 * @description Tab "Chi phí AI": chi tiêu hôm nay theo từng tính năng và từng bước
 * (`GET /v1/ops/budget`), lịch sử 7 ngày (`GET /v1/ops/usage`, khi dịch vụ AI có) và cách tính tiền.
 */

'use client';

import { AI_FEATURE_GROUPS, getAiFeatureGroup } from '@/constants/aiFeatures';
import type { AiBudget, AiUsage } from '@/models/ai';
import { aiRepo } from '@/repositories/aiRepo';
import { RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import styles from '../AiKnowledgeView.module.css';
import {
  DEFAULT_DAILY_BUDGET_VND,
  LEDGER_STEP_LABELS,
  MODEL_PRICES,
  USD_TO_VND,
} from '../aiKnowledge.constants';
import { GROUP_COLORS, OTHER_COLOR, formatUnitVnd, formatVnd } from '../../ai/aiOverview.constants';
import { SpendCard } from '../../ai/components/SpendCard';
import { loadingSection, settle, type Section } from '../../ai/useAiOverview';

type StepRow = { key: string; label: string; vnd: number };
type GroupRow = { key: string; label: string; color: string; vnd: number; steps: StepRow[] };

function buildRows(byFeature: Record<string, number>): GroupRow[] {
  const rows = new Map<string, GroupRow>();
  Object.entries(byFeature).forEach(([ledgerKey, vnd]) => {
    const group = getAiFeatureGroup(ledgerKey);
    const key = group?.key ?? 'other';
    const row = rows.get(key) ?? {
      key,
      label: group?.label ?? 'Khác',
      color: group ? GROUP_COLORS[group.key] : OTHER_COLOR,
      vnd: 0,
      steps: [],
    };
    row.vnd += vnd;
    row.steps.push({ key: ledgerKey, label: LEDGER_STEP_LABELS[ledgerKey] ?? ledgerKey, vnd });
    rows.set(key, row);
  });
  const order = [...AI_FEATURE_GROUPS.map((group) => group.key as string), 'other'];
  return [...rows.values()]
    .map((row) => ({ ...row, steps: row.steps.sort((a, b) => b.vnd - a.vnd) }))
    .sort((a, b) => b.vnd - a.vnd || order.indexOf(a.key) - order.indexOf(b.key));
}

const dayFormatter = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' });

function formatDay(isoDay: string) {
  const [year, month, day] = isoDay.split('-').map(Number);
  if (!year || !month || !day) return isoDay;
  return dayFormatter.format(new Date(year, month - 1, day));
}

function BreakdownCard({ budget, onRetry }: { budget: Section<AiBudget>; onRetry: () => void }) {
  if (budget.status !== 'ready') {
    return (
      <section className={styles.card} aria-labelledby="cost-breakdown-title">
        <h2 id="cost-breakdown-title" className="admin-card-title">
          Hôm nay tiền đi đâu
        </h2>
        {budget.status === 'error' ? (
          <div className={styles.inlineError} role="alert">
            <p>Không tải được chi phí. {budget.message}</p>
            <button type="button" className="admin-button" onClick={onRetry}>
              <RefreshCw aria-hidden="true" /> Thử lại
            </button>
          </div>
        ) : (
          <p className={styles.cardSub}>Đang tải…</p>
        )}
      </section>
    );
  }

  const rows = buildRows(budget.data.byFeature);
  const total = budget.data.spentVnd;
  const share = (vnd: number) =>
    total > 0
      ? `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format((vnd / total) * 100)}%`
      : '—';

  return (
    <section className={styles.card} aria-labelledby="cost-breakdown-title">
      <header className={styles.cardHeader}>
        <div>
          <h2 id="cost-breakdown-title" className="admin-card-title">
            Hôm nay tiền đi đâu
          </h2>
          <p className={styles.cardSub}>
            Mỗi tính năng gồm nhiều bước gọi AI. Số liệu tính từ 0:00 ngày{' '}
            {formatDay(budget.data.day)}.
          </p>
        </div>
      </header>
      {rows.length ? (
        <div className="admin-table-wrap">
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Tính năng / bước</th>
                <th className={styles.numeric}>Chi phí</th>
                <th className={styles.numeric}>Tỷ trọng</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <FragmentRows key={row.key} row={row} share={share} />
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row">Tổng hôm nay</th>
                <td className={styles.numeric}>
                  <b>{formatUnitVnd(total)}</b>
                </td>
                <td className={styles.numeric}>100%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <p className={styles.notice}>Hôm nay AI chưa được dùng nên chưa tốn đồng nào.</p>
      )}
    </section>
  );
}

function FragmentRows({ row, share }: { row: GroupRow; share: (vnd: number) => string }) {
  return (
    <>
      <tr className={styles.groupRow}>
        <th scope="row">
          <span className={styles.swatch} style={{ background: row.color }} aria-hidden="true" />
          {row.label}
        </th>
        <td className={styles.numeric}>
          <b>{formatUnitVnd(row.vnd)}</b>
        </td>
        <td className={styles.numeric}>{share(row.vnd)}</td>
      </tr>
      {row.steps.map((step) => (
        <tr key={step.key} className={styles.stepRow}>
          <td>
            {step.label}
            <code>{step.key}</code>
          </td>
          <td className={styles.numeric}>{formatUnitVnd(step.vnd)}</td>
          <td className={styles.numeric}>{share(step.vnd)}</td>
        </tr>
      ))}
    </>
  );
}

function HistoryCard({ usage, budgetVnd }: { usage: Section<AiUsage>; budgetVnd: number }) {
  return (
    <section className={styles.card} aria-labelledby="cost-history-title">
      <h2 id="cost-history-title" className="admin-card-title">
        7 ngày gần nhất
      </h2>
      {usage.status === 'loading' ? (
        <p className={styles.cardSub}>Đang tải…</p>
      ) : usage.status === 'missing' ? (
        // TODO(api): ai-skillswap needs GET /v1/ops/usage?days=7 (daily spend + today's calls/tokens).
        <p className={styles.notice}>
          Chưa xem được lịch sử theo ngày: dịch vụ AI hiện chỉ trả số liệu của hôm nay. Biểu đồ sẽ
          tự hiện khi dịch vụ AI bổ sung số liệu theo ngày.
        </p>
      ) : usage.status === 'error' ? (
        <p className={styles.notice} role="alert">
          {usage.message}
        </p>
      ) : (
        <ul className={styles.history} aria-label="Chi phí AI theo ngày">
          {usage.data.days.map((day) => {
            const percent = budgetVnd > 0 ? Math.min(100, (day.spentVnd / budgetVnd) * 100) : 0;
            return (
              <li key={day.day}>
                <span>{formatDay(day.day)}</span>
                <span className={styles.historyBar} aria-hidden="true">
                  <span style={{ width: `${percent}%` }} />
                </span>
                <b>{formatVnd(day.spentVnd)}</b>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function MethodCard({ budgetVnd }: { budgetVnd: number }) {
  const perMillion = (usd: number) => (usd > 0 ? formatVnd(usd * USD_TO_VND) : formatVnd(0));
  return (
    <section id="cost-method" className={styles.card} aria-labelledby="cost-method-title">
      <h2 id="cost-method-title" className="admin-card-title">
        Tiền được tính thế nào
      </h2>
      <ol className={styles.methodSteps}>
        <li>
          <b>Mỗi lần gọi AI được ghi sổ</b> theo số token đọc vào và viết ra (1 token ≈ 3 ký tự
          tiếng Việt).
        </li>
        <li>
          <b>Tiền = token vào × giá vào + token ra × giá ra</b>, theo bảng giá FPT AI Marketplace
          bên dưới, quy đổi 1 USD = {formatVnd(USD_TO_VND)}.
        </li>
        <li>
          <b>Trần mỗi ngày {formatVnd(budgetVnd)}.</b> Chạm trần thì KouKou và bot diễn đàn tạm
          nghỉ, gợi ý mentor dùng thứ tự mặc định, kiểm duyệt vẫn cho đăng bài. Trần tự mở lại lúc
          0:00.
        </li>
      </ol>
      <div className="admin-table-wrap">
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Model</th>
              <th>Dùng cho</th>
              <th className={styles.numeric}>Giá đọc vào / 1 triệu token</th>
              <th className={styles.numeric}>Giá viết ra / 1 triệu token</th>
            </tr>
          </thead>
          <tbody>
            {MODEL_PRICES.map((item) => (
              <tr key={item.model}>
                <td>
                  <code>{item.model}</code>
                </td>
                <td>{item.usedFor}</td>
                <td className={styles.numeric}>{perMillion(item.inputUsd)}</td>
                <td className={styles.numeric}>{perMillion(item.outputUsd)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function CostTab() {
  const [budget, setBudget] = useState<Section<AiBudget>>(loadingSection);
  const [usage, setUsage] = useState<Section<AiUsage>>(loadingSection);

  const load = useCallback(async () => {
    setBudget(loadingSection);
    setUsage(loadingSection);
    const [budgetResult, usageResult] = await Promise.allSettled([
      aiRepo.getBudget(),
      aiRepo.getUsage(7),
    ]);
    setBudget(settle(budgetResult, 'Không tải được chi phí AI.'));
    setUsage(settle(usageResult, 'Không tải được lịch sử chi phí AI.'));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const budgetVnd = budget.status === 'ready' ? budget.data.budgetVnd : DEFAULT_DAILY_BUDGET_VND;

  return (
    <div className={styles.stack}>
      <div className={styles.toolbarEnd}>
        <button
          type="button"
          className="admin-button"
          disabled={budget.status === 'loading'}
          onClick={() => void load()}
        >
          <RefreshCw aria-hidden="true" /> Làm mới
        </button>
      </div>
      <SpendCard
        budget={budget}
        usage={usage}
        costHref="#cost-method"
        onRetry={() => void load()}
      />
      <div className={styles.twoColumns}>
        <BreakdownCard budget={budget} onRetry={() => void load()} />
        <HistoryCard usage={usage} budgetVnd={budgetVnd} />
      </div>
      <MethodCard budgetVnd={budgetVnd} />
    </div>
  );
}
