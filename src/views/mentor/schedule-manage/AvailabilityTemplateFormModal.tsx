/**
 * @file AvailabilityTemplateFormModal.tsx
 * @description Single-column modal to create or edit a weekly availability template: day
 * presets, several 24h time ranges, services, effective dates and a sticky summary footer.
 */

'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { CalendarDays, Plus, Trash2, X } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import type {
  AvailabilityTemplateResponse,
  CreateAvailabilityTemplateRequest,
  MentorServiceManagementResponse,
  UpdateAvailabilityTemplateRequest,
  WeekdayEnum,
} from '@/models/auth';
import { getUserFriendlyErrorMessage } from '@/utils/toast';
import {
  ALL_WEEKDAYS,
  WEEKDAY_LABELS,
  WEEKDAY_SHORT_LABELS,
  formatDateVi,
  formatLocalTime,
} from './mentorTemplateHelpers';
import {
  type TimeRange,
  findScheduleConflicts,
  formatDayGroup,
  formatDuration,
  formatRange,
  formatScheduleSummary,
  getRangeErrors,
  nextDefaultRange,
  rangeMinutes,
  timeOptionsWith,
  toMinutes,
  todayIso,
} from './weeklyScheduleForm';

interface AvailabilityTemplateFormModalProps {
  open: boolean;
  template: AvailabilityTemplateResponse | null;
  activeServices: MentorServiceManagementResponse[];
  /** Loaded templates, used to block schedules that overlap an existing one. */
  existingTemplates: AvailabilityTemplateResponse[];
  /** Update in progress (create progress is tracked inside the modal). */
  isSubmitting: boolean;
  staleNotice: string | null;
  onClose: () => void;
  /** Creates one template; must throw on failure so the modal can report it. */
  onCreate: (data: CreateAvailabilityTemplateRequest) => Promise<void>;
  /** Every range was created: close, toast and refetch. */
  onCreated: (summary: string) => Promise<void>;
  /** Some ranges were created before a failure: refetch while the form stays open. */
  onPartialCreate: () => void;
  onSubmitUpdate: (templateId: string, data: UpdateAvailabilityTemplateRequest) => Promise<void>;
}

type EndMode = 'UNLIMITED' | 'UNTIL_DATE';

const NOTE_MAX_LENGTH = 200;
const WORK_WEEK: WeekdayEnum[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
const WEEKEND: WeekdayEnum[] = ['SATURDAY', 'SUNDAY'];
const FOCUS_RING = 'outline-none focus-visible:ring-4 focus-visible:ring-primary/20';
const GROUP_HEADING = 'm-0 text-[15px] font-semibold text-text-main';
const SELECT_CLASS = `h-11 w-[104px] cursor-pointer rounded-xl border border-solid bg-white px-3 text-sm font-medium text-text-main hover:border-border-strong ${FOCUS_RING}`;
const ERROR_TEXT = 'm-0 text-xs font-medium text-danger';

const formatScoin = (value: number) => new Intl.NumberFormat('vi-VN').format(value);

function servicePriceLabel(service: MentorServiceManagementResponse) {
  const price = service.isFree
    ? 'Miễn phí'
    : `${formatScoin(service.publicPriceScoin ?? 0)} S-coins`;
  return `${service.durationMinutes} phút · ${price}`;
}

/**
 * Native date input kept for its picker and keyboard support, overlaid with a dd/MM/yyyy label
 * because the browser renders the native value in the OS locale (often MM/DD/YYYY).
 */
function DateField({
  id,
  value,
  min,
  invalid,
  onChange,
}: {
  id: string;
  value: string;
  min?: string;
  invalid?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div
      className={`relative flex h-11 items-center gap-2 rounded-xl border border-solid bg-white px-3 text-sm font-medium text-text-main focus-within:ring-4 focus-within:ring-primary/20 ${invalid ? 'border-danger' : 'border-border-color hover:border-border-strong'}`}
    >
      <CalendarDays className="h-4 w-4 shrink-0 text-text-muted" aria-hidden="true" />
      <span aria-hidden="true" className={value ? '' : 'text-text-muted'}>
        {value ? formatDateVi(value) : 'dd/mm/yyyy'}
      </span>
      <input
        id={id}
        type="date"
        value={value}
        min={min}
        aria-invalid={invalid || undefined}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        onChange={(event) => onChange(event.target.value)}
        onClick={(event) => {
          try {
            event.currentTarget.showPicker?.();
          } catch {
            // showPicker can throw outside a user gesture; the native field still works.
          }
        }}
      />
    </div>
  );
}

export function AvailabilityTemplateFormModal({
  open,
  template,
  activeServices,
  existingTemplates,
  isSubmitting,
  staleNotice,
  onClose,
  onCreate,
  onCreated,
  onPartialCreate,
  onSubmitUpdate,
}: AvailabilityTemplateFormModalProps) {
  const isEdit = Boolean(template);
  const baseId = useId();
  const rangeIdRef = useRef(0);
  const newRangeId = () => `range-${(rangeIdRef.current += 1)}`;

  const [weekdays, setWeekdays] = useState<WeekdayEnum[]>(['MONDAY']);
  const [ranges, setRanges] = useState<TimeRange[]>([]);
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [endMode, setEndMode] = useState<EndMode>('UNLIMITED');
  const [effectiveTo, setEffectiveTo] = useState('');
  const [note, setNote] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [submitError, setSubmitError] = useState<string>();
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);
  const initialSnapshotRef = useRef('');

  const snapshot = (values: {
    weekdays: WeekdayEnum[];
    ranges: TimeRange[];
    serviceIds: string[];
    effectiveFrom: string;
    endMode: EndMode;
    effectiveTo: string;
    note: string;
  }) => JSON.stringify({ ...values, ranges: values.ranges.map(({ start, end }) => [start, end]) });

  // Reset whenever the modal opens or switches template. activeServices only seeds the
  // create defaults, so a refreshed service list must not wipe a form that is already open.
  useEffect(() => {
    if (!open) return;
    const next = template
      ? {
          weekdays: template.weekdays || [],
          ranges: [
            {
              id: newRangeId(),
              start: formatLocalTime(template.startTime),
              end: formatLocalTime(template.endTime),
            },
          ],
          serviceIds: (template.services || []).map((service) => service.serviceId),
          effectiveFrom: template.effectiveFrom || '',
          endMode: (template.effectiveTo ? 'UNTIL_DATE' : 'UNLIMITED') as EndMode,
          effectiveTo: template.effectiveTo || '',
          note: template.note || '',
        }
      : {
          weekdays: ['MONDAY'] as WeekdayEnum[],
          ranges: [{ id: newRangeId(), start: '09:00', end: '12:00' }],
          serviceIds: activeServices.map((service) => service.serviceId),
          effectiveFrom: todayIso(),
          endMode: 'UNLIMITED' as EndMode,
          effectiveTo: '',
          note: '',
        };
    setWeekdays(next.weekdays);
    setRanges(next.ranges);
    setServiceIds(next.serviceIds);
    setEffectiveFrom(next.effectiveFrom);
    setEndMode(next.endMode);
    setEffectiveTo(next.effectiveTo);
    setNote(next.note);
    setSubmitError(undefined);
    setConfirmingDiscard(false);
    initialSnapshotRef.current = snapshot(next);
  }, [open, template]);

  const isDirty =
    snapshot({ weekdays, ranges, serviceIds, effectiveFrom, endMode, effectiveTo, note }) !==
    initialSnapshotRef.current;

  /* ------------------------------- Validation ------------------------------- */

  const rangeErrors = useMemo(() => getRangeErrors(ranges), [ranges]);
  const effectiveToForApi = endMode === 'UNTIL_DATE' ? effectiveTo : '';
  // TODO(api): templates are paginated (20 per page); this check only covers loaded pages, so
  // the backend stays the source of truth for overlaps beyond them.
  const conflicts = useMemo(
    () =>
      findScheduleConflicts(existingTemplates, {
        weekdays,
        ranges,
        effectiveFrom,
        effectiveTo: effectiveToForApi || undefined,
        excludeTemplateId: template?.templateId,
      }),
    [existingTemplates, weekdays, ranges, effectiveFrom, effectiveToForApi, template?.templateId],
  );

  const effectiveFromError = effectiveFrom ? undefined : 'Chọn ngày bắt đầu áp dụng.';
  const effectiveToError =
    endMode !== 'UNTIL_DATE'
      ? undefined
      : !effectiveTo
        ? 'Chọn ngày kết thúc.'
        : effectiveFrom && effectiveTo < effectiveFrom
          ? 'Ngày kết thúc phải từ ngày bắt đầu trở đi.'
          : undefined;

  const problem =
    weekdays.length === 0
      ? 'Chọn ít nhất một ngày dạy.'
      : Object.keys(rangeErrors).length > 0
        ? 'Sửa khung giờ đang báo lỗi.'
        : serviceIds.length === 0
          ? 'Chọn ít nhất một dịch vụ.'
          : effectiveFromError || effectiveToError
            ? 'Kiểm tra lại thời gian áp dụng.'
            : conflicts.length > 0
              ? 'Lịch mới đang trùng lịch bạn đã có.'
              : undefined;

  const summary = problem ? '' : formatScheduleSummary(weekdays, ranges);
  const isBusy = isCreating || isSubmitting;

  /* --------------------------------- Actions -------------------------------- */

  const requestClose = () => {
    if (isBusy) return;
    if (confirmingDiscard) {
      setConfirmingDiscard(false);
      return;
    }
    if (isDirty) {
      setConfirmingDiscard(true);
      return;
    }
    onClose();
  };

  const toggleWeekday = (weekday: WeekdayEnum) =>
    setWeekdays((current) =>
      current.includes(weekday)
        ? current.filter((value) => value !== weekday)
        : ALL_WEEKDAYS.filter((value) => value === weekday || current.includes(value)),
    );

  const updateRange = (id: string, patch: Partial<Omit<TimeRange, 'id'>>) =>
    setRanges((current) =>
      current.map((range) => (range.id === id ? { ...range, ...patch } : range)),
    );

  const addRange = () =>
    setRanges((current) => [...current, { id: newRangeId(), ...nextDefaultRange(current) }]);

  const toggleService = (serviceId: string) =>
    setServiceIds((current) =>
      current.includes(serviceId)
        ? current.filter((id) => id !== serviceId)
        : [...current, serviceId],
    );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (problem || isBusy) return;
    setSubmitError(undefined);

    const ordered = [...ranges].sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
    const base = {
      weekdays,
      effectiveFrom,
      effectiveTo: effectiveToForApi.trim() || undefined,
      serviceIds,
      note: note.trim() || undefined,
    };

    if (isEdit && template) {
      await onSubmitUpdate(template.templateId, {
        ...base,
        startTime: `${ordered[0].start}:00`,
        endTime: `${ordered[0].end}:00`,
        expectedVersion: template.configVersion,
      });
      return;
    }

    // The create API takes one time range per request (with every selected weekday), so
    // ranges are created one after another and the first failure stops the batch.
    setIsCreating(true);
    const created: TimeRange[] = [];
    try {
      for (const range of ordered) {
        try {
          await onCreate({ ...base, startTime: `${range.start}:00`, endTime: `${range.end}:00` });
          created.push(range);
        } catch (reason) {
          const message = getUserFriendlyErrorMessage(reason, 'Vui lòng thử lại.');
          if (created.length > 0) {
            // Drop the created rows so a retry does not create them twice.
            setRanges((current) => current.filter((item) => !created.includes(item)));
            onPartialCreate();
            setSubmitError(
              `Đã tạo ${created.length}/${ordered.length} lịch. Lỗi ở ${formatDayGroup(weekdays)}, ${formatRange(range)}: ${message}`,
            );
          } else {
            setSubmitError(`Không thể tạo lịch hàng tuần: ${message}`);
          }
          return;
        }
      }
      await onCreated(summary);
    } finally {
      setIsCreating(false);
    }
  };

  /* --------------------------------- Render --------------------------------- */

  const title = isEdit ? 'Chỉnh sửa lịch hàng tuần' : 'Tạo lịch hàng tuần';
  const presets: Array<{ label: string; days: WeekdayEnum[] }> = [
    { label: 'Thứ 2 – Thứ 6', days: WORK_WEEK },
    { label: 'Cuối tuần', days: WEEKEND },
    { label: 'Cả tuần', days: ALL_WEEKDAYS },
  ];
  const isPresetActive = (days: WeekdayEnum[]) =>
    days.length === weekdays.length && days.every((day) => weekdays.includes(day));

  return (
    <Modal
      open={open}
      title={title}
      hideHeader
      onClose={requestClose}
      className="max-w-[640px] max-sm:h-dvh max-sm:max-h-dvh max-sm:rounded-none"
      overlayClassName="max-sm:p-0"
      contentClassName="p-0! sm:p-0! overflow-hidden! flex min-h-0 flex-col"
    >
      <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit} noValidate>
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-solid border-border-light px-6 py-5">
          <div className="min-w-0">
            <h2 className="m-0 text-lg font-bold tracking-tight text-text-main">{title}</h2>
            <p className="mt-1 mb-0 text-sm text-text-muted">
              Chọn ngày và giờ bạn rảnh. Mentee chỉ đặt được trong những khung giờ này.
            </p>
          </div>
          <button
            type="button"
            aria-label="Đóng"
            disabled={isBusy}
            onClick={requestClose}
            className={`-mr-2 grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-full border-none bg-transparent text-text-muted transition-colors hover:bg-surface-subtle hover:text-text-main disabled:cursor-not-allowed ${FOCUS_RING}`}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-[26px] overflow-y-auto px-6 py-6">
          {staleNotice && (
            <div
              className="rounded-xl border border-solid border-amber-200 bg-warning-soft p-3 text-sm font-medium text-amber-800"
              role="status"
            >
              {staleNotice}
            </div>
          )}

          {/* Ngày dạy */}
          <section className="flex flex-col gap-2.5">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className={GROUP_HEADING}>Ngày dạy</h3>
              <span className="text-xs text-text-muted">Chọn được nhiều ngày</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {presets.map((preset) => {
                const active = isPresetActive(preset.days);
                return (
                  <button
                    key={preset.label}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setWeekdays(preset.days)}
                    className={`h-8 cursor-pointer rounded-full border border-solid px-3 text-xs font-semibold transition-colors ${FOCUS_RING} ${active ? 'border-primary-border bg-primary-light text-primary' : 'border-border-color bg-white text-text-secondary hover:border-primary-border hover:bg-primary-light hover:text-primary'}`}
                  >
                    {preset.label}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setWeekdays([])}
                className={`h-8 cursor-pointer rounded-full border-none bg-transparent px-2 text-xs font-semibold text-text-muted hover:text-text-main ${FOCUS_RING}`}
              >
                Bỏ chọn
              </button>
            </div>
            <div
              role="group"
              aria-label="Ngày trong tuần"
              aria-describedby={weekdays.length === 0 ? `${baseId}-days-error` : undefined}
              className="grid grid-cols-7 gap-1.5 sm:gap-2"
            >
              {ALL_WEEKDAYS.map((weekday, index) => {
                const selected = weekdays.includes(weekday);
                return (
                  <button
                    key={weekday}
                    type="button"
                    aria-pressed={selected}
                    aria-label={WEEKDAY_LABELS[weekday]}
                    // Modal focuses [autofocus] on open, so focus starts on the first day toggle.
                    ref={index === 0 ? (node) => node?.setAttribute('autofocus', '') : undefined}
                    onClick={() => toggleWeekday(weekday)}
                    className={`h-12 min-w-0 cursor-pointer rounded-xl border border-solid text-sm font-bold transition-colors ${FOCUS_RING} ${selected ? 'border-primary bg-primary text-white hover:bg-primary-hover' : 'border-border-color bg-white text-text-main hover:border-primary-border hover:bg-primary-light'}`}
                  >
                    {WEEKDAY_SHORT_LABELS[weekday]}
                  </button>
                );
              })}
            </div>
            {weekdays.length === 0 && (
              <p id={`${baseId}-days-error`} className={ERROR_TEXT}>
                Chọn ít nhất một ngày.
              </p>
            )}
          </section>

          {/* Khung giờ */}
          <section className="flex flex-col gap-2.5">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className={GROUP_HEADING}>Khung giờ</h3>
              <span className="text-xs text-text-muted">Áp dụng cho mọi ngày đã chọn</span>
            </div>
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              {ranges.map((range, index) => {
                const error = rangeErrors[range.id];
                const minutes = rangeMinutes(range);
                const startId = `${baseId}-${range.id}-start`;
                const endId = `${baseId}-${range.id}-end`;
                const errorId = `${baseId}-${range.id}-error`;
                const fieldProps = {
                  'aria-invalid': Boolean(error) || undefined,
                  'aria-describedby': error ? errorId : undefined,
                  className: `${SELECT_CLASS} ${error ? 'border-danger' : 'border-border-color'}`,
                };
                return (
                  <li key={range.id} className="flex flex-col gap-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <label htmlFor={startId} className="sr-only">
                        Giờ bắt đầu khung {index + 1}
                      </label>
                      <select
                        id={startId}
                        value={range.start}
                        onChange={(event) => updateRange(range.id, { start: event.target.value })}
                        {...fieldProps}
                      >
                        {timeOptionsWith(range.start).map((time) => (
                          <option key={time} value={time}>
                            {time}
                          </option>
                        ))}
                      </select>
                      <span className="text-sm text-text-muted">đến</span>
                      <label htmlFor={endId} className="sr-only">
                        Giờ kết thúc khung {index + 1}
                      </label>
                      <select
                        id={endId}
                        value={range.end}
                        onChange={(event) => updateRange(range.id, { end: event.target.value })}
                        {...fieldProps}
                      >
                        {timeOptionsWith(range.end).map((time) => (
                          <option key={time} value={time}>
                            {time}
                          </option>
                        ))}
                      </select>
                      {minutes > 0 && (
                        <span className="rounded-full bg-primary-light px-2.5 py-1 text-xs font-semibold text-primary">
                          {formatDuration(minutes)}
                        </span>
                      )}
                      {ranges.length > 1 && (
                        <button
                          type="button"
                          aria-label="Xóa khung giờ"
                          onClick={() =>
                            setRanges((current) => current.filter((item) => item.id !== range.id))
                          }
                          className={`ml-auto grid h-11 w-11 cursor-pointer place-items-center rounded-xl border-none bg-transparent text-text-muted transition-colors hover:bg-danger-soft hover:text-danger ${FOCUS_RING}`}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                    {error && (
                      <p id={errorId} className={ERROR_TEXT}>
                        {error}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
            {/* The update API edits a single range, so extra ranges are create-only. */}
            {!isEdit && (
              <button
                type="button"
                onClick={addRange}
                className={`inline-flex min-h-11 w-fit cursor-pointer items-center gap-1.5 rounded-xl border-none bg-transparent px-1 text-sm font-semibold text-primary hover:text-primary-hover ${FOCUS_RING}`}
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Thêm khung giờ (ví dụ buổi tối)
              </button>
            )}
            {conflicts.length > 0 && (
              <div
                role="alert"
                className="flex flex-col gap-1 rounded-xl border border-solid border-red-200 bg-danger-soft px-4 py-3 text-sm text-danger"
              >
                {conflicts.slice(0, 3).map((conflict) => (
                  <p key={conflict.key} className="m-0">
                    Trùng với lịch {WEEKDAY_LABELS[conflict.weekday]}, {conflict.start} –{' '}
                    {conflict.end} bạn đã có. Đổi giờ, hoặc bỏ chọn{' '}
                    {WEEKDAY_LABELS[conflict.weekday]}.
                  </p>
                ))}
                {conflicts.length > 3 && (
                  <p className="m-0 font-medium">Và {conflicts.length - 3} lịch trùng khác.</p>
                )}
              </div>
            )}
          </section>

          {/* Dịch vụ */}
          <section className="flex flex-col gap-2.5">
            <h3 className={GROUP_HEADING}>Dịch vụ mentee được đặt</h3>
            {activeServices.length === 0 ? (
              <p className="m-0 rounded-xl border border-solid border-border-color bg-surface-subtle px-4 py-3 text-sm text-text-muted">
                Bạn chưa có dịch vụ 1:1 nào đang hoạt động.
              </p>
            ) : (
              <div className="overflow-hidden rounded-xl border border-solid border-border-color">
                {activeServices.map((service) => (
                  <label
                    key={service.serviceId}
                    className="flex min-h-12 cursor-pointer items-center gap-3 border-b border-solid border-border-light px-4 py-2.5 last:border-b-0 hover:bg-surface-subtle"
                  >
                    <input
                      type="checkbox"
                      checked={serviceIds.includes(service.serviceId)}
                      onChange={() => toggleService(service.serviceId)}
                      className="h-4 w-4 shrink-0 cursor-pointer accent-primary"
                    />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-text-main">
                      {service.title}
                    </span>
                    <span className="shrink-0 text-xs text-text-muted">
                      {servicePriceLabel(service)}
                    </span>
                  </label>
                ))}
              </div>
            )}
            {serviceIds.length === 0 && <p className={ERROR_TEXT}>Chọn ít nhất một dịch vụ.</p>}
          </section>

          {/* Thời gian áp dụng */}
          <section className="flex flex-col gap-2.5">
            <h3 className={GROUP_HEADING}>Thời gian áp dụng</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor={`${baseId}-from`}
                  className="text-xs font-medium text-text-secondary"
                >
                  Bắt đầu từ
                </label>
                <DateField
                  id={`${baseId}-from`}
                  value={effectiveFrom}
                  invalid={Boolean(effectiveFromError)}
                  onChange={setEffectiveFrom}
                />
                {effectiveFromError && <p className={ERROR_TEXT}>{effectiveFromError}</p>}
              </div>
              <div className="flex flex-col gap-2">
                <span id={`${baseId}-end-mode`} className="text-xs font-medium text-text-secondary">
                  Kết thúc
                </span>
                <div
                  role="radiogroup"
                  aria-labelledby={`${baseId}-end-mode`}
                  className="grid h-11 grid-cols-2 gap-1 rounded-xl bg-primary-light p-1"
                >
                  {(
                    [
                      { value: 'UNLIMITED', label: 'Không giới hạn' },
                      { value: 'UNTIL_DATE', label: 'Đến ngày' },
                    ] as const
                  ).map((option) => {
                    const checked = endMode === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={checked}
                        onClick={() => setEndMode(option.value)}
                        className={`cursor-pointer rounded-lg border-none text-xs font-semibold transition-colors ${FOCUS_RING} ${checked ? 'bg-white text-primary shadow-xs' : 'bg-transparent text-text-secondary hover:text-primary'}`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
                {endMode === 'UNTIL_DATE' && (
                  <>
                    <label htmlFor={`${baseId}-to`} className="sr-only">
                      Ngày kết thúc
                    </label>
                    <DateField
                      id={`${baseId}-to`}
                      value={effectiveTo}
                      min={effectiveFrom}
                      invalid={Boolean(effectiveToError)}
                      onChange={setEffectiveTo}
                    />
                    {effectiveToError && <p className={ERROR_TEXT}>{effectiveToError}</p>}
                  </>
                )}
              </div>
            </div>
          </section>

          {/* The template note is only returned by mentor endpoints; mentees never see it. */}
          <section className="flex flex-col gap-2.5">
            <label htmlFor={`${baseId}-note`} className={GROUP_HEADING}>
              Ghi chú riêng{' '}
              <span className="text-xs font-normal text-text-muted">(chỉ bạn thấy)</span>
            </label>
            <textarea
              id={`${baseId}-note`}
              rows={2}
              maxLength={NOTE_MAX_LENGTH}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Ví dụ: Lịch học kỳ Fall, nghỉ tuần thi"
              className={`min-h-11 w-full resize-y rounded-xl border border-solid border-border-color bg-white px-3 py-2.5 text-sm text-text-main placeholder:text-text-disabled hover:border-border-strong ${FOCUS_RING}`}
            />
          </section>
        </div>

        {submitError && (
          <div
            role="alert"
            className="mx-6 mb-3 shrink-0 rounded-xl border border-solid border-red-200 bg-danger-soft px-4 py-3 text-sm text-danger"
          >
            {submitError}
          </div>
        )}

        <footer className="flex shrink-0 flex-wrap items-center gap-3 border-t border-solid border-border-light bg-white px-6 py-4">
          {confirmingDiscard ? (
            <>
              <p className="m-0 min-w-0 flex-1 text-sm font-medium text-text-main" role="status">
                Bỏ các thay đổi chưa lưu?
              </p>
              <Button
                type="button"
                variant="outline"
                className="h-11! text-sm!"
                onClick={() => setConfirmingDiscard(false)}
              >
                Tiếp tục sửa
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="h-11! text-sm!"
                onClick={onClose}
              >
                Bỏ thay đổi
              </Button>
            </>
          ) : (
            <>
              <p
                className={`m-0 min-w-0 flex-1 text-sm ${problem ? 'font-medium text-danger' : 'text-text-secondary'}`}
                aria-live="polite"
              >
                {problem ?? summary}
              </p>
              <Button
                type="button"
                variant="outline"
                className="h-11! text-sm!"
                disabled={isBusy}
                onClick={requestClose}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                className="h-11! text-sm!"
                disabled={Boolean(problem)}
                loading={isBusy}
              >
                {isEdit ? 'Lưu thay đổi' : 'Tạo lịch hàng tuần'}
              </Button>
            </>
          )}
        </footer>
      </form>
    </Modal>
  );
}
