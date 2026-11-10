/**
 * @file ServiceEditor.tsx
 * @description Structured create/edit form for a mentor 1:1 service with cover upload and a live
 * "Mentee sẽ thấy" preview that reuses the profile ServiceCard.
 * Remount with a new `key` (e.g. the service version) to reload it from fresh data.
 */

'use client';

import { Button } from '@/components/ui/Button';
import { ImagePlus, Plus, RefreshCw, Save, Trash2, X } from 'lucide-react';
import { useId, useRef, type ClipboardEvent, type ReactNode } from 'react';
import { ServiceCard } from './ServiceCard';
import { ServiceCover } from './ServiceCover';
import {
  AUDIENCE_ITEM_MAX,
  AUDIENCE_MAX_COUNT,
  COVER_TYPES,
  INTRO_MAX,
  ITEMS_MAX,
  ITEM_MAX,
  OUTCOME_MAX,
  TITLE_MAX,
  counterTone,
  type CounterTone,
} from './serviceLimits';
import {
  useServiceEditor,
  type ServiceEditorDefaults,
  type ServiceEditorPayload,
} from './useServiceEditor';

const toneClass: Record<CounterTone, string> = {
  neutral: 'text-text-muted',
  warning: 'text-amber-700',
  error: 'text-red-700',
};

const inputBase =
  'w-full rounded-xl border border-solid bg-white px-3.5 text-sm text-text-main outline-none transition placeholder:text-text-disabled hover:border-primary-border focus:border-primary focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:bg-surface-subtle disabled:text-text-muted';

const inputClass = (invalid: boolean) =>
  `${inputBase} ${invalid ? 'border-red-500' : 'border-border-color'}`;

/**
 * `maxLength` stops typing at the limit, but browsers also truncate pasted text. Keep the whole
 * paste instead so the over-limit error is shown rather than content being cut silently.
 */
function keepOverflowOnPaste(
  event: ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>,
  max: number,
  apply: (value: string) => void,
) {
  const element = event.currentTarget;
  const text = event.clipboardData.getData('text');
  const start = element.selectionStart ?? element.value.length;
  const end = element.selectionEnd ?? element.value.length;
  const next = `${element.value.slice(0, start)}${text}${element.value.slice(end)}`;
  if (next.length <= max) return;
  event.preventDefault();
  apply(next);
}

function Counter({
  id,
  length,
  max,
  suffix,
}: {
  id: string;
  length: number;
  max: number;
  suffix?: string;
}) {
  return (
    <span
      id={id}
      className={`text-xs font-medium tabular-nums ${toneClass[counterTone(length, max)]}`}
    >
      {length}/{max}
      {suffix ? ` ${suffix}` : ''}
    </span>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  return (
    <p id={id} aria-live="polite" className="m-0 mt-1 min-h-0 text-xs font-medium text-red-700">
      {message}
    </p>
  );
}

function Field({
  id,
  label,
  required,
  counter,
  helper,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  counter?: ReactNode;
  helper?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-end justify-between gap-3">
        <label htmlFor={id} className="text-sm font-semibold text-text-main">
          {label}
          {required && <span className="text-red-700"> *</span>}
        </label>
        {counter}
      </div>
      {children}
      {helper && (
        <p id={`${id}-helper`} className="m-0 mt-1 text-xs leading-5 text-text-muted">
          {helper}
        </p>
      )}
    </div>
  );
}

interface ServiceEditorProps {
  mode: 'create' | 'edit';
  defaults: ServiceEditorDefaults;
  /** Create only: durations allowed by the platform. */
  allowedDurationMinutes?: number[];
  /** Extra note under the price field (e.g. active coupons on this service). */
  priceNote?: ReactNode;
  isSaving: boolean;
  submitLabel: string;
  onSubmit: (payload: ServiceEditorPayload) => void;
  onCancel: () => void;
}

export function ServiceEditor({
  mode,
  defaults,
  allowedDurationMinutes = [],
  priceNote,
  isSaving,
  submitLabel,
  onSubmit,
  onCancel,
}: ServiceEditorProps) {
  const editor = useServiceEditor(defaults, mode);
  const { values, lengths, errors, cover } = editor;
  const uid = useId();
  const ids = {
    cover: `${uid}-cover`,
    title: `${uid}-title`,
    intro: `${uid}-intro`,
    audience: `${uid}-audience`,
    items: `${uid}-items`,
    outcome: `${uid}-outcome`,
    price: `${uid}-price`,
    duration: `${uid}-duration`,
  };
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audienceFull = values.audience.length >= AUDIENCE_MAX_COUNT;
  const priceNumber = Number(values.priceInput);

  const describedBy = (id: string, ...extra: string[]) =>
    [`${id}-counter`, `${id}-helper`, `${id}-error`, ...extra].join(' ');

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const payload = editor.buildPayload();
    if (payload) onSubmit(payload);
  };

  return (
    <form
      onSubmit={submit}
      noValidate
      className="gap-6 min-[1200px]:grid min-[1200px]:grid-cols-[minmax(0,1fr)_380px]"
    >
      <div className="space-y-5">
        {/* 1. Cover */}
        <div>
          <p id={`${ids.cover}-label`} className="m-0 mb-1.5 text-sm font-semibold text-text-main">
            Ảnh bìa dịch vụ
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <div
              className="relative w-full max-w-[320px] shrink-0"
              role="group"
              aria-labelledby={`${ids.cover}-label`}
              aria-busy={cover.isUploading}
            >
              <ServiceCover title={values.title} coverImageUrl={cover.coverUrl} />
              {cover.isUploading && (
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-2xl bg-slate-900/55 text-white"
                  role="status"
                >
                  <span className="text-sm font-semibold">Đang tải ảnh… {cover.progress}%</span>
                  <span className="h-1.5 w-2/3 overflow-hidden rounded-full bg-white/30">
                    <span
                      className="block h-full rounded-full bg-white transition-all"
                      style={{ width: `${cover.progress}%` }}
                    />
                  </span>
                </div>
              )}
            </div>
            <div className="min-w-0 space-y-2">
              <input
                ref={fileInputRef}
                id={ids.cover}
                type="file"
                accept={COVER_TYPES.join(',')}
                className="sr-only"
                tabIndex={-1}
                aria-describedby={`${ids.cover}-helper ${ids.cover}-error`}
                onChange={(event) => {
                  cover.selectFile(event.target.files?.[0]);
                  event.target.value = '';
                }}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11"
                  leftIcon={<ImagePlus className="h-4 w-4" aria-hidden="true" />}
                  disabled={cover.isUploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {cover.coverUrl ? 'Đổi ảnh' : 'Tải ảnh lên'}
                </Button>
                {cover.coverUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-11 text-red-700 hover:text-red-800"
                    leftIcon={<Trash2 className="h-4 w-4" aria-hidden="true" />}
                    disabled={cover.isUploading}
                    onClick={cover.remove}
                  >
                    Gỡ ảnh
                  </Button>
                )}
              </div>
              <div
                id={`${ids.cover}-helper`}
                className="space-y-1 text-xs leading-5 text-text-muted"
              >
                <p className="m-0">
                  JPG, PNG hoặc WebP, tối đa 2 MB. Ảnh được cắt về khung 16:9, nên dùng từ 1200×675
                  px. Tránh chèn chữ, giá hay số điện thoại lên ảnh.
                </p>
                <p className="m-0">Không có ảnh, hồ sơ dùng ảnh bìa mặc định có tên dịch vụ.</p>
              </div>
              <div id={`${ids.cover}-error`} aria-live="polite">
                {cover.validationError && (
                  <p className="m-0 text-xs font-medium text-red-700">{cover.validationError}</p>
                )}
                {cover.status === 'error' && (
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="m-0 text-xs font-medium text-red-700">
                      Tải ảnh chưa được. Kiểm tra mạng rồi thử lại.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-11"
                      leftIcon={<RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />}
                      onClick={cover.retry}
                    >
                      Thử lại
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 2. Title */}
        <Field
          id={ids.title}
          label="Tên dịch vụ"
          required
          counter={<Counter id={`${ids.title}-counter`} length={lengths.title} max={TITLE_MAX} />}
          helper="Hiện tối đa 2 dòng trên hồ sơ."
        >
          <input
            id={ids.title}
            className={`${inputClass(Boolean(errors.title))} h-11`}
            value={values.title}
            maxLength={TITLE_MAX}
            aria-invalid={Boolean(errors.title)}
            aria-describedby={describedBy(ids.title)}
            onChange={(event) => editor.setTitle(event.target.value)}
            onPaste={(event) => keepOverflowOnPaste(event, TITLE_MAX, editor.setTitle)}
            placeholder="VD: Review CV xin thực tập OJT"
          />
          <FieldError id={`${ids.title}-error`} message={errors.title} />
        </Field>

        {/* 3. Intro */}
        <Field
          id={ids.intro}
          label="Giới thiệu ngắn"
          required
          counter={<Counter id={`${ids.intro}-counter`} length={lengths.intro} max={INTRO_MAX} />}
          helper="Một hai câu nói bạn giúp được gì."
        >
          <textarea
            id={ids.intro}
            rows={2}
            className={`${inputClass(Boolean(errors.intro))} resize-none py-2.5 leading-5`}
            value={values.intro}
            maxLength={INTRO_MAX}
            aria-invalid={Boolean(errors.intro)}
            aria-describedby={describedBy(ids.intro)}
            onChange={(event) => editor.setIntro(event.target.value)}
            onPaste={(event) => keepOverflowOnPaste(event, INTRO_MAX, editor.setIntro)}
          />
          <FieldError id={`${ids.intro}-error`} message={errors.intro} />
        </Field>

        {/* 4. Audience tags */}
        <Field
          id={ids.audience}
          label="Phù hợp cho"
          counter={
            <Counter
              id={`${ids.audience}-counter`}
              length={values.audience.length}
              max={AUDIENCE_MAX_COUNT}
              suffix="đối tượng"
            />
          }
        >
          <div
            className={`flex flex-wrap items-center gap-1.5 rounded-xl border border-solid bg-white p-1.5 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/20 ${
              errors.audience || editor.audienceDraftError
                ? 'border-red-500'
                : 'border-border-color'
            }`}
          >
            {values.audience.map((entry, index) => (
              <span
                key={`${index}-${entry}`}
                className="inline-flex max-w-full items-center gap-0.5 rounded-full bg-primary-light py-1 pl-3 pr-0.5 text-xs font-medium text-sky-800"
              >
                <span className="truncate">{entry}</span>
                <button
                  type="button"
                  className="-my-2 inline-flex h-11 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-sky-800 outline-none hover:text-red-700 focus-visible:ring-4 focus-visible:ring-primary/30"
                  aria-label={`Xoá ${entry}`}
                  onClick={() => editor.removeAudience(index)}
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </span>
            ))}
            <input
              id={ids.audience}
              className="h-9 min-w-40 flex-1 border-0 bg-transparent px-2 text-sm text-text-main outline-none placeholder:text-text-disabled disabled:cursor-not-allowed"
              value={values.audienceDraft}
              maxLength={AUDIENCE_ITEM_MAX}
              disabled={audienceFull}
              placeholder={audienceFull ? 'Đã đủ 3 đối tượng' : 'VD: Sinh viên năm 3, rồi Enter'}
              aria-invalid={Boolean(errors.audience || editor.audienceDraftError)}
              aria-describedby={`${ids.audience}-counter ${ids.audience}-error`}
              onChange={(event) => editor.changeAudienceDraft(event.target.value)}
              onPaste={(event) =>
                keepOverflowOnPaste(event, AUDIENCE_ITEM_MAX, editor.changeAudienceDraft)
              }
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  editor.commitAudienceDraft();
                } else if (
                  event.key === 'Backspace' &&
                  !values.audienceDraft &&
                  values.audience.length
                ) {
                  editor.removeAudience(values.audience.length - 1);
                }
              }}
              onBlur={editor.commitAudienceDraft}
            />
          </div>
          <FieldError
            id={`${ids.audience}-error`}
            message={editor.audienceDraftError ?? errors.audience}
          />
        </Field>

        {/* 5. Session items */}
        <fieldset className="m-0 min-w-0 border-0 p-0">
          <div className="mb-1.5 flex items-end justify-between gap-3">
            <legend className="float-left p-0 text-sm font-semibold text-text-main">
              Trong buổi tư vấn, bạn sẽ giúp mentee
            </legend>
            <Counter
              id={`${ids.items}-counter`}
              length={values.items.length}
              max={ITEMS_MAX}
              suffix="nội dung"
            />
          </div>
          <ol className="clear-both m-0 list-none space-y-2 p-0">
            {values.items.map((item, index) => {
              const itemId = `${ids.items}-${index}`;
              const itemError = errors.items[index];
              return (
                <li key={index}>
                  <div className="flex items-center gap-2">
                    <span className="w-5 shrink-0 text-right text-sm font-semibold text-text-muted">
                      {index + 1}.
                    </span>
                    <div className="relative min-w-0 flex-1">
                      <label htmlFor={itemId} className="sr-only">
                        Nội dung {index + 1}
                      </label>
                      <input
                        id={itemId}
                        className={`${inputClass(Boolean(itemError))} h-11 pr-16`}
                        value={item}
                        maxLength={ITEM_MAX}
                        aria-invalid={Boolean(itemError)}
                        aria-describedby={`${itemId}-counter ${itemId}-error ${ids.items}-helper`}
                        onChange={(event) => editor.changeItem(index, event.target.value)}
                        onPaste={(event) =>
                          keepOverflowOnPaste(event, ITEM_MAX, (value) =>
                            editor.changeItem(index, value),
                          )
                        }
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                        <Counter
                          id={`${itemId}-counter`}
                          length={lengths.items[index]}
                          max={ITEM_MAX}
                        />
                      </span>
                    </div>
                    {values.items.length > 2 && (
                      <button
                        type="button"
                        className="inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border-0 bg-transparent text-text-muted outline-none hover:bg-danger-soft hover:text-red-700 focus-visible:ring-4 focus-visible:ring-primary/20"
                        aria-label={`Xoá nội dung ${index + 1}`}
                        onClick={() => editor.removeItem(index)}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                  <div className="pl-7">
                    <FieldError id={`${itemId}-error`} message={itemError} />
                  </div>
                </li>
              );
            })}
          </ol>
          <FieldError id={`${ids.items}-error`} message={errors.itemsList} />
          <Button
            type="button"
            variant="ghost"
            className="mt-1 h-11 text-sky-700"
            leftIcon={<Plus className="h-4 w-4" aria-hidden="true" />}
            disabled={values.items.length >= ITEMS_MAX}
            onClick={editor.addItem}
          >
            Thêm nội dung
          </Button>
          <p id={`${ids.items}-helper`} className="m-0 mt-1 text-xs leading-5 text-text-muted">
            Hồ sơ hiện 3 nội dung đầu, mentee bấm “Xem thêm” để đọc hết, nên hãy xếp điều quan trọng
            nhất lên trên.
          </p>
        </fieldset>

        {/* 6. Outcome */}
        <Field
          id={ids.outcome}
          label="Kết quả sau buổi tư vấn"
          required
          counter={
            <Counter id={`${ids.outcome}-counter`} length={lengths.outcome} max={OUTCOME_MAX} />
          }
          helper="Mentee nhận được gì khi buổi kết thúc."
        >
          <textarea
            id={ids.outcome}
            rows={2}
            className={`${inputClass(Boolean(errors.outcome))} resize-none py-2.5 leading-5`}
            value={values.outcome}
            maxLength={OUTCOME_MAX}
            aria-invalid={Boolean(errors.outcome)}
            aria-describedby={describedBy(ids.outcome)}
            onChange={(event) => editor.setOutcome(event.target.value)}
            onPaste={(event) => keepOverflowOnPaste(event, OUTCOME_MAX, editor.setOutcome)}
          />
          <FieldError id={`${ids.outcome}-error`} message={errors.outcome} />
        </Field>

        {/* 7. Price, duration, toggles (unchanged behavior) */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label
              htmlFor={ids.price}
              className="mb-1.5 block text-sm font-semibold text-text-main"
            >
              Giá công khai (S-coins)
            </label>
            <input
              id={ids.price}
              type="number"
              min={0}
              inputMode="numeric"
              disabled={values.isFree}
              className={`${inputClass(Boolean(errors.price))} h-11`}
              value={values.priceInput}
              aria-invalid={Boolean(errors.price)}
              aria-describedby={`${ids.price}-error`}
              onChange={(event) => editor.setPriceInput(event.target.value)}
            />
            <FieldError id={`${ids.price}-error`} message={errors.price} />
            {priceNote}
          </div>
          {mode === 'create' ? (
            <div>
              <label
                htmlFor={ids.duration}
                className="mb-1.5 block text-sm font-semibold text-text-main"
              >
                Thời lượng tư vấn <span className="text-red-700">*</span>
              </label>
              <select
                id={ids.duration}
                className={`${inputClass(Boolean(errors.duration))} h-11`}
                value={values.durationMinutes ?? ''}
                aria-invalid={Boolean(errors.duration)}
                aria-describedby={`${ids.duration}-error`}
                onChange={(event) =>
                  editor.setDurationMinutes(
                    event.target.value ? Number(event.target.value) : undefined,
                  )
                }
              >
                <option value="">Chọn thời lượng</option>
                {allowedDurationMinutes.map((minutes) => (
                  <option key={minutes} value={minutes}>
                    {minutes} phút
                  </option>
                ))}
              </select>
              <FieldError id={`${ids.duration}-error`} message={errors.duration} />
            </div>
          ) : (
            <div className="rounded-xl border border-solid border-border-color bg-surface-subtle px-3.5 py-2.5">
              <span className="text-xs font-medium text-text-muted">Thời lượng cố định</span>
              <strong className="mt-0.5 block text-sm text-text-main">
                {values.durationMinutes} phút
              </strong>
              <small className="mt-0.5 block text-xs leading-4 text-text-muted">
                Thời lượng không thể đổi theo chính sách dịch vụ.
              </small>
            </div>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-solid border-border-color p-3 transition hover:border-primary-border hover:bg-primary-light/30 has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-primary/20">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 accent-primary"
              checked={values.isFree}
              onChange={(event) => editor.setIsFree(event.target.checked)}
            />
            <span>
              <strong className="block text-sm text-text-main">Dịch vụ miễn phí</strong>
              <small className="mt-0.5 block text-xs text-text-muted">
                Mentee không bị trừ S-coins.
              </small>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-solid border-border-color p-3 transition hover:border-primary-border hover:bg-primary-light/30 has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-primary/20">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 accent-primary"
              checked={values.maintainPostSessionChat}
              onChange={(event) => editor.setMaintainPostSessionChat(event.target.checked)}
            />
            <span>
              <strong className="block text-sm text-text-main">Duy trì chat sau buổi học</strong>
              <small className="mt-0.5 block text-xs text-text-muted">
                Cho phép tiếp tục trao đổi sau phiên.
              </small>
            </span>
          </label>
        </div>

        <div className="flex flex-col-reverse gap-2 border-0 border-t border-solid border-border-light pt-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="h-11"
            disabled={isSaving}
            onClick={onCancel}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            className="h-11"
            loading={isSaving}
            disabled={!editor.canSave}
            leftIcon={<Save className="h-4 w-4" aria-hidden="true" />}
          >
            {submitLabel}
          </Button>
        </div>
      </div>

      {/* Live preview */}
      <aside
        className="mt-6 min-[1200px]:sticky min-[1200px]:top-4 min-[1200px]:mt-0 min-[1200px]:self-start"
        aria-label="Xem trước thẻ dịch vụ"
      >
        <h3 className="m-0 mb-2 text-sm font-bold text-text-main">Mentee sẽ thấy</h3>
        <ServiceCard
          variant="compact"
          preview
          service={{
            title: values.title,
            description: editor.description,
            expectedOutcome: values.outcome,
            coverImageUrl: cover.coverUrl,
            durationMinutes: values.durationMinutes,
            isFree: values.isFree,
            priceScoin: Number.isFinite(priceNumber) ? priceNumber : null,
            maintainPostSessionChat: values.maintainPostSessionChat,
          }}
        />
        <p className="m-0 mt-2 text-xs leading-5 text-text-muted">
          Mọi mentor dùng cùng khung này: chữ dài hơn giới hạn sẽ không lưu được, nên không thẻ nào
          chiếm chỗ hơn thẻ nào.
        </p>
      </aside>
    </form>
  );
}
