/**
 * @file CouponHowItWorks.tsx
 * @description "Cơ chế hoạt động" tab of the coupon drawer: why applying a coupon helps, a worked
 * money-flow example from the mentor's own service and coupon (GET /api/me/coupons), cancellation rules and where to
 * check the payout. Every number comes from `couponMoneyFlow`; nothing is invented.
 */

'use client';

import {
  MENTEE_SURCHARGE_BPS,
  couponMoneyFlow,
  formatScoin,
  couponRule,
  pickMoneyFlowExample,
} from '@/lib/coupon';
import type {
  BookingCancellationRefundPolicy,
  MentorServiceManagementResponse,
} from '@/models/auth';
import type { UserCouponView } from '@/models/coupon';
import { ArrowDown, FileText, Ticket, UserPlus, Wallet } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import styles from './couponOffers.module.css';

function BenefitRow({
  icon,
  tone,
  lead,
  children,
}: {
  icon: ReactNode;
  tone: 'blue' | 'green';
  lead: string;
  children: ReactNode;
}) {
  return (
    <li className={styles.benefitRow}>
      <span
        className={`${styles.benefitIcon} ${tone === 'green' ? styles.benefitIconGreen : ''}`}
        aria-hidden="true"
      >
        {icon}
      </span>
      <p className={styles.benefitText}>
        <strong>{lead}</strong> {children}
      </p>
    </li>
  );
}

interface BarPart {
  value: number;
  label: string;
  className: string;
}

/** Stacked bar; segment width grows with its value, the second part keeps a readable minimum. */
function MoneyBar({ label, parts }: { label: string; parts: [BarPart, BarPart] }) {
  return (
    <div className={styles.moneyBar} role="img" aria-label={label}>
      {parts
        .filter((part) => part.value > 0)
        .map((part) => (
          <span
            key={part.className}
            className={`${styles.moneySegment} ${part.className}`}
            style={{ flexGrow: part.value }}
            aria-hidden="true"
          >
            <span className={styles.moneySegmentText}>{part.label}</span>
          </span>
        ))}
    </div>
  );
}

export function CouponHowItWorks({
  services,
  coupons,
  refundPolicy,
  walletHref,
  onShowOffers,
}: {
  services: MentorServiceManagementResponse[];
  coupons: UserCouponView[];
  /** From any of the mentor's bookings; null keeps the generic wording. */
  refundPolicy: BookingCancellationRefundPolicy | null;
  walletHref: string;
  onShowOffers: () => void;
}) {
  const example = pickMoneyFlowExample(services, coupons);
  const surchargePercent = MENTEE_SURCHARGE_BPS / 100;

  const flow = example
    ? couponMoneyFlow(example.service.publicPriceScoin ?? 0, MENTEE_SURCHARGE_BPS, example.coupon)
    : null;
  const s = (value: number) => `${formatScoin(value)} S-coins`;

  const earlyRefund =
    refundPolicy != null
      ? `Mentee được hoàn ${refundPolicy.earlyMenteeRefundPercent}% phần đã trả`
      : 'Mentee được hoàn phần đã trả';
  const lateRefund =
    refundPolicy != null ? ` Mentee được hoàn ${refundPolicy.lateMenteeRefundPercent}%.` : '';
  const cancelPercent = refundPolicy?.mentorCancellationRefundPercent ?? 100;
  const noShowPercent = refundPolicy?.mentorNoShowRefundPercent ?? cancelPercent;
  const mentorCancelRefund =
    cancelPercent === noShowPercent
      ? `Mentee được hoàn ${cancelPercent}%.`
      : `Mentee được hoàn ${cancelPercent}% khi bạn hủy, ${noShowPercent}% khi bạn vắng.`;

  return (
    <div className={styles.howBody}>
      <section className={styles.howCard} aria-labelledby="coupon-how-benefits">
        <h3 id="coupon-how-benefits" className={styles.howTitle}>
          Áp mã giúp gì cho bạn
        </h3>
        <ul className={styles.benefitList}>
          <BenefitRow
            icon={<Ticket className="h-4.5 w-4.5" />}
            tone="blue"
            lead="Dịch vụ của bạn nổi bật hơn."
          >
            Thẻ dịch vụ trên hồ sơ hiện nhãn giảm giá và giá sau giảm, nên mentee lướt qua dễ dừng
            lại.
          </BenefitRow>
          <BenefitRow
            icon={<UserPlus className="h-4.5 w-4.5" />}
            tone="blue"
            lead="Mentee mới dễ đặt buổi đầu."
          >
            Giá thấp hơn, có mã còn về 0 S-coins, nên người chưa quen bạn dám thử. Học thấy hợp, họ
            quay lại đặt tiếp.
          </BenefitRow>
          <BenefitRow
            icon={<Wallet className="h-4.5 w-4.5" />}
            tone="green"
            lead="Thu nhập không đổi."
          >
            Bạn nhận đủ giá dịch vụ như khi không có mã. SkillSwap trả phần giảm.
          </BenefitRow>
        </ul>
      </section>

      {example && flow && (
        <section className={styles.howCard} aria-labelledby="coupon-how-money">
          <h3 id="coupon-how-money" className={styles.howTitle}>
            Tiền đi như thế nào
          </h3>
          <p className={styles.howSub}>
            Ví dụ: {example.service.title} ({s(example.service.publicPriceScoin ?? 0)}), mã{' '}
            {example.coupon.code} giảm {couponRule(example.coupon)}.
          </p>

          <p className={styles.barLabel}>
            Giá buổi mentee thấy: {s(flow.priceWithSurcharge)} (gồm {surchargePercent}% phí nền
            tảng)
          </p>
          <MoneyBar
            label={`${formatScoin(flow.priceWithSurcharge)} S-coins gồm mentee trả ${formatScoin(flow.menteePays)} và SkillSwap tài trợ ${formatScoin(flow.discount)}`}
            parts={[
              {
                value: flow.menteePays,
                label: `Mentee trả ${formatScoin(flow.menteePays)}`,
                className: styles.segMentee,
              },
              {
                value: flow.discount,
                label: `SkillSwap ${formatScoin(flow.discount)}`,
                className: styles.segSponsor,
              },
            ]}
          />
          <ArrowDown className={styles.barArrow} aria-hidden="true" />
          <p className={styles.barLabel}>Chia ra sau buổi học</p>
          <MoneyBar
            label={`${formatScoin(flow.priceWithSurcharge)} S-coins gồm bạn nhận ${formatScoin(flow.mentorGets)} và phí nền tảng ${formatScoin(flow.platformFee)}`}
            parts={[
              {
                value: flow.mentorGets,
                label: `Bạn nhận ${formatScoin(flow.mentorGets)}`,
                className: styles.segMentor,
              },
              {
                value: flow.platformFee,
                label: `Phí ${formatScoin(flow.platformFee)}`,
                className: styles.segFee,
              },
            ]}
          />

          <ol className={styles.steps}>
            <li>
              <strong>Mentee thanh toán</strong> {s(flow.menteePays)} qua PayOS. SkillSwap ghi{' '}
              {s(flow.discount)} tài trợ vào cùng đơn.
            </li>
            <li>
              <strong>SkillSwap giữ tiền</strong> đến 24 giờ sau buổi học, để mentee xác nhận hoặc
              báo sự cố.
            </li>
            <li>
              <strong>{s(flow.mentorGets)} vào Ví S-coins của bạn.</strong> Lịch sử ví ghi rõ dòng
              &quot;SkillSwap tài trợ mã {example.coupon.code} · {s(flow.discount)}&quot;.
            </li>
            <li>
              <strong>Bạn rút về tài khoản</strong> như các buổi học khác.
            </li>
          </ol>
        </section>
      )}

      <section className={styles.howCard} aria-labelledby="coupon-how-cancel">
        <h3 id="coupon-how-cancel" className={styles.howTitle}>
          Khi buổi học bị hủy
        </h3>
        <dl className={styles.cancelGrid}>
          <dt>Mentee hủy sớm</dt>
          <dd>{earlyRefund}, mã được trả lại suất. Bạn không nhận tiền vì buổi không diễn ra.</dd>
          <dt>Mentee hủy muộn</dt>
          {/* TODO(api): confirm SkillSwap still covers the discount share on late cancel — if BE
              says no, change this copy. */}
          <dd>
            Bạn nhận phần chia theo Chính sách hủy &amp; hoàn tiền, tính trên giá dịch vụ gốc.
            {lateRefund}
          </dd>
          <dt>Bạn hủy hoặc vắng</dt>
          <dd>{mentorCancelRefund} Bạn không nhận tiền buổi đó.</dd>
        </dl>
      </section>

      <p className={styles.auditNote}>
        <FileText aria-hidden="true" />
        <span>
          Mỗi lượt dùng mã đều có mã giao dịch và được SkillSwap lưu lại để đối soát. Bạn xem lại
          trong{' '}
          <Link href={walletHref} className={styles.auditLink}>
            Ví S-coins › Lịch sử
          </Link>
          .
        </span>
      </p>

      <button
        type="button"
        className={`${styles.btn} ${styles.btnLarge} ${styles.btnPrimary} ${styles.btnBlock}`}
        onClick={onShowOffers}
      >
        Xem ưu đãi để áp
      </button>
    </div>
  );
}
