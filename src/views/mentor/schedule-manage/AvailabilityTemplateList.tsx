/**
 * @file AvailabilityTemplateList.tsx
 * @description Hiển thị danh sách mẫu lịch lặp hằng tuần của mentor.
 */

'use client';

import {
  AlertTriangle,
  Calendar,
  Clock,
  Eye,
  MoreVertical,
  Pause,
  Play,
  Repeat2,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
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

function isActiveTemplate(template: AvailabilityTemplateResponse) {
  return template.configuredStatus === 'ACTIVE' && template.effectiveStatus === 'ACTIVE';
}

function getTemplateSignature(template: AvailabilityTemplateResponse) {
  return [
    formatLocalTime(template.startTime),
    formatLocalTime(template.endTime),
    [...template.weekdays].sort().join(','),
    template.effectiveFrom,
    template.effectiveTo ?? '',
    template.timezone,
    template.services
      .map((service) => service.serviceId)
      .sort()
      .join(','),
    template.note?.trim() ?? '',
  ].join('|');
}

function keepOldestActiveDuplicates(templates: AvailabilityTemplateResponse[]) {
  const oldestBySignature = new Map<string, AvailabilityTemplateResponse>();

  templates.forEach((template) => {
    if (!isActiveTemplate(template)) return;
    const signature = getTemplateSignature(template);
    const currentOldest = oldestBySignature.get(signature);
    if (!currentOldest || new Date(template.createdAt) < new Date(currentOldest.createdAt)) {
      oldestBySignature.set(signature, template);
    }
  });

  return templates.filter(
    (template) =>
      !isActiveTemplate(template) ||
      oldestBySignature.get(getTemplateSignature(template))?.templateId === template.templateId,
  );
}

function templateStatus(template: AvailabilityTemplateResponse) {
  if (template.effectiveStatus === 'ACTIVE') return <Badge variant="success">Đang hoạt động</Badge>;
  if (template.effectiveStatus === 'PAUSED') return <Badge variant="warning">Đã tạm dừng</Badge>;
  if (template.effectiveStatus === 'EXPIRED') {
    return (
      <Badge variant="neutral">
        Đã hết hạn {template.configuredStatus === 'ACTIVE' && '(Cấu hình: Bật)'}
      </Badge>
    );
  }
  if (template.effectiveStatus === 'ARCHIVED') return <Badge variant="neutral">Đã lưu trữ</Badge>;
  return <Badge variant="neutral">{template.effectiveStatus}</Badge>;
}

function templateWeekdays(template: AvailabilityTemplateResponse) {
  return template.weekdays.map((weekday) => WEEKDAY_SHORT_LABELS[weekday] ?? weekday).join(', ');
}

function templateEffectiveRange(template: AvailabilityTemplateResponse) {
  const effectiveTo = template.effectiveTo ? formatDateVi(template.effectiveTo) : 'Không giới hạn';
  return `${formatDateVi(template.effectiveFrom)} – ${effectiveTo}`;
}

function TemplateActions({
  template,
  onOpenDetail,
  onPause,
  onResume,
}: Pick<AvailabilityTemplateListProps, 'onOpenDetail' | 'onPause' | 'onResume'> & {
  template: AvailabilityTemplateResponse;
}) {
  const isPaused = template.configuredStatus === 'PAUSED' || template.effectiveStatus === 'PAUSED';
  const isArchived = template.effectiveStatus === 'ARCHIVED';

  return (
    <div className="flex items-center justify-end gap-1">
      {!isArchived && (
        <IconButton
          size="md"
          variant="ghost"
          aria-label={isPaused ? 'Tiếp tục lịch lặp' : 'Tạm dừng lịch lặp'}
          title={isPaused ? 'Tiếp tục' : 'Tạm dừng'}
          icon={isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          onClick={() => (isPaused ? onResume(template) : onPause(template))}
        />
      )}
      <IconButton
        size="md"
        variant="ghost"
        aria-label="Xem chi tiết lịch lặp"
        title="Xem chi tiết"
        icon={<Eye className="h-4 w-4" />}
        onClick={() => onOpenDetail(template)}
      />
      <IconButton
        size="md"
        variant="ghost"
        aria-label="Mở thêm thao tác lịch lặp"
        title="Thêm thao tác"
        icon={<MoreVertical className="h-4 w-4" />}
        onClick={() => onOpenDetail(template)}
      />
    </div>
  );
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
  const visibleTemplates = keepOldestActiveDuplicates(templates);

  return (
    <div className="overflow-hidden rounded-xl border border-border-color bg-white shadow-xs">
      {error && (
        <div
          className="m-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
          role="alert"
        >
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Không thể tải danh sách lịch lặp. Vui lòng thử lại.</span>
        </div>
      )}

      {isLoading ? (
        <div className="p-4" aria-label="Đang tải danh sách lịch lặp" aria-busy="true">
          <div className="hidden space-y-px lg:block">
            <div className="h-12 animate-pulse rounded-lg bg-slate-100" />
            {[1, 2, 3].map((item) => (
              <div key={item} className="mt-px h-16 animate-pulse rounded-lg bg-slate-50" />
            ))}
          </div>
          <div className="space-y-3 lg:hidden">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-40 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        </div>
      ) : visibleTemplates.length === 0 ? (
        <div className="px-6 py-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-light text-primary">
            <Calendar className="h-6 w-6" aria-hidden="true" />
          </div>
          <h3 className="mt-4 text-base font-bold text-text-main">Bạn chưa có lịch lặp</h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-text-muted">
            Tạo lịch cố định để hệ thống tự động mở các khung giờ rảnh cho bạn.
          </p>
          <Button
            type="button"
            className="mt-5"
            leftIcon={<Repeat2 className="h-4 w-4" />}
            onClick={onOpenCreate}
          >
            Tạo lịch hàng tuần
          </Button>
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[880px] table-fixed border-collapse text-left">
              <thead className="bg-primary text-xs font-semibold uppercase tracking-wide text-white shadow-sm">
                <tr>
                  <th className="w-[19%] px-5 py-3.5">Khung giờ</th>
                  <th className="w-[22%] px-5 py-3.5">Lặp vào</th>
                  <th className="w-[30%] px-5 py-3.5">Hiệu lực</th>
                  <th className="w-[17%] px-5 py-3.5">Trạng thái</th>
                  <th className="w-[12%] px-5 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {visibleTemplates.map((template) => (
                  <tr key={template.templateId} className="transition-colors hover:bg-slate-50/70">
                    <td className="px-5 py-3.5">
                      <span className="flex items-center gap-2.5 whitespace-nowrap text-sm font-semibold text-text-main">
                        <Clock
                          className="h-4.5 w-4.5 shrink-0 text-text-secondary"
                          aria-hidden="true"
                        />
                        {formatLocalTime(template.startTime)} – {formatLocalTime(template.endTime)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-text-secondary">
                      {templateWeekdays(template)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="flex items-center gap-2.5 whitespace-nowrap text-sm text-text-secondary">
                        <Calendar className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
                        {templateEffectiveRange(template)}
                      </span>
                      {template.generationBlockedReason && (
                        <span className="mt-1 block text-xs text-warning">
                          {template.generationBlockedReason}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">{templateStatus(template)}</td>
                    <td className="px-3 py-3.5">
                      <TemplateActions
                        template={template}
                        onOpenDetail={onOpenDetail}
                        onPause={onPause}
                        onResume={onResume}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-border-light lg:hidden">
            {visibleTemplates.map((template) => (
              <article key={template.templateId} className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <strong className="flex items-center gap-2 text-sm text-text-main">
                    <Clock
                      className="h-4.5 w-4.5 shrink-0 text-text-secondary"
                      aria-hidden="true"
                    />
                    {formatLocalTime(template.startTime)} – {formatLocalTime(template.endTime)}
                  </strong>
                  {templateStatus(template)}
                </div>
                <dl className="grid gap-2 text-sm">
                  <div className="flex gap-3">
                    <dt className="w-20 shrink-0 text-text-muted">Lặp vào</dt>
                    <dd className="font-medium text-text-secondary">
                      {templateWeekdays(template)}
                    </dd>
                  </div>
                  <div className="flex gap-3">
                    <dt className="w-20 shrink-0 text-text-muted">Hiệu lực</dt>
                    <dd className="text-text-secondary">{templateEffectiveRange(template)}</dd>
                  </div>
                </dl>
                {template.generationBlockedReason && (
                  <p className="text-xs leading-5 text-warning">
                    {template.generationBlockedReason}
                  </p>
                )}
                <TemplateActions
                  template={template}
                  onOpenDetail={onOpenDetail}
                  onPause={onPause}
                  onResume={onResume}
                />
              </article>
            ))}
          </div>
        </>
      )}

      {hasNext && (
        <div className="flex justify-center border-t border-border-light p-4">
          <Button variant="outline" size="sm" loading={isLoadingMore} onClick={onLoadMore}>
            {isLoadingMore ? 'Đang tải thêm...' : 'Tải thêm mẫu lịch'}
          </Button>
        </div>
      )}
    </div>
  );
}
