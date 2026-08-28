/**
 * @file AvailabilityTemplateList.tsx
 * @description Renders the list of Weekly Availability Templates using SkillSwap UI Foundation primitives.
 */

'use client';

import { Clock, Calendar, CheckCircle2, PauseCircle, Archive, AlertTriangle, Eye, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Badge } from '@/components/ui/Badge';
import type { AvailabilityTemplateResponse } from '@/models/auth';
import {
  formatDateVi,
  formatLocalTime,
  formatWeekdays,
} from './mentorTemplateHelpers';

interface AvailabilityTemplateListProps {
  templates: AvailabilityTemplateResponse[];
  isLoading: boolean;
  error: string | null;
  hasNext: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  onOpenCreate: () => void;
  onOpenDetail: (template: AvailabilityTemplateResponse) => void;
  onOpenEdit: (template: AvailabilityTemplateResponse) => void;
  onPause: (template: AvailabilityTemplateResponse) => void;
  onResume: (template: AvailabilityTemplateResponse) => void;
  onArchive: (template: AvailabilityTemplateResponse) => void;
}

export function AvailabilityTemplateList({
  templates,
  isLoading,
  error,
  hasNext,
  isLoadingMore,
  onLoadMore,
  onOpenDetail,
  onOpenEdit,
  onPause,
  onResume,
  onArchive,
}: AvailabilityTemplateListProps) {
  const renderStatusBadge = (template: AvailabilityTemplateResponse) => {
    const { effectiveStatus, configuredStatus } = template;

    if (effectiveStatus === 'ACTIVE') {
      return (
        <Badge variant="success" icon={<CheckCircle2 className="w-3.5 h-3.5" />}>
          Đang hoạt động
        </Badge>
      );
    }

    if (effectiveStatus === 'PAUSED') {
      return (
        <Badge variant="warning" icon={<PauseCircle className="w-3.5 h-3.5" />}>
          Đã tạm dừng
        </Badge>
      );
    }

    if (effectiveStatus === 'EXPIRED') {
      return (
        <Badge variant="neutral" icon={<Clock className="w-3.5 h-3.5" />}>
          Đã hết hạn {configuredStatus === 'ACTIVE' && '(Cấu hình: Bật)'}
        </Badge>
      );
    }

    if (effectiveStatus === 'ARCHIVED') {
      return (
        <Badge variant="neutral" icon={<Archive className="w-3.5 h-3.5" />}>
          Đã lưu trữ
        </Badge>
      );
    }

    return <Badge variant="neutral">{effectiveStatus}</Badge>;
  };

  return (
    <div className="mentor-template-management space-y-4 pt-1">
      {/* Header Description */}
      <div className="pb-2 border-b border-slate-100 mb-4">
        <h3 className="text-base font-bold text-slate-900">Lịch lặp hàng tuần</h3>
        <p className="text-xs text-slate-500 mt-1">
          Thiết lập các khung giờ cố định để hệ thống tự động mở lịch mỗi tuần.
        </p>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
          {error}
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="p-4 bg-white border border-gray-200 rounded-xl space-y-3 animate-pulse">
              <div className="flex justify-between items-center">
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-4 bg-gray-200 rounded w-1/4" />
              </div>
              <div className="h-6 bg-gray-200 rounded w-1/3" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
              <div className="h-8 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      ) : templates.length === 0 ? (
        /* Empty State (Full width container with 48px icon box) */
        <div className="w-full py-16 px-6 text-center bg-white border border-slate-200 rounded-xl my-2 shadow-sm flex flex-col items-center justify-center min-h-[240px]">
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-3">
            <Calendar className="w-6 h-6 text-sky-500" />
          </div>
          <h4 className="text-base font-bold text-slate-900">Bạn chưa có lịch lặp</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
            Tạo lịch cố định để hệ thống tự động mở các khung giờ rảnh cho bạn.
          </p>
        </div>
      ) : (
        /* Template List Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((template) => {
            const isPaused = template.configuredStatus === 'PAUSED' || template.effectiveStatus === 'PAUSED';
            const isArchived = template.effectiveStatus === 'ARCHIVED';

            return (
              <div
                key={template.templateId}
                className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-sm hover:border-sky-300 transition-all flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  {/* Top Bar: Weekdays & Status */}
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-bold text-gray-900">
                      {formatWeekdays(template.weekdays)}
                    </h3>
                    {renderStatusBadge(template)}
                  </div>

                  {/* Time Range */}
                  <div className="text-base font-extrabold text-sky-700 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-sky-500" />
                    <span>
                      {formatLocalTime(template.startTime)} – {formatLocalTime(template.endTime)}
                    </span>
                  </div>

                  {/* Bound Services */}
                  <div className="text-xs text-gray-700">
                    <span className="text-gray-500 font-medium">Dịch vụ: </span>
                    <span className="font-semibold text-gray-800">
                      {template.services.map((s) => s.title).join(', ') || 'Chưa gắn dịch vụ'}
                    </span>
                  </div>

                  {/* Effective Dates */}
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <span>Áp dụng: </span>
                    <strong className="text-gray-700">
                      {formatDateVi(template.effectiveFrom)}
                    </strong>
                    <span>→</span>
                    <strong className="text-gray-700">
                      {template.effectiveTo ? formatDateVi(template.effectiveTo) : 'Không giới hạn'}
                    </strong>
                  </div>

                  {/* Generation Blocked Warning */}
                  {template.generationBlockedReason && (
                    <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800 font-medium flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                      <span>{template.generationBlockedReason}</span>
                    </div>
                  )}
                </div>

                {/* Card Action Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<Eye className="w-3.5 h-3.5 text-sky-600" />}
                    onClick={() => onOpenDetail(template)}
                    className="text-sky-600 hover:text-sky-800 font-semibold p-1"
                  >
                    Chi tiết
                  </Button>

                  <div className="flex items-center gap-1.5">
                    {!isArchived && (
                      <>
                        <Button
                          variant="secondary"
                          size="sm"
                          leftIcon={<Edit2 className="w-3 h-3 text-slate-500" />}
                          onClick={() => onOpenEdit(template)}
                        >
                          Sửa
                        </Button>

                        {isPaused ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onResume(template)}
                            className="text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100"
                          >
                            Tiếp tục
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPause(template)}
                            className="text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100"
                          >
                            Tạm dừng
                          </Button>
                        )}

                        <IconButton
                          variant="ghost"
                          size="sm"
                          icon={<Archive className="w-3.5 h-3.5 text-slate-400 hover:text-red-600" />}
                          aria-label="Lưu trữ mẫu lịch này"
                          onClick={() => onArchive(template)}
                        />
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Load More Button */}
      {hasNext && (
        <div className="text-center pt-2">
          <Button
            variant="outline"
            size="sm"
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
