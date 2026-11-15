/**
 * @file RecordViolationModal.tsx
 * @description Admin form to record a verified mentor violation
 * (POST /api/admin/mentors/{mentorUserId}/violations).
 */

'use client';

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
import { yupResolver } from '@hookform/resolvers/yup';
import { Controller, useForm } from 'react-hook-form';
import * as yup from 'yup';

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

export function RecordViolationModal({
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
