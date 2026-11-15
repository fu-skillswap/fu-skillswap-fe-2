/**
 * @file AdminMentorViolationsSection.tsx
 * @description Admin card on the mentor detail page: penalty score, booking suspension and the
 * violation history, with dialogs to record a verified violation or reverse a wrong one.
 */

'use client';

import { AdminTableState } from '@/components/domain/admin/AdminTableState';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { SelectField } from '@/components/ui/SelectField';
import { TextArea } from '@/components/ui/TextArea';
import { TextField } from '@/components/ui/TextField';
import {
  MENTOR_VIOLATION_SEVERITY_LABELS,
  MENTOR_VIOLATION_SOURCE_LABELS,
  MENTOR_VIOLATION_TYPE_LABELS,
  toSelectOptions,
} from '@/constants/mentorViolations';
import type { AdminMentorViolationRequest } from '@/models/admin';
import type { MentorViolationItemResponse } from '@/models/auth';
import { yupResolver } from '@hookform/resolvers/yup';
import { Plus, ShieldAlert, Undo2 } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import * as yup from 'yup';
import { useAdminMentorViolations } from './useAdminMentorViolations';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const TYPE_OPTIONS = toSelectOptions(MENTOR_VIOLATION_TYPE_LABELS);
const SEVERITY_OPTIONS = toSelectOptions(MENTOR_VIOLATION_SEVERITY_LABELS);
const SOURCE_OPTIONS = toSelectOptions(MENTOR_VIOLATION_SOURCE_LABELS);

const SOURCE_REFERENCE_HINTS: Record<string, string> = {
  BOOKING: 'Mã (UUID) của lịch đặt liên quan.',
  CHAT: 'Mã (UUID) của cuộc trò chuyện liên quan.',
  FORUM: 'Mã (UUID) của bài viết hoặc bình luận liên quan.',
  VERIFICATION: 'Mã (UUID) của hồ sơ xác minh liên quan.',
  ADMIN: 'Mã (UUID) của đối tượng liên quan; mặc định là mã mentor.',
};

const recordSchema = yup.object({
  type: yup.string().required('Vui lòng chọn loại vi phạm.'),
  severity: yup.string().required('Vui lòng chọn mức độ.'),
  sourceModule: yup.string().required('Vui lòng chọn nguồn phát sinh.'),
  sourceReferenceId: yup
    .string()
    .trim()
    .required('Vui lòng nhập mã tham chiếu.')
    .matches(UUID_PATTERN, 'Mã tham chiếu phải là UUID hợp lệ.'),
  reason: yup
    .string()
    .trim()
    .required('Vui lòng nhập lý do.')
    .min(3, 'Lý do cần ít nhất 3 ký tự.')
    .max(500, 'Lý do tối đa 500 ký tự.'),
  decisionNote: yup.string().trim().max(1000, 'Ghi chú tối đa 1000 ký tự.').default(''),
});

type RecordFormValues = yup.InferType<typeof recordSchema>;

const reverseSchema = yup.object({
  reason: yup
    .string()
    .trim()
    .required('Vui lòng nhập lý do đảo vi phạm.')
    .max(500, 'Lý do tối đa 500 ký tự.'),
});

type ReverseFormValues = yup.InferType<typeof reverseSchema>;

function formatDateTime(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(date);
}

function formatScore(value?: number) {
  return value == null ? '—' : new Intl.NumberFormat('vi-VN').format(value);
}

function isFuture(value?: string | null) {
  if (!value) return false;
  const time = new Date(value).getTime();
  return !Number.isNaN(time) && time > Date.now();
}

function severityVariant(severity?: string) {
  if (severity === 'CRITICAL' || severity === 'HIGH') return 'danger';
  if (severity === 'MEDIUM') return 'warning';
  return 'neutral';
}

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
  const { data, page, isLoading, error, isSubmitting, goToPage, reload, record, reverse } =
    useAdminMentorViolations(mentorUserId, onChanged);
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [reverseTarget, setReverseTarget] = useState<MentorViolationItemResponse>();

  const items = data?.history?.content ?? [];
  const totalPages = data?.history?.totalPages ?? 1;
  const suspendedUntil = data?.bookingSuspendedUntil;
  const isSuspended = isFuture(suspendedUntil);

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

      <dl className="m-0 mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryItem label="Điểm phạt hiện hành" value={formatScore(data?.activePenaltyScore)} />
        <SummaryItem label="Điểm phạt tích lũy" value={formatScore(data?.lifetimePenaltyScore)} />
        <SummaryItem label="Tổng số vi phạm" value={formatScore(data?.totalViolations)} />
        <SummaryItem
          label="Tạm khóa nhận lịch"
          value={
            isSuspended
              ? `Đến ${formatDateTime(suspendedUntil)}`
              : suspendedUntil
                ? `Đã hết (${formatDateTime(suspendedUntil)})`
                : 'Không'
          }
          tone={isSuspended ? 'danger' : undefined}
        />
      </dl>
      {data?.activeWindowStartAt && (
        <p className="m-0 mt-2 text-xs text-text-muted">
          Điểm phạt hiện hành được tính từ {formatDateTime(data.activeWindowStartAt)}.
        </p>
      )}

      <div className="admin-mentor-subject-table mt-4">
        <table>
          <thead>
            <tr>
              <th>Thời điểm</th>
              <th>Loại vi phạm</th>
              <th>Mức độ</th>
              <th>Điểm</th>
              <th>Lý do</th>
              <th>Trạng thái</th>
              <th aria-label="Thao tác" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <AdminTableState variant="loading" colSpan={7} title="Đang tải lịch sử vi phạm..." />
            ) : error ? (
              <AdminTableState
                variant="error"
                colSpan={7}
                title="Không thể tải lịch sử vi phạm"
                description={error}
                onRetry={reload}
              />
            ) : items.length ? (
              items.map((item) => (
                <tr key={item.violationId}>
                  <td className="whitespace-nowrap">{formatDateTime(item.occurredAt)}</td>
                  <td>
                    <strong className="block">
                      {MENTOR_VIOLATION_TYPE_LABELS[item.type] ?? item.type}
                    </strong>
                    {item.sourceModule && (
                      <small className="text-text-muted">
                        Nguồn:{' '}
                        {MENTOR_VIOLATION_SOURCE_LABELS[item.sourceModule] ?? item.sourceModule}
                        {item.bookingId ? ` · Booking ${item.bookingId.slice(0, 8)}` : ''}
                      </small>
                    )}
                  </td>
                  <td>
                    {item.severity ? (
                      <Badge variant={severityVariant(item.severity)}>
                        {MENTOR_VIOLATION_SEVERITY_LABELS[item.severity] ?? item.severity}
                      </Badge>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>{formatScore(item.points)}</td>
                  <td className="max-w-64 break-words">{item.reason || '—'}</td>
                  <td className="whitespace-nowrap">
                    {item.reversedAt ? (
                      <Badge variant="neutral">Đã đảo {formatDateTime(item.reversedAt)}</Badge>
                    ) : (
                      <Badge variant="warning">Đang tính điểm</Badge>
                    )}
                  </td>
                  <td>
                    {!item.reversedAt && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        leftIcon={<Undo2 className="h-4 w-4" aria-hidden="true" />}
                        onClick={() => setReverseTarget(item)}
                      >
                        Đảo
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <AdminTableState
                variant="empty"
                colSpan={7}
                title="Chưa có vi phạm nào"
                description="Mentor này chưa bị ghi nhận vi phạm."
              />
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-3 flex items-center justify-end gap-2 text-xs text-text-secondary">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={page <= 0 || isLoading}
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
            disabled={page >= totalPages - 1 || isLoading}
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
        <ReverseViolationModal
          violation={reverseTarget}
          isSubmitting={isSubmitting}
          onClose={() => setReverseTarget(undefined)}
          onSubmit={async (reason) => {
            if (await reverse(reverseTarget.violationId, reason)) setReverseTarget(undefined);
          }}
        />
      )}
    </section>
  );
}

function SummaryItem({ label, value, tone }: { label: string; value: string; tone?: 'danger' }) {
  return (
    <div className="rounded-xl border border-solid border-border-light bg-surface-subtle p-3">
      <dt className="text-[11px] font-semibold text-text-muted">{label}</dt>
      <dd
        className={`m-0 mt-1 text-sm font-extrabold ${tone === 'danger' ? 'text-danger' : 'text-text-main'}`}
      >
        {value}
      </dd>
    </div>
  );
}

function RecordViolationModal({
  mentorUserId,
  mentorName,
  isSubmitting,
  onClose,
  onSubmit,
}: {
  mentorUserId: string;
  mentorName: string;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (request: AdminMentorViolationRequest) => Promise<void>;
}) {
  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RecordFormValues>({
    resolver: yupResolver(recordSchema),
    defaultValues: {
      type: 'ADMIN_CONFIRMED_BREACH',
      severity: 'LOW',
      sourceModule: 'ADMIN',
      sourceReferenceId: mentorUserId,
      reason: '',
      decisionNote: '',
    },
  });
  const sourceModule = watch('sourceModule');

  return (
    <Modal
      open
      title="Ghi nhận vi phạm"
      onClose={() => !isSubmitting && onClose()}
      className="max-w-xl"
    >
      <form
        className="space-y-3"
        noValidate
        onSubmit={handleSubmit((values) =>
          onSubmit({
            type: values.type,
            severity: values.severity,
            sourceModule: values.sourceModule,
            sourceReferenceId: values.sourceReferenceId,
            reason: values.reason,
            decisionNote: values.decisionNote || undefined,
          }),
        )}
      >
        <p className="m-0 rounded-xl border border-solid border-amber-200 bg-warning-soft p-3 text-xs leading-5 text-text-secondary">
          Vi phạm sẽ cộng điểm phạt cho <strong>{mentorName}</strong> và có thể khiến mentor bị tạm
          khóa nhận lịch. Chỉ ghi nhận khi vi phạm đã được xác minh.
        </p>

        <Controller
          control={control}
          name="type"
          render={({ field }) => (
            <SelectField
              id="violation-type"
              label="Loại vi phạm"
              required
              options={TYPE_OPTIONS}
              value={field.value}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              error={errors.type?.message}
            />
          )}
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Controller
            control={control}
            name="severity"
            render={({ field }) => (
              <SelectField
                id="violation-severity"
                label="Mức độ"
                required
                options={SEVERITY_OPTIONS}
                value={field.value}
                onValueChange={field.onChange}
                onBlur={field.onBlur}
                error={errors.severity?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="sourceModule"
            render={({ field }) => (
              <SelectField
                id="violation-source"
                label="Nguồn phát sinh"
                required
                options={SOURCE_OPTIONS}
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                  // Only the admin source has an obvious default reference: the mentor itself.
                  setValue('sourceReferenceId', value === 'ADMIN' ? mentorUserId : '');
                }}
                onBlur={field.onBlur}
                error={errors.sourceModule?.message}
              />
            )}
          />
        </div>

        <TextField
          id="violation-reference"
          label="Mã tham chiếu"
          required
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          helperText={SOURCE_REFERENCE_HINTS[sourceModule]}
          error={errors.sourceReferenceId?.message}
          {...register('sourceReferenceId')}
        />

        <TextArea
          id="violation-reason"
          label="Lý do"
          required
          rows={3}
          maxLength={500}
          placeholder="Mô tả ngắn gọn vi phạm đã xác minh..."
          error={errors.reason?.message}
          {...register('reason')}
        />

        <TextArea
          id="violation-note"
          label="Ghi chú quyết định (nội bộ)"
          rows={2}
          maxLength={1000}
          className="!min-h-16"
          error={errors.decisionNote?.message}
          {...register('decisionNote')}
        />

        <div className="flex flex-col-reverse gap-2 border-t border-solid border-border-light pt-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" disabled={isSubmitting} onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" variant="destructive" loading={isSubmitting}>
            Ghi nhận vi phạm
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function ReverseViolationModal({
  violation,
  isSubmitting,
  onClose,
  onSubmit,
}: {
  violation: MentorViolationItemResponse;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReverseFormValues>({
    resolver: yupResolver(reverseSchema),
    defaultValues: { reason: '' },
  });

  return (
    <Modal open title="Đảo vi phạm?" onClose={() => !isSubmitting && onClose()}>
      <form
        className="space-y-3"
        noValidate
        onSubmit={handleSubmit((values) => onSubmit(values.reason))}
      >
        <div className="rounded-xl border border-solid border-border-light bg-surface-subtle p-3 text-xs leading-5 text-text-secondary">
          <div>
            <strong>Loại: </strong>
            {MENTOR_VIOLATION_TYPE_LABELS[violation.type] ?? violation.type}
          </div>
          <div>
            <strong>Thời điểm: </strong>
            {formatDateTime(violation.occurredAt)}
          </div>
          <div>
            <strong>Điểm phạt: </strong>
            {formatScore(violation.points)}
          </div>
          {violation.reason && (
            <div>
              <strong>Lý do ghi nhận: </strong>
              {violation.reason}
            </div>
          )}
        </div>
        <p className="m-0 text-xs leading-5 text-text-secondary">
          Điểm phạt của vi phạm này sẽ không còn được tính, và thời gian tạm khóa nhận lịch của
          mentor sẽ được hệ thống tính lại.
        </p>

        <TextArea
          id="reverse-reason"
          label="Lý do đảo vi phạm"
          required
          rows={3}
          maxLength={500}
          placeholder="Ví dụ: Vi phạm được ghi nhận nhầm..."
          error={errors.reason?.message}
          {...register('reason')}
        />

        <div className="flex flex-col-reverse gap-2 border-t border-solid border-border-light pt-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" disabled={isSubmitting} onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Đảo vi phạm
          </Button>
        </div>
      </form>
    </Modal>
  );
}
