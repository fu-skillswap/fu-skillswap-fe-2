/**
 * @file AdminCouponFormView.tsx
 * @description Admin coupon create/edit screen: 4 fieldsets + live "Mentee sẽ thấy" preview.
 */

'use client';

import { AdminLoadingState } from '@/components/domain/admin/AdminLoadingState';
import { AdminTopbarActions } from '@/components/domain/admin/AdminTopbarActions';
import { isKnownCouponDiscountType, type KnownCouponDiscountType } from '@/models/coupon';
import { Shuffle, TriangleAlert } from 'lucide-react';
import Link from 'next/link';
import { useId, type ReactNode } from 'react';
import styles from './AdminCouponFormView.module.css';
import { CouponPreview } from './components/CouponPreview';
import { CouponTargetPicker } from './components/CouponTargetPicker';
import {
  DESCRIPTION_MAX,
  TITLE_MAX,
  fieldId,
  formToCommand,
  generateCouponCode,
  type CouponFormField,
  type CouponScope,
} from './couponForm';
import { useAdminCouponForm, type CouponFormMode } from './useAdminCouponForm';

const DISCOUNT_TYPE_OPTIONS: Array<{ value: KnownCouponDiscountType; label: string }> = [
  { value: 'PERCENTAGE', label: 'Giảm theo %' },
  { value: 'FIXED_SCOIN', label: 'Giảm số S-coins cố định' },
];

const SCOPE_OPTIONS: Array<{ value: CouponScope; label: string }> = [
  { value: 'all', label: 'Tất cả mentor' },
  { value: 'selected', label: 'Chọn mentor hoặc dịch vụ' },
];

/** Third scope card, shown only while `mentorOptInSupported` (TODO(api): mentorOptIn field). */
const MENTOR_OPT_IN_OPTION: { value: CouponScope; label: string } = {
  value: 'mentor-opt-in',
  label: 'Để mentor tự chọn dịch vụ áp mã',
};

/** Label + control + helper + inline error, wired with aria-describedby. */
function Field({
  field,
  label,
  helper,
  error,
  aside,
  children,
}: {
  field: CouponFormField;
  label: string;
  helper?: ReactNode;
  error?: string;
  aside?: ReactNode;
  children: (props: { id: string; describedBy: string; invalid: boolean }) => ReactNode;
}) {
  const id = fieldId(field);
  const describedBy = [helper && `${id}-help`, error && `${id}-error`].filter(Boolean).join(' ');
  return (
    <div className={styles.field}>
      <div className={styles.labelRow}>
        <label htmlFor={id}>{label}</label>
        {aside}
      </div>
      {children({ id, describedBy, invalid: Boolean(error) })}
      {helper && (
        <p id={`${id}-help`} className={styles.helper}>
          {helper}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function RadioCards<T extends string>({
  name,
  legend,
  options,
  value,
  onChange,
}: {
  name: string;
  legend: string;
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className={styles.radioCards} role="radiogroup" aria-label={legend}>
      {options.map((option) => (
        <label
          key={option.value}
          className={`${styles.radioCard} ${value === option.value ? styles.isSelected : ''}`}
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
          />
          <span>{option.label}</span>
        </label>
      ))}
    </div>
  );
}

export function AdminCouponFormView({
  mode,
  couponId,
}: {
  mode: CouponFormMode;
  couponId?: string;
}) {
  const form = useAdminCouponForm(mode, couponId);
  const { values, errors, setField, coupon } = form;
  const radioName = useId();
  const isCreate = mode === 'create';
  const isPercent = values.discountType === 'PERCENTAGE';
  const command = formToCommand(values, { mentorOptInSupported: form.mentorOptInSupported });
  const scopeOptions = form.mentorOptInSupported
    ? [...SCOPE_OPTIONS, MENTOR_OPT_IN_OPTION]
    : SCOPE_OPTIONS;
  const currentCode = coupon?.code ?? values.code;

  const breadcrumb = (
    <div className="admin-breadcrumb">
      Quản trị <span>›</span>{' '}
      <Link className={styles.crumb} href={form.couponsRoot}>
        Mã giảm giá
      </Link>{' '}
      <span>›</span>{' '}
      {isCreate ? (
        <b>Tạo mã mới</b>
      ) : (
        <>
          {coupon ? (
            <Link className={styles.crumb} href={`${form.couponsRoot}/${couponId}`}>
              {coupon.code}
            </Link>
          ) : (
            <span>…</span>
          )}{' '}
          <span>›</span> <b>Sửa</b>
        </>
      )}
    </div>
  );

  const shell = (content: ReactNode) => (
    <main className="admin-coupons-page">
      <header className="admin-topbar">
        {breadcrumb}
        <AdminTopbarActions />
      </header>
      <div className="admin-coupons-content">{content}</div>
    </main>
  );

  if (form.loadState === 'loading') {
    return shell(<AdminLoadingState message="Đang tải mã giảm giá…" />);
  }
  if (form.loadState === 'not-found' || form.loadState === 'error') {
    return shell(
      <section className={styles.stateCard} role="alert">
        <TriangleAlert aria-hidden="true" />
        <h1>
          {form.loadState === 'not-found'
            ? 'Không tìm thấy mã giảm giá'
            : 'Không tải được mã giảm giá'}
        </h1>
        <p>
          {form.loadState === 'not-found'
            ? 'Mã có thể đã bị xóa hoặc đường dẫn không đúng.'
            : form.loadError}
        </p>
        <div>
          {form.loadState === 'error' && (
            <button type="button" className="admin-button primary" onClick={form.reload}>
              Thử lại
            </button>
          )}
          <Link className="admin-button" href={form.couponsRoot}>
            Về danh sách mã
          </Link>
        </div>
      </section>,
    );
  }

  return shell(
    <>
      <section className="admin-page-heading">
        <div>
          <h1>{isCreate ? 'Tạo mã giảm giá' : `Sửa mã ${currentCode}`}</h1>
          <p>Mã hiện cho mentee ở bước thanh toán và cho mentor trên trang dịch vụ.</p>
        </div>
      </section>

      <div className={styles.layout}>
        <form
          className={styles.form}
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void form.submit();
          }}
        >
          <fieldset className={styles.card}>
            <legend>Thông tin mã</legend>
            <Field
              field="code"
              label="Mã nhập khi thanh toán"
              error={errors.code}
              helper={
                form.codeLocked
                  ? 'Mã đã có lượt dùng nên không đổi được.'
                  : '4–20 ký tự, chữ in hoa và số.'
              }
            >
              {({ id, describedBy, invalid }) => (
                <div className={styles.inline}>
                  <input
                    id={id}
                    className={`${styles.input} ${styles.codeInput}`}
                    value={values.code}
                    // TODO(api): confirm BE rule for editing a used coupon.
                    readOnly={form.codeLocked}
                    maxLength={20}
                    autoComplete="off"
                    spellCheck={false}
                    aria-invalid={invalid || undefined}
                    aria-describedby={describedBy}
                    onChange={(event) =>
                      setField('code', event.target.value.toUpperCase().replace(/\s+/g, ''))
                    }
                  />
                  {!form.codeLocked && (
                    <button
                      type="button"
                      className="admin-button"
                      onClick={() => setField('code', generateCouponCode())}
                    >
                      <Shuffle aria-hidden="true" />
                      Tạo ngẫu nhiên
                    </button>
                  )}
                </div>
              )}
            </Field>
            <Field
              field="title"
              label="Tên ưu đãi"
              error={errors.title}
              helper="Mentee và mentor thấy tên này."
            >
              {({ id, describedBy, invalid }) => (
                <input
                  id={id}
                  className={styles.input}
                  value={values.title}
                  maxLength={TITLE_MAX}
                  required
                  aria-invalid={invalid || undefined}
                  aria-describedby={describedBy}
                  onChange={(event) => setField('title', event.target.value)}
                />
              )}
            </Field>
            <Field
              field="description"
              label="Mô tả cho mentee"
              error={errors.description}
              aside={
                <span className={styles.counter} aria-live="polite">
                  {values.description.length}/{DESCRIPTION_MAX}
                </span>
              }
            >
              {({ id, describedBy, invalid }) => (
                <textarea
                  id={id}
                  className={styles.textarea}
                  value={values.description}
                  maxLength={DESCRIPTION_MAX}
                  rows={3}
                  aria-invalid={invalid || undefined}
                  aria-describedby={describedBy || undefined}
                  onChange={(event) => setField('description', event.target.value)}
                />
              )}
            </Field>
          </fieldset>

          <fieldset className={styles.card}>
            <legend>Mức giảm</legend>
            {coupon && !isKnownCouponDiscountType(coupon.discountType) && (
              <p className={styles.notice}>
                Loại giảm hiện tại của mã là “{coupon.discountType}”. Chọn lại loại giảm trước khi
                lưu.
              </p>
            )}
            <RadioCards
              name={`${radioName}-type`}
              legend="Loại giảm"
              options={DISCOUNT_TYPE_OPTIONS}
              value={values.discountType}
              onChange={(value) => setField('discountType', value)}
            />
            <div className={styles.grid}>
              <Field
                field="discountValue"
                label={isPercent ? 'Mức giảm (%)' : 'Số S-coins giảm'}
                error={errors.discountValue}
              >
                {({ id, describedBy, invalid }) => (
                  <input
                    id={id}
                    className={styles.input}
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={isPercent ? 100 : undefined}
                    step={1}
                    value={values.discountValue}
                    aria-invalid={invalid || undefined}
                    aria-describedby={describedBy || undefined}
                    onChange={(event) => setField('discountValue', event.target.value)}
                  />
                )}
              </Field>
              {isPercent && (
                <Field
                  field="maxDiscountScoin"
                  label="Giảm tối đa (S-coins)"
                  error={errors.maxDiscountScoin}
                >
                  {({ id, describedBy, invalid }) => (
                    <input
                      id={id}
                      className={styles.input}
                      type="number"
                      inputMode="numeric"
                      min={1}
                      step={1}
                      value={values.maxDiscountScoin}
                      aria-invalid={invalid || undefined}
                      aria-describedby={describedBy || undefined}
                      onChange={(event) => setField('maxDiscountScoin', event.target.value)}
                    />
                  )}
                </Field>
              )}
              <Field
                field="minOrderValueScoin"
                label="Đơn tối thiểu (S-coins)"
                error={errors.minOrderValueScoin}
              >
                {({ id, describedBy, invalid }) => (
                  <input
                    id={id}
                    className={styles.input}
                    type="number"
                    inputMode="numeric"
                    min={1}
                    step={1}
                    placeholder="Không yêu cầu"
                    value={values.minOrderValueScoin}
                    aria-invalid={invalid || undefined}
                    aria-describedby={describedBy || undefined}
                    onChange={(event) => setField('minOrderValueScoin', event.target.value)}
                  />
                )}
              </Field>
            </div>
            <p className={styles.helper}>Tính trên giá mentee trả, đã gồm phí nền tảng.</p>
          </fieldset>

          <fieldset className={styles.card}>
            <legend>Thời gian và lượt dùng</legend>
            <div className={styles.grid}>
              {(['startAt', 'endAt'] as const).map((field) => (
                <Field
                  key={field}
                  field={field}
                  label={field === 'startAt' ? 'Bắt đầu' : 'Kết thúc'}
                  error={errors[field]}
                >
                  {({ id, describedBy, invalid }) => (
                    <input
                      id={id}
                      className={styles.input}
                      type="datetime-local"
                      value={values[field]}
                      aria-invalid={invalid || undefined}
                      aria-describedby={describedBy || undefined}
                      onChange={(event) => setField(field, event.target.value)}
                    />
                  )}
                </Field>
              ))}
              <Field field="quotaTotal" label="Tổng số lượt" error={errors.quotaTotal}>
                {({ id, describedBy, invalid }) => (
                  <input
                    id={id}
                    className={styles.input}
                    type="number"
                    inputMode="numeric"
                    min={1}
                    step={1}
                    placeholder="Không giới hạn"
                    value={values.quotaTotal}
                    aria-invalid={invalid || undefined}
                    aria-describedby={describedBy || undefined}
                    onChange={(event) => setField('quotaTotal', event.target.value)}
                  />
                )}
              </Field>
              <Field field="quotaPerUser" label="Lượt cho mỗi mentee" error={errors.quotaPerUser}>
                {({ id, describedBy, invalid }) => (
                  <input
                    id={id}
                    className={styles.input}
                    type="number"
                    inputMode="numeric"
                    min={1}
                    step={1}
                    value={values.quotaPerUser}
                    aria-invalid={invalid || undefined}
                    aria-describedby={describedBy || undefined}
                    onChange={(event) => setField('quotaPerUser', event.target.value)}
                  />
                )}
              </Field>
            </div>
            <p className={styles.helper}>Giờ Việt Nam (GMT+7).</p>
          </fieldset>

          <fieldset className={styles.card}>
            <legend>Áp dụng cho</legend>
            <RadioCards
              name={`${radioName}-scope`}
              legend="Phạm vi áp dụng"
              options={scopeOptions}
              value={values.scope}
              onChange={(value) => setField('scope', value)}
            />
            {values.scope === 'mentor-opt-in' && (
              <p className={styles.helper}>
                Mã hiện trong mục &quot;Ưu đãi SkillSwap tài trợ&quot; của mọi mentor, mentor tự
                quyết áp cho dịch vụ nào.
              </p>
            )}
            {values.scope === 'selected' && (
              <Field
                field="targets"
                label="Mentor hoặc dịch vụ"
                error={errors.targets}
                helper="Chọn mentor: dùng được cho mọi dịch vụ của mentor đó. Chọn dịch vụ: chỉ dịch vụ ấy."
              >
                {({ id, describedBy, invalid }) => (
                  <CouponTargetPicker
                    inputId={id}
                    targets={values.targets}
                    invalid={invalid}
                    describedBy={describedBy}
                    onAdd={form.addTarget}
                    onRemove={form.removeTarget}
                  />
                )}
              </Field>
            )}
          </fieldset>

          {form.formError && (
            <p className={styles.formError} role="alert">
              <TriangleAlert aria-hidden="true" />
              {form.formError}
            </p>
          )}

          <div className={styles.footer}>
            {isCreate && (
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={form.activateNow}
                  onChange={(event) => form.setActivateNow(event.target.checked)}
                />
                Bật mã ngay sau khi tạo
              </label>
            )}
            <div className={styles.footerActions}>
              <button
                type="button"
                className="admin-button"
                onClick={() => void form.cancel()}
                disabled={form.submitting}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="admin-button primary"
                disabled={form.submitting}
                aria-busy={form.submitting || undefined}
              >
                {form.submitting && <span className={styles.spinner} aria-hidden="true" />}
                {form.submitting
                  ? isCreate
                    ? 'Đang tạo…'
                    : 'Đang lưu…'
                  : isCreate
                    ? 'Tạo mã'
                    : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </form>

        <CouponPreview values={values} command={command} />
      </div>
    </>,
  );
}
