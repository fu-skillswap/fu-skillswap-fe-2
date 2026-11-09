/**
 * @file CouponPreview.tsx
 * @description "Mentee sẽ thấy" column: live ticket preview + a worked price example.
 */

import {
  capReachedAtScoin,
  computeCouponDiscount,
  couponBadgeText,
  formatScoin,
  withMenteeSurcharge,
} from '@/lib/coupon';
import type { CreateCouponCommand } from '@/models/coupon';
import { EXAMPLE_PRICE_SCOIN, vnInputToTime, type CouponFormValues } from '../couponForm';
import styles from '../AdminCouponFormView.module.css';

const dayFormatter = new Intl.DateTimeFormat('vi-VN', {
  timeZone: 'Asia/Ho_Chi_Minh',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

function scopeLine(values: CouponFormValues) {
  if (values.scope === 'all') return 'Dùng cho mọi mentor và dịch vụ';
  const mentors = values.targets.filter((t) => t.kind === 'mentor');
  const services = values.targets.filter((t) => t.kind === 'service').length;
  if (!mentors.length && !services) return 'Chưa chọn mentor hoặc dịch vụ';
  if (mentors.length === 1 && !services) return `Chỉ dùng với mentor ${mentors[0].label}`;
  const parts = [mentors.length && `${mentors.length} mentor`, services && `${services} dịch vụ`];
  return `Chỉ dùng với ${parts.filter(Boolean).join(' và ')}`;
}

export function CouponPreview({
  values,
  command,
}: {
  values: CouponFormValues;
  command: CreateCouponCommand;
}) {
  const hasValue = command.discountValue > 0;
  const isPercent = command.discountType === 'PERCENTAGE';
  const badge = hasValue ? couponBadgeText(command) : isPercent ? '-?%' : '-?';
  const capLine = isPercent
    ? command.maxDiscountScoin
      ? `Tối đa ${formatScoin(command.maxDiscountScoin)}`
      : 'Chưa đặt mức tối đa'
    : 'S-coins';
  const endTime = vnInputToTime(values.endAt);
  const expiry = endTime ? `Hết hạn ${dayFormatter.format(endTime)}` : 'Chưa chọn ngày hết hạn';
  const perUser = command.quotaPerUser && command.quotaPerUser > 0 ? command.quotaPerUser : 1;

  // Worked example: same helper as checkout preview.
  const payable = withMenteeSurcharge(EXAMPLE_PRICE_SCOIN);
  const discount = computeCouponDiscount(command, payable);
  const remaining = payable - discount;
  const capAt = capReachedAtScoin(command);
  const belowMinimum =
    hasValue && command.minOrderValueScoin != null && payable < command.minOrderValueScoin;

  let note: string;
  if (!hasValue) note = 'Nhập mức giảm để xem ví dụ.';
  else if (belowMinimum)
    note = `Buổi này chưa đạt đơn tối thiểu ${formatScoin(command.minOrderValueScoin)} S-coins nên không được giảm.`;
  else if (!isPercent) note = 'Giảm cố định, không phụ thuộc giá buổi.';
  else if (capAt === null) note = 'Chưa đặt mức giảm tối đa.';
  else if (payable >= capAt)
    note = `Đã chạm mức tối đa ${formatScoin(command.maxDiscountScoin)} S-coins (từ buổi ${formatScoin(capAt)} S-coins trở lên).`;
  else
    note = `Chạm mức tối đa ${formatScoin(command.maxDiscountScoin)} S-coins khi buổi từ ${formatScoin(capAt)} S-coins.`;

  return (
    <aside className={styles.preview} aria-label="Xem trước">
      <h2 className={styles.previewTitle}>Mentee sẽ thấy</h2>

      <div className={styles.ticket} aria-live="polite">
        <div className={styles.ticketStub}>
          <strong>{badge}</strong>
          <span>{capLine}</span>
        </div>
        <div className={styles.ticketBody}>
          <strong className={values.title.trim() ? '' : styles.placeholder}>
            {values.title.trim() || 'Tên ưu đãi'}
          </strong>
          <span>{scopeLine(values)}</span>
          <span>
            {expiry} · {perUser} lần/người
          </span>
          <code className={styles.ticketCode}>{command.code || 'MÃ CỦA BẠN'}</code>
        </div>
      </div>

      <section className={styles.example} aria-label="Ví dụ tính giá">
        <h3>Ví dụ với buổi {formatScoin(EXAMPLE_PRICE_SCOIN)} S-coins</h3>
        <dl>
          <div>
            <dt>Mentee trả (gồm phí)</dt>
            <dd>{formatScoin(payable)}</dd>
          </div>
          <div>
            <dt>Giảm</dt>
            <dd className={styles.discountValue}>{discount ? `−${formatScoin(discount)}` : '0'}</dd>
          </div>
          <div className={styles.exampleTotal}>
            <dt>Còn phải trả</dt>
            <dd>{formatScoin(remaining)} S-coins</dd>
          </div>
        </dl>
        <p>{note}</p>
      </section>
    </aside>
  );
}
