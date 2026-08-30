/**
 * @file AvailabilityTemplateList.tsx
 * @description Hiển thị danh sách mẫu lịch lặp hằng tuần của mentor.
 */

'use client';

import { AlertTriangle, Calendar, Clock, Eye } from 'lucide-react';
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
  onOpenDetail,
  onPause,
  onResume,
}: AvailabilityTemplateListProps) {
  const renderStatusBadge = (template: AvailabilityTemplateResponse) => {
    const { effectiveStatus, configuredStatus } = template;

    if (effectiveStatus === 'ACTIVE') return <Badge variant="success">● Đang hoạt động</Badge>;
    if (effectiveStatus === 'PAUSED') return <Badge variant="warning">● Đã tạm dừng</Badge>;
    if (effectiveStatus === 'EXPIRED') {
      return (
        <Badge variant="neutral">
          ● Đã hết hạn {configuredStatus === 'ACTIVE' && '(Cấu hình: Bật)'}
        </Badge>
      );
    }
    if (effectiveStatus === 'ARCHIVED') return <Badge variant="neutral">● Đã lưu trữ</Badge>;

    return <Badge variant="neutral">{effectiveStatus}</Badge>;
  };

  return (
    <div className="mentor-template-management">
      <h3 className="mentor-template-list-title">Danh sách lịch lặp</h3>

      {error && <div className="mentor-template-error">{error}</div>}

      {isLoading ? (
        <div className="mentor-template-list" aria-label="Đang tải danh sách lịch lặp">
          {[1, 2].map((item) => (
            <div key={item} className="mentor-template-row mentor-template-row-skeleton">
              <div className="mentor-template-skeleton-block mentor-template-skeleton-wide" />
              <div className="mentor-template-skeleton-block" />
              <div className="mentor-template-skeleton-block" />
              <div className="mentor-template-skeleton-block mentor-template-skeleton-actions" />
            </div>
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="mentor-template-empty-card">
          <div className="mentor-template-empty-icon-box">
            <Calendar className="w-7 h-7 text-sky-600" />
          </div>
          <h4 className="mentor-template-empty-title">Bạn chưa có lịch lặp</h4>
          <p className="mentor-template-empty-sub">
            Tạo lịch cố định để hệ thống tự động mở các khung giờ rảnh cho bạn.
          </p>
        </div>
      ) : (
        <div className="mentor-template-list">
          {templates.map((template) => {
            const isPaused =
              template.configuredStatus === 'PAUSED' || template.effectiveStatus === 'PAUSED';
            const isArchived = template.effectiveStatus === 'ARCHIVED';

            return (
              <article key={template.templateId} className="mentor-template-row">
                <div className="mentor-template-time-column">
                  <div className="mentor-template-time">
                    <Clock aria-hidden="true" />
                    <span>
                      {formatLocalTime(template.startTime)} – {formatLocalTime(template.endTime)}
                    </span>
                  </div>
                  <div className="mentor-template-repeat">
                    <span>Lặp vào</span>
                    <div className="mentor-template-day-list">
                      {template.weekdays.map((weekday) => (
                        <span key={weekday} className="mentor-template-day-chip">
                          {WEEKDAY_SHORT_LABELS[weekday] ?? weekday}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mentor-template-validity-column">
                  <div className="mentor-template-validity-start">
                    <Calendar aria-hidden="true" />
                    <span>Từ {formatDateVi(template.effectiveFrom)}</span>
                  </div>
                  <span className="mentor-template-secondary-line">
                    {template.effectiveTo
                      ? `Đến ${formatDateVi(template.effectiveTo)}`
                      : 'Không giới hạn'}
                  </span>
                </div>

                <div className="mentor-template-status-column">
                  <span className="mentor-template-column-label">Trạng thái</span>
                  {renderStatusBadge(template)}
                </div>

                <div className="mentor-template-actions">
                  {!isArchived && (
                    <>
                      {isPaused ? (
                        <Button variant="outline" size="sm" onClick={() => onResume(template)}>
                          Tiếp tục
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => onPause(template)}>
                          Tạm dừng
                        </Button>
                      )}
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<Eye aria-hidden="true" />}
                    onClick={() => onOpenDetail(template)}
                  >
                    Xem chi tiết
                  </Button>
                </div>

                {template.generationBlockedReason && (
                  <div className="mentor-template-warning">
                    <AlertTriangle aria-hidden="true" />
                    <span>{template.generationBlockedReason}</span>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {hasNext && (
        <div className="mentor-template-load-more">
          <Button variant="outline" size="sm" loading={isLoadingMore} onClick={onLoadMore}>
            {isLoadingMore ? 'Đang tải thêm...' : 'Tải thêm mẫu lịch'}
          </Button>
        </div>
      )}
    </div>
  );
}
