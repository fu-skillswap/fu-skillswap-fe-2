/**
 * @file couponForm.ts
 * @description Pure form model for the admin coupon create/edit screen: values, validation,
 * conversion to/from the API, Vietnam-time datetime helpers and the code generator.
 */

import type { CouponView, CreateCouponCommand, KnownCouponDiscountType } from '@/models/coupon';

export const CODE_PATTERN = /^[A-Z0-9]{4,20}$/;
export const TITLE_MAX = 80;
export const DESCRIPTION_MAX = 300;
/** Example session price used by the preview card. */
export const EXAMPLE_PRICE_SCOIN = 16500;

export type CouponTargetKind = 'mentor' | 'service';
export type CouponTarget = { kind: CouponTargetKind; id: string; label: string };

export type CouponFormValues = {
  code: string;
  title: string;
  description: string;
  discountType: KnownCouponDiscountType;
  /** Numeric fields stay strings so empty inputs are representable. */
  discountValue: string;
  maxDiscountScoin: string;
  minOrderValueScoin: string;
  startAt: string;
  endAt: string;
  quotaTotal: string;
  quotaPerUser: string;
  scope: 'all' | 'selected';
  targets: CouponTarget[];
};

export type CouponFormField =
  | 'code'
  | 'title'
  | 'description'
  | 'discountValue'
  | 'maxDiscountScoin'
  | 'minOrderValueScoin'
  | 'startAt'
  | 'endAt'
  | 'quotaTotal'
  | 'quotaPerUser'
  | 'targets';

export type CouponFormErrors = Partial<Record<CouponFormField, string>>;

/** Order used to focus the first invalid field. */
export const FIELD_ORDER: CouponFormField[] = [
  'code',
  'title',
  'description',
  'discountValue',
  'maxDiscountScoin',
  'minOrderValueScoin',
  'startAt',
  'endAt',
  'quotaTotal',
  'quotaPerUser',
  'targets',
];

export const fieldId = (field: CouponFormField) => `coupon-${field}`;

// --- Vietnam time (Asia/Ho_Chi_Minh, fixed +07:00, no DST) ---

const VN_OFFSET = '+07:00';
const vnParts = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Ho_Chi_Minh',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/** ISO instant → "YYYY-MM-DDTHH:mm" in Vietnam time, for `<input type="datetime-local">`. */
export function isoToVnInput(value: string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const parts = Object.fromEntries(vnParts.formatToParts(date).map((p) => [p.type, p.value]));
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

/** "YYYY-MM-DDTHH:mm" (Vietnam time) → "YYYY-MM-DDTHH:mm:00+07:00". */
export function vnInputToIso(value: string): string {
  return value ? `${value}:00${VN_OFFSET}` : '';
}

export function vnInputToTime(value: string): number | null {
  if (!value) return null;
  const time = Date.parse(vnInputToIso(value));
  return Number.isNaN(time) ? null : time;
}

/** Start of the next hour (create default) and +30 days. */
function defaultPeriod(now: number) {
  const start = new Date(now);
  start.setMinutes(0, 0, 0);
  start.setHours(start.getHours() + 1);
  const end = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);
  return { startAt: isoToVnInput(start.toISOString()), endAt: isoToVnInput(end.toISOString()) };
}

// --- Values ---

export function emptyCouponForm(now = Date.now()): CouponFormValues {
  return {
    code: '',
    title: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: '',
    maxDiscountScoin: '',
    minOrderValueScoin: '',
    ...defaultPeriod(now),
    quotaTotal: '',
    quotaPerUser: '1',
    scope: 'all',
    targets: [],
  };
}

const shortId = (id: string) => `${id.slice(0, 8)}…`;

export function couponToForm(coupon: CouponView): CouponFormValues {
  const mentorIds = coupon.applicableMentorIds ?? [];
  const serviceIds = coupon.applicableServiceIds ?? [];
  const toText = (value: number | null | undefined) => (value == null ? '' : String(value));
  return {
    code: coupon.code ?? '',
    title: coupon.title ?? '',
    description: coupon.description ?? '',
    // Unknown types fall back to the first known one; the raw value is shown in the heading note.
    discountType: coupon.discountType === 'FIXED_SCOIN' ? 'FIXED_SCOIN' : 'PERCENTAGE',
    discountValue: toText(coupon.discountValue),
    maxDiscountScoin: toText(coupon.maxDiscountScoin),
    minOrderValueScoin: toText(coupon.minOrderValueScoin),
    startAt: isoToVnInput(coupon.startAt),
    endAt: isoToVnInput(coupon.endAt),
    quotaTotal: toText(coupon.quotaTotal),
    quotaPerUser: toText(coupon.quotaPerUser),
    scope: mentorIds.length || serviceIds.length ? 'selected' : 'all',
    // Labels are replaced with mentor names once they load.
    targets: [
      ...mentorIds.map((id) => ({ kind: 'mentor' as const, id, label: shortId(id) })),
      // TODO(api): admin service lookup by id — service titles are unknown, show a short id.
      ...serviceIds.map((id) => ({ kind: 'service' as const, id, label: shortId(id) })),
    ],
  };
}

function toInt(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const number = Number(trimmed);
  return Number.isFinite(number) ? Math.trunc(number) : null;
}

export function formToCommand(values: CouponFormValues): CreateCouponCommand {
  const isPercent = values.discountType === 'PERCENTAGE';
  const selected = values.scope === 'selected';
  return {
    code: values.code.trim().toUpperCase(),
    title: values.title.trim(),
    description: values.description.trim() || null,
    discountType: values.discountType,
    discountValue: toInt(values.discountValue) ?? 0,
    maxDiscountScoin: isPercent ? toInt(values.maxDiscountScoin) : null,
    minOrderValueScoin: toInt(values.minOrderValueScoin),
    startAt: vnInputToIso(values.startAt),
    endAt: vnInputToIso(values.endAt),
    quotaTotal: toInt(values.quotaTotal),
    quotaPerUser: toInt(values.quotaPerUser),
    applicableMentorIds: selected
      ? values.targets.filter((t) => t.kind === 'mentor').map((t) => t.id)
      : [],
    applicableServiceIds: selected
      ? values.targets.filter((t) => t.kind === 'service').map((t) => t.id)
      : [],
  };
}

/** Comparable snapshot for unsaved-change detection (labels do not count as changes). */
export function formSnapshot(values: CouponFormValues) {
  return JSON.stringify({ ...values, targets: values.targets.map((t) => `${t.kind}:${t.id}`) });
}

// --- Validation ---

function isWholeNumber(value: string) {
  return /^\d+$/.test(value.trim());
}

export function validateCouponForm(
  values: CouponFormValues,
  { mode, now = Date.now() }: { mode: 'create' | 'edit'; now?: number },
): CouponFormErrors {
  const errors: CouponFormErrors = {};
  const code = values.code.trim();
  if (!code) errors.code = 'Nhập mã giảm giá.';
  else if (!CODE_PATTERN.test(code)) errors.code = 'Mã gồm 4–20 ký tự, chỉ chữ in hoa và số.';

  const title = values.title.trim();
  if (!title) errors.title = 'Nhập tên ưu đãi.';
  else if (title.length > TITLE_MAX) errors.title = `Tên ưu đãi tối đa ${TITLE_MAX} ký tự.`;

  if (values.description.trim().length > DESCRIPTION_MAX) {
    errors.description = `Mô tả tối đa ${DESCRIPTION_MAX} ký tự.`;
  }

  const discount = toInt(values.discountValue);
  if (values.discountType === 'PERCENTAGE') {
    if (!isWholeNumber(values.discountValue) || discount === null || discount < 1 || discount > 100)
      errors.discountValue = 'Mức giảm là số nguyên từ 1 đến 100.';
    const max = toInt(values.maxDiscountScoin);
    if (!values.maxDiscountScoin.trim()) errors.maxDiscountScoin = 'Nhập mức giảm tối đa.';
    else if (!isWholeNumber(values.maxDiscountScoin) || max === null || max < 1)
      errors.maxDiscountScoin = 'Giảm tối đa là số nguyên từ 1 trở lên.';
  } else if (!isWholeNumber(values.discountValue) || discount === null || discount < 1) {
    errors.discountValue = 'Số S-coins giảm là số nguyên từ 1 trở lên.';
  }

  if (values.minOrderValueScoin.trim()) {
    const min = toInt(values.minOrderValueScoin);
    if (!isWholeNumber(values.minOrderValueScoin) || min === null || min < 1)
      errors.minOrderValueScoin = 'Đơn tối thiểu là số nguyên từ 1 trở lên, hoặc để trống.';
  }

  const start = vnInputToTime(values.startAt);
  const end = vnInputToTime(values.endAt);
  if (start === null) errors.startAt = 'Chọn thời điểm bắt đầu.';
  if (end === null) errors.endAt = 'Chọn thời điểm kết thúc.';
  else if (start !== null && end <= start) errors.endAt = 'Kết thúc phải sau thời điểm bắt đầu.';
  else if (mode === 'create' && end <= now) errors.endAt = 'Thời điểm kết thúc phải ở tương lai.';

  const total = toInt(values.quotaTotal);
  if (
    values.quotaTotal.trim() &&
    (!isWholeNumber(values.quotaTotal) || total === null || total < 1)
  )
    errors.quotaTotal = 'Tổng số lượt là số nguyên từ 1 trở lên, hoặc để trống.';
  const perUser = toInt(values.quotaPerUser);
  if (!isWholeNumber(values.quotaPerUser) || perUser === null || perUser < 1)
    errors.quotaPerUser = 'Lượt cho mỗi mentee là số nguyên từ 1 trở lên.';
  else if (!errors.quotaTotal && total !== null && perUser > total)
    errors.quotaPerUser = 'Lượt cho mỗi mentee không được lớn hơn tổng số lượt.';

  if (values.scope === 'selected' && !values.targets.length) {
    errors.targets = 'Chọn ít nhất một mentor hoặc dịch vụ.';
  }
  return errors;
}

// --- Code generator ---

/** Unambiguous alphabet: no O/0/I/1. */
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateCouponCode(length = 8): string {
  const bytes = new Uint32Array(length);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(bytes);
  else for (let i = 0; i < length; i += 1) bytes[i] = Math.floor(Math.random() * 2 ** 32);
  return Array.from(bytes, (byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length]).join('');
}
