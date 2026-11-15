/**
 * @file AdminMentorViolationsSection.tsx
 * @description Full-width admin card on the mentor detail page: penalty score band, booking
 * suspension and the violation history (table, cards below 768px), with the dialogs to record a
 * verified violation or reverse ("gỡ") a wrong one.
 */

'use client';

import { AdminTableState } from '@/components/domain/admin/AdminTableState';
import { Button } from '@/components/ui/Button';
import type { MentorViolationItemResponse } from '@/models/auth';
import { Lock, Plus, ShieldAlert, Undo2 } from 'lucide-react';
import { useState } from 'react';
import {
  DANGER_OUTLINE_BUTTON_CLASS,
  formatPoints,
  formatViolationDateTime,
  isBookingSuspended,
  violationState,
} from './mentorViolations.helpers';
import { RecordViolationModal } from './RecordViolationModal';
import { ReverseViolationDialog } from './ReverseViolationDialog';
import { useAdminMentorViolations } from './useAdminMentorViolations';
import {
  BookingReference,
  SeverityPill,
  ViolationStatePill,
  violationTypeLabel,
} from './ViolationPills';

const COLUMN_COUNT = 7;

export function AdminMentorViolationsSection({
  mentorUserId,
  mentorName,
  onChanged,
}: {
  mentorUserId: string;
  mentorName: string;
  /** Called after a violation is recorded or reversed, so the page can refresh the mentor. */
  onChanged?: () => void;
}) {
  const { data, page, isLoading, isFetching, error, isSubmitting, goToPage, reload, record } =
    useAdminMentorViolations(mentorUserId, { onChanged });
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [reverseTarget, setReverseTarget] = useState<MentorViolationItemResponse>();

  const items = data?.history?.content ?? [];
  const totalPages = data?.history?.totalPages ?? 1;
  const activeWindowStartAt = data?.activeWindowStartAt;
  const suspended = isBookingSuspended(data);

  const reverseButton = (item: MentorViolationItemResponse) => (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className={DANGER_OUTLINE_BUTTON_CLASS}
      leftIcon={<Undo2 className="h-4 w-4" aria-hidden="true" />}
      onClick={() => setReverseTarget(item)}
    >
      Gỡ vi phạm
    </Button>
  );

  const pointsCell = (item: MentorViolationItemResponse) =>
    item.reversedAt ? (
      <>
        <strong className="block text-base font-bold">0</strong>
        <small className="whitespace-nowrap text-xs">đã gỡ {formatPoints(item.points ?? 0)}</small>
      </>
    ) : (
      <strong className="text-base font-bold text-slate-900">
        {formatPoints(item.points ?? 0)}
      </strong>
    );

  const stateCell = (item: MentorViolationItemResponse) => (
    <>
      <ViolationStatePill state={violationState(item, activeWindowStartAt)} />
      {item.reversedAt && (
        // TODO(api): show who reversed it and why once MentorViolationItemResponse has
        // reversedBy + reverseReason.
        <small className="mt-1 block whitespace-nowrap text-xs text-slate-500">
          Đã gỡ lúc {formatViolationDateTime(item.reversedAt)}
        </small>
      )}
    </>
  );

  return (
    <section
      id="violations"
      className="admin-mentor-detail-card scroll-mt-24"
      aria-labelledby="admin-mentor-violations-title"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="admin-mentor-violations-title" className="admin-card-title !mb-0">
          <ShieldAlert aria-hidden="true" /> Vi phạm &amp; tạm khóa nhận lịch
        </h2>
        <Button
          type="button"
          size="sm"
          variant="outline"
          leftIcon={<Plus className="h-4 w-4" aria-hidden="true" />}
          onClick={() => setIsRecordOpen(true)}
        >
          Ghi nhận vi phạm
        </Button>
      </div>

      <div
        className={`mt-4 flex flex-wrap items-center gap-x-8 gap-y-4 rounded-2xl border border-solid p-5 ${
          suspended ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-slate-50'
        }`}
      >
        <div className="flex items-baseline gap-2.5">
          {isLoading ? (
            <span className="inline-block h-11 w-14 animate-pulse rounded-lg bg-slate-200" />
          ) : (
            <strong
              className={`text-[44px] font-extrabold leading-none ${
                suspended ? 'text-red-700' : 'text-slate-900'
              }`}
            >
              {formatPoints(data?.activePenaltyScore ?? 0)}
            </strong>
          )}
          <span className="text-sm font-semibold text-slate-600">điểm phạt hiện hành</span>
        </div>
        <dl className="m-0 flex flex-wrap gap-x-8 gap-y-3">
          <SummaryFact
            label="Tích lũy"
            value={isLoading ? '—' : `${formatPoints(data?.lifetimePenaltyScore ?? 0)} điểm`}
          />
          <SummaryFact
            label="Tổng số vi phạm"
            value={isLoading ? '—' : formatPoints(data?.totalViolations ?? 0)}
          />
          {activeWindowStartAt && (
            <SummaryFact
              label="Tính điểm từ"
              value={formatViolationDateTime(activeWindowStartAt)}
            />
          )}
        </dl>
        {suspended && (
          <span className="inline-flex items-center gap-2 rounded-full border border-solid border-red-200 bg-white px-3.5 py-1.5 text-sm font-bold text-red-700 lg:ml-auto">
            <Lock className="h-4 w-4 shrink-0" aria-hidden="true" />
            Tạm khóa nhận lịch đến {formatViolationDateTime(data?.bookingSuspendedUntil)}
          </span>
        )}
      </div>

      {/* Table from 768px */}
      <div className="admin-mentor-subject-table mt-4 hidden md:block">
        <table>
          <thead>
            <tr>
              <th>Thời điểm</th>
              <th>Loại vi phạm</th>
              <th>Mức độ</th>
              <th>Điểm</th>
              <th>Lý do</th>
              <th>Trạng thái</th>
              <th>
                <span className="sr-only">Thao tác</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <AdminTableState
                variant="loading"
                colSpan={COLUMN_COUNT}
                title="Đang tải lịch sử vi phạm…"
              />
            ) : error ? (
              <AdminTableState
                variant="error"
                colSpan={COLUMN_COUNT}
                title="Không thể tải lịch sử vi phạm"
                description={error}
                onRetry={reload}
              />
            ) : items.length ? (
              items.map((item) => (
                <tr key={item.violationId} className={item.reversedAt ? 'text-slate-400' : ''}>
                  <td className="whitespace-nowrap !text-inherit">
                    {formatViolationDateTime(item.occurredAt)}
                  </td>
                  <td className="!text-inherit">
                    <strong
                      className={`block font-bold ${item.reversedAt ? '' : 'text-slate-900'}`}
                    >
                      {violationTypeLabel(item.type)}
                    </strong>
                    <BookingReference bookingId={item.bookingId} />
                  </td>
                  <td className="whitespace-nowrap">
                    <SeverityPill severity={item.severity} />
                  </td>
                  <td className="!text-inherit">{pointsCell(item)}</td>
                  <td className="max-w-[340px] break-words !text-inherit">{item.reason || '—'}</td>
                  <td>{stateCell(item)}</td>
                  <td className="text-right">{!item.reversedAt && reverseButton(item)}</td>
                </tr>
              ))
            ) : (
              <AdminTableState
                variant="empty"
                colSpan={COLUMN_COUNT}
                title="Chưa có vi phạm nào"
                description="Mentor này chưa bị ghi nhận vi phạm."
              />
            )}
          </tbody>
        </table>
      </div>

      {/* Cards below 768px */}
      <div className="mt-4 md:hidden">
        {isLoading ? (
          <div className="space-y-3" role="status" aria-label="Đang tải lịch sử vi phạm">
            {[0, 1].map((index) => (
              <div key={index} className="h-32 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-solid border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <p className="m-0 font-semibold">Không thể tải lịch sử vi phạm</p>
            <p className="m-0 mt-1">{error}</p>
            <Button type="button" size="sm" variant="outline" className="mt-3" onClick={reload}>
              Thử lại
            </Button>
          </div>
        ) : items.length ? (
          <ul className="m-0 list-none space-y-3 p-0">
            {items.map((item) => (
              <li
                key={item.violationId}
                className={`rounded-2xl border border-solid border-slate-200 p-4 ${
                  item.reversedAt ? 'text-slate-400' : 'text-slate-600'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <strong
                      className={`block text-sm font-bold ${item.reversedAt ? '' : 'text-slate-900'}`}
                    >
                      {violationTypeLabel(item.type)}
                    </strong>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-xs">
                      <span className="whitespace-nowrap">
                        {formatViolationDateTime(item.occurredAt)}
                      </span>
                      <SeverityPill severity={item.severity} />
                      <BookingReference bookingId={item.bookingId} />
                    </div>
                  </div>
                  <div className="shrink-0 text-right text-xs">
                    {pointsCell(item)}
                    {!item.reversedAt && <span className="block">điểm</span>}
                  </div>
                </div>
                {item.reason && (
                  <p className="m-0 mt-2.5 break-words text-sm leading-6">{item.reason}</p>
                )}
                <div className="mt-3 flex flex-wrap items-end justify-between gap-2">
                  <div>{stateCell(item)}</div>
                  {!item.reversedAt && reverseButton(item)}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="m-0 rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
            Mentor này chưa bị ghi nhận vi phạm.
          </p>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-3 flex items-center justify-end gap-2 text-xs text-text-secondary">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={page <= 0 || isFetching}
            onClick={() => goToPage(page - 1)}
          >
            Trước
          </Button>
          <span>
            Trang {page + 1} / {totalPages}
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={page >= totalPages - 1 || isFetching}
            onClick={() => goToPage(page + 1)}
          >
            Sau
          </Button>
        </div>
      )}

      {isRecordOpen && (
        <RecordViolationModal
          mentorUserId={mentorUserId}
          mentorName={mentorName}
          isSubmitting={isSubmitting}
          onClose={() => setIsRecordOpen(false)}
          onSubmit={async (request) => {
            if (await record(request)) setIsRecordOpen(false);
          }}
        />
      )}

      {reverseTarget && (
        <ReverseViolationDialog
          mentorUserId={mentorUserId}
          mentorName={mentorName}
          violation={reverseTarget}
          activePenaltyScore={data?.activePenaltyScore}
          activeWindowStartAt={activeWindowStartAt}
          onClose={() => setReverseTarget(undefined)}
          onReversed={onChanged}
        />
      )}
    </section>
  );
}

function SummaryFact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[12.5px] text-slate-500">{label}</dt>
      <dd className="m-0 mt-0.5 text-[15px] font-bold text-slate-900">{value}</dd>
    </div>
  );
}
