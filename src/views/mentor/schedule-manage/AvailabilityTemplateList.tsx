/**
 * @file AvailabilityTemplateList.tsx
 * @description Hiển thị danh sách mẫu lịch lặp hằng tuần của mentor.
 */

'use client';

import { AlertTriangle, Calendar, Clock, Eye, Pause, Play, Repeat2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { AvailabilityTemplateResponse } from '@/models/auth';
import { formatDateVi, formatLocalTime, WEEKDAY_SHORT_LABELS } from './mentorTemplateHelpers';

interface AvailabilityTemplateListProps {
  templates: AvailabilityTemplateResponse[];
  isLoading: boolean;
  error: string | null;
  hasNext: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  onOpenCreate: () => void;
  onOpenDetail: (template: AvailabilityTemplateResponse) => void;
  onPause: (template: AvailabilityTemplateResponse) => void;
  onResume: (template: AvailabilityTemplateResponse) => void;
}

export function AvailabilityTemplateList({
  templates,
  isLoading,
  error,
  hasNext,
  isLoadingMore,
  onLoadMore,
  onOpenCreate,
  onOpenDetail,
  onPause,
  onResume,
}: AvailabilityTemplateListProps) {
  const renderStatusBadge = (template: AvailabilityTemplateResponse) => {
    const { effectiveStatus, configuredStatus } = template;

    if (effectiveStatus === 'ACTIVE') return <Badge variant="success">Đang hoạt động</Badge>;
    if (effectiveStatus === 'PAUSED') return <Badge variant="warning">Đã tạm dừng</Badge>;
    if (effectiveStatus === 'EXPIRED') {
      return (
        <Badge variant="neutral">
          Đã hết hạn {configuredStatus === 'ACTIVE' && '(Cấu hình: Bật)'}
        </Badge>
      );
    }
    if (effectiveStatus === 'ARCHIVED') return <Badge variant="neutral">Đã lưu trữ</Badge>;

    return <Badge variant="neutral">{effectiveStatus}</Badge>;
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900">Danh sách lịch lặp</h3>
          <p className="mt-1 text-sm text-slate-500">
            Các khung giờ được tự động mở theo chu kỳ hằng tuần.
          </p>
        </div>
        <Button
          type="button"
          className="border-[#119CF7] bg-[#119CF7] hover:bg-[#0789dc]"
          leftIcon={<Repeat2 className="h-4 w-4" aria-hidden="true" />}
          onClick={onOpenCreate}
        >
          Tạo lịch lặp
        </Button>
      </div>

      {error && (
        <div
          className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
          role="alert"
        >
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Không thể tải danh sách lịch lặp. Vui lòng thử lại.</span>
        </div>
      )}

      {isLoading ? (
        <div
          className="grid grid-cols-1 gap-4 xl:grid-cols-2"
          aria-label="Đang tải danh sách lịch lặp"
          aria-busy="true"
        >
          {[1, 2].map((item) => (
            <div key={item} className="h-48 animate-pulse rounded-2xl bg-slate-100 p-5">
              <div className="h-5 w-40 rounded bg-slate-200" />
              <div className="mt-5 h-4 w-56 rounded bg-slate-200" />
              <div className="mt-3 h-4 w-32 rounded bg-slate-200" />
            </div>
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sky-50 text-[#119CF7]">
            <Calendar className="h-6 w-6" aria-hidden="true" />
          </div>
          <h4 className="mt-4 text-base font-bold text-slate-900">Bạn chưa có lịch lặp</h4>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
            Tạo lịch cố định để hệ thống tự động mở các khung giờ rảnh cho bạn.
          </p>
          <Button
            type="button"
            className="mt-5 border-[#119CF7] bg-[#119CF7] hover:bg-[#0789dc]"
            leftIcon={<Repeat2 className="h-4 w-4" aria-hidden="true" />}
            onClick={onOpenCreate}
          >
            Tạo lịch lặp
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {templates.map((template) => {
            const isPaused =
              template.configuredStatus === 'PAUSED' || template.effectiveStatus === 'PAUSED';
            const isArchived = template.effectiveStatus === 'ARCHIVED';

            return (
              <article
                key={template.templateId}
                className="flex min-h-52 flex-col rounded-2xl border border-slate-200 bg-white p-5 transition duration-200 hover:border-sky-200 hover:shadow-md"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-[#119CF7]">
                      <Clock className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                      <strong className="block text-lg font-bold tracking-tight text-slate-900">
                        {formatLocalTime(template.startTime)} – {formatLocalTime(template.endTime)}
                      </strong>
                      <span className="mt-0.5 block text-xs text-slate-500">Khung giờ lặp</span>
                    </div>
                  </div>
                  {renderStatusBadge(template)}
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Lặp vào
                    </span>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {template.weekdays.map((weekday) => (
                        <span
                          key={weekday}
                          className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg border border-sky-200 bg-sky-50 px-2 text-xs font-bold text-[#087fc5]"
                        >
                          {WEEKDAY_SHORT_LABELS[weekday] ?? weekday}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Hiệu lực
                    </span>
                    <div className="mt-2 flex items-start gap-2 text-sm text-slate-700">
                      <Calendar
                        className="mt-0.5 h-4 w-4 shrink-0 text-[#119CF7]"
                        aria-hidden="true"
                      />
                      <div>
                        <span className="block">Từ {formatDateVi(template.effectiveFrom)}</span>
                        <span className="mt-0.5 block text-slate-500">
                          {template.effectiveTo
                            ? `Đến ${formatDateVi(template.effectiveTo)}`
                            : 'Không giới hạn ngày kết thúc'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {template.generationBlockedReason && (
                  <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-700">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{template.generationBlockedReason}</span>
                  </div>
                )}

                <div className="mt-auto flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-4">
                  {!isArchived && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-slate-300 text-slate-700 hover:border-[#119CF7] hover:bg-sky-50 hover:text-[#119CF7]"
                      leftIcon={
                        isPaused ? (
                          <Play className="h-3.5 w-3.5" aria-hidden="true" />
                        ) : (
                          <Pause className="h-3.5 w-3.5" aria-hidden="true" />
                        )
                      }
                      onClick={() => (isPaused ? onResume(template) : onPause(template))}
                    >
                      {isPaused ? 'Tiếp tục' : 'Tạm dừng'}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-[#119CF7]/40 text-[#119CF7] hover:border-[#119CF7] hover:bg-sky-50"
                    leftIcon={<Eye className="h-3.5 w-3.5" aria-hidden="true" />}
                    onClick={() => onOpenDetail(template)}
                  >
                    Xem chi tiết
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {hasNext && (
        <div className="mt-5 flex justify-center">
          <Button
            variant="outline"
            size="sm"
            className="border-[#119CF7]/40 text-[#119CF7] hover:border-[#119CF7] hover:bg-sky-50"
            loading={isLoadingMore}
            onClick={onLoadMore}
          >
            {isLoadingMore ? 'Đang tải thêm...' : 'Tải thêm mẫu lịch'}
          </Button>
        </div>
      )}
    </div>
  );
}
