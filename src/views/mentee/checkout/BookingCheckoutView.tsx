/**
 * @file BookingCheckoutView.tsx
 * @description "Xác nhận thanh toán": the mentee reviews the session, applies a coupon, sees the
 * exact amount and key terms, and gives explicit consent before being sent to PayOS
 * (Luật Thương mại điện tử 2025 — 122/2025/QH15).
 */

'use client';

import { PLATFORM_OPERATOR, SCOIN_TO_VND } from '@/constants/legal';
import { describeDiscount, formatScoin, couponBadgeText } from '@/lib/coupon';
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CalendarCheck,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  LoaderCircle,
  Lock,
  MessageSquareWarning,
  ReceiptText,
  ShieldCheck,
  Video,
} from 'lucide-react';
import Link from 'next/link';
import { useId, useState, type ReactNode } from 'react';
import { BookingCardTop } from '../my-bookings/components/BookingCard';
import {
  getBookingStatusConfig,
  getMentorName,
  getPlatformLabel,
  formatDayMonth,
  toDate,
} from '../my-bookings/bookingStatusConfig';
import styles from './BookingCheckoutView.module.css';
import { buildRefundTimeline, formatWhen } from './checkout.helpers';
import { COUPON_CARD_ID, useBookingCheckout } from './useBookingCheckout';

const STEPS = ['Kiểm tra & áp mã', 'Thanh toán qua PayOS', 'Giữ chỗ thành công'];
const REFUND_SECTION_ID = 'checkout-refund';

function Steps() {
  return (
    <ol className={styles.steps} aria-label="Các bước thanh toán">
      {STEPS.map((label, index) => (
        <li
          key={label}
          className={index === 0 ? styles.stepCurrent : undefined}
          aria-current={index === 0 ? 'step' : undefined}
        >
          <span className={styles.stepNumber} aria-hidden="true">
            {index + 1}
          </span>
          {label}
        </li>
      ))}
    </ol>
  );
}

function InfoRow({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <li className={styles.infoRow}>
      <span className={styles.infoIcon} aria-hidden="true">
        {icon}
      </span>
      <div>
        <h3>{title}</h3>
        <p>{children}</p>
      </div>
    </li>
  );
}

function CopyEmail({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <span className={styles.emailRow}>
      <span className={styles.email}>{email}</span>
      <button
        type="button"
        className={styles.copyButton}
        onClick={() => {
          void navigator.clipboard?.writeText(email).then(() => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
          });
        }}
      >
        {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
        {copied ? 'Đã chép' : 'Chép email'}
      </button>
    </span>
  );
}

export function BookingCheckoutView({ locale, bookingId }: { locale: string; bookingId: string }) {
  const checkout = useBookingCheckout(locale, bookingId);
  const { booking, preview } = checkout;
  const couponInputId = useId();
  const consentHelpId = useId();
  const privacyHref = `/${locale}/chinh-sach-bao-mat`;
  // TODO(legal): route — no "Điều khoản sử dụng" page yet; links to the privacy policy for now.
  const termsHref = privacyHref;

  const header = (
    <header className={styles.header}>
      <div>
        <Link className={styles.back} href={checkout.bookingsHref}>
          <ArrowLeft aria-hidden="true" />
          Quay lại Booking của tôi
        </Link>
        <h1 className={styles.title}>Xác nhận thanh toán</h1>
      </div>
      <Steps />
    </header>
  );

  if (checkout.loadState === 'loading') {
    return (
      <section className={styles.page} aria-busy="true">
        {header}
        <div className={styles.skeleton} aria-hidden="true" />
        <span className={styles.srOnly} role="status">
          Đang tải lịch hẹn…
        </span>
      </section>
    );
  }

  if (checkout.loadState !== 'ready' || !booking) {
    const notFound = checkout.loadState === 'not-found';
    return (
      <section className={styles.page}>
        {header}
        <div className={styles.notice} role="alert">
          <AlertTriangle aria-hidden="true" />
          <div>
            <h2>{notFound ? 'Không tìm thấy lịch hẹn' : 'Không tải được lịch hẹn'}</h2>
            <p>
              {notFound
                ? 'Lịch hẹn không tồn tại hoặc không thuộc tài khoản của bạn.'
                : checkout.loadError}
            </p>
            <div className={styles.noticeActions}>
              {!notFound && (
                <button type="button" className={styles.btnPrimary} onClick={checkout.reload}>
                  Thử lại
                </button>
              )}
              <Link className={styles.btnOutline} href={checkout.bookingsHref}>
                Về Booking của tôi
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!booking.canPay) {
    const status = getBookingStatusConfig(booking);
    return (
      <section className={styles.page}>
        {header}
        <div className={styles.notice} role="status">
          <CalendarCheck aria-hidden="true" />
          <div>
            <h2>Lịch hẹn này không cần thanh toán lúc này</h2>
            <p>
              Trạng thái hiện tại: <strong>{status.label}</strong>. Xem chi tiết và bước tiếp theo
              trong Booking của tôi.
            </p>
            <div className={styles.noticeActions}>
              <Link className={styles.btnPrimary} href={checkout.bookingsHref}>
                Về Booking của tôi
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const mentor = getMentorName(booking);
  const platform = getPlatformLabel(booking) ?? 'nền tảng họp trực tuyến';
  const start = toDate(booking.selectedStartTime);
  const end = toDate(booking.selectedEndTime);
  const minutes =
    booking.serviceDurationSnapshot ||
    (start && end ? Math.round((end.getTime() - start.getTime()) / 60000) : 0);
  const timeline = buildRefundTimeline(booking);

  // Summary numbers — always from the latest preview response.
  const price = preview ? (preview.priceBeforeDiscountScoin ?? preview.priceScoin) : 0;
  const couponDiscount = preview?.couponDiscountScoin ?? 0;
  const campaign = preview?.campaignCreditAppliedScoin ?? 0;
  const userCredit = preview?.userCreditAppliedScoin ?? 0;
  const payable = preview?.estimatedFinalPayableScoin ?? 0;
  const saved = couponDiscount + campaign;
  const barTotal = Math.max(price, payable + couponDiscount + campaign + userCredit, 1);
  const deadline = toDate(preview?.paymentDeadlineAt ?? booking.actionDeadlineAt);
  const paying = checkout.payState !== 'idle';
  const payDisabled = !checkout.consent || paying || !preview || checkout.previewLoading;
  const payLabel = paying
    ? 'Đang chuyển sang PayOS…'
    : payable === 0
      ? 'Xác nhận dùng S-coins'
      : `Thanh toán ${formatScoin(payable)} S-coins`;
  const appliedText = checkout.appliedCoupon
    ? describeDiscount(checkout.appliedCoupon)
    : `Giảm ${formatScoin(couponDiscount)} S-coins`;

  const payButton = (className: string, describedBy?: string) => (
    <button
      type="button"
      className={className}
      disabled={payDisabled}
      aria-disabled={payDisabled || undefined}
      aria-busy={paying || undefined}
      aria-describedby={describedBy}
      onClick={() => void checkout.pay()}
    >
      {paying && <LoaderCircle className={styles.spin} aria-hidden="true" />}
      {payLabel}
    </button>
  );

  return (
    <section className={`${styles.page} ${styles.withBottomBar}`}>
      {header}

      <p className={styles.srOnly} aria-live="polite" role="status">
        {checkout.announcement}
      </p>

      <div className={styles.layout}>
        <div className={styles.main}>
          {/* a. Session */}
          <section className={styles.card} aria-labelledby="checkout-session">
            <h2 id="checkout-session" className={styles.srOnly}>
              Buổi học
            </h2>
            <BookingCardTop booking={booking} locale={locale} headingLevel="h3" />
          </section>

          {/* b. Coupon */}
          <section
            className={styles.card}
            id={COUPON_CARD_ID}
            aria-labelledby="checkout-coupon-title"
          >
            <div className={styles.cardHead}>
              <h2 id="checkout-coupon-title">Mã giảm giá</h2>
              <p>Mỗi buổi dùng được 1 mã.</p>
            </div>

            {checkout.appliedCode ? (
              <div className={styles.applied}>
                <CheckCircle2 aria-hidden="true" />
                <div>
                  <strong className={styles.appliedCode}>{checkout.appliedCode}</strong>
                  <span>{appliedText} đã được áp dụng</span>
                </div>
                <button
                  type="button"
                  className={styles.textButton}
                  disabled={checkout.previewLoading || paying}
                  onClick={() => void checkout.removeCoupon()}
                >
                  Bỏ mã
                </button>
              </div>
            ) : (
              <form
                className={styles.couponForm}
                noValidate
                onSubmit={(event) => {
                  event.preventDefault();
                  void checkout.applyCoupon();
                }}
              >
                <label htmlFor={couponInputId}>Nhập mã</label>
                <div className={styles.couponRow}>
                  <input
                    id={couponInputId}
                    className={`${styles.couponInput} ${checkout.couponError ? styles.isInvalid : ''}`}
                    value={checkout.couponInput}
                    placeholder="VD: CHAOK19"
                    autoComplete="off"
                    spellCheck={false}
                    maxLength={20}
                    aria-invalid={Boolean(checkout.couponError) || undefined}
                    aria-describedby={checkout.couponError ? `${couponInputId}-error` : undefined}
                    onChange={(event) => checkout.setCouponInput(event.target.value)}
                  />
                  <button
                    type="submit"
                    className={styles.btnOutline}
                    disabled={!checkout.couponInput.trim() || checkout.previewLoading || paying}
                  >
                    {checkout.previewLoading && checkout.couponInput && (
                      <LoaderCircle className={styles.spin} aria-hidden="true" />
                    )}
                    Áp dụng
                  </button>
                </div>
              </form>
            )}
            {checkout.couponError && (
              <p id={`${couponInputId}-error`} className={styles.fieldError} role="alert">
                {checkout.couponError}
              </p>
            )}

            {checkout.suggestions && !checkout.appliedCode && (
              <ul className={styles.suggestions} aria-label="Mã bạn có thể dùng">
                {checkout.suggestions.map((coupon) => {
                  const end = toDate(coupon.endAt);
                  const cap =
                    coupon.discountType === 'PERCENTAGE' && coupon.maxDiscountScoin
                      ? `Tối đa ${formatScoin(coupon.maxDiscountScoin)} S-coins`
                      : describeDiscount(coupon);
                  return (
                    <li key={coupon.id}>
                      <button
                        type="button"
                        className={styles.suggestion}
                        disabled={!coupon.usable || checkout.previewLoading || paying}
                        onClick={() => void checkout.applyCoupon(coupon.code)}
                      >
                        <span className={styles.suggestionBadge}>{couponBadgeText(coupon)}</span>
                        <span className={styles.suggestionText}>
                          <strong>
                            {coupon.title} · {coupon.code}
                          </strong>
                          <small>
                            {coupon.usable
                              ? `${cap}${end ? ` · hết hạn ${formatDayMonth(end)}` : ''}`
                              : coupon.reasonIfNotUsable || 'Không dùng được cho buổi này'}
                          </small>
                        </span>
                        {coupon.usable && <span className={styles.suggestionAction}>Dùng mã</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* c. Refund timeline */}
          <section
            className={styles.card}
            id={REFUND_SECTION_ID}
            aria-labelledby="checkout-refund-title"
          >
            <div className={styles.cardHead}>
              <h2 id="checkout-refund-title">Nếu bạn cần hủy</h2>
            </div>
            {timeline ? (
              <>
                <div className={styles.timeline} role="img" aria-label={timeline.ariaLabel}>
                  {timeline.segments.map((segment) => (
                    <div
                      key={segment.key}
                      className={`${styles.segment} ${styles[segment.key]} ${segment.passed ? styles.passed : ''}`}
                    >
                      <span className={styles.segmentBar} />
                      <strong>{segment.label}</strong>
                      <small>{segment.caption}</small>
                    </div>
                  ))}
                </div>
                <p className={styles.goodNote}>
                  <ShieldCheck aria-hidden="true" />
                  Mentor hủy hoặc không vào buổi học: bạn được hoàn {timeline.mentorRefundPercent}%.
                </p>
              </>
            ) : (
              // TODO(legal): route — no standalone refund policy page yet.
              <Link className={styles.textLink} href={privacyHref}>
                Xem Chính sách hủy &amp; hoàn tiền
              </Link>
            )}
          </section>

          {/* d. Key terms */}
          <section className={styles.card} aria-labelledby="checkout-terms-title">
            <div className={styles.cardHead}>
              <h2 id="checkout-terms-title">Điều bạn cần biết trước khi thanh toán</h2>
            </div>
            <ul className={styles.infoList}>
              <InfoRow icon={<Video />} title="Cách buổi học diễn ra">
                Buổi 1:1 với {mentor} qua {platform}
                {minutes > 0 ? `, ${minutes} phút` : ''}. Nút vào phòng hiện trong Booking của tôi
                ngay trước giờ học.
              </InfoRow>
              <InfoRow icon={<ReceiptText />} title="Giá và các khoản phải trả">
                Giá đã gồm phí nền tảng. Không có phí ẩn hay thuế cộng thêm.
                {SCOIN_TO_VND
                  ? ` PayOS thu bằng VND theo tỷ giá 1 S-coins = ${formatScoin(SCOIN_TO_VND)} đồng, số tiền VND hiện trên trang PayOS trước khi bạn trả.`
                  : ' Số tiền VND hiện trên trang PayOS trước khi bạn trả.'}
              </InfoRow>
              <InfoRow icon={<Clock />} title="Sau buổi học">
                Bạn có 24 giờ để xác nhận đã học hoặc báo sự cố. Quá 24 giờ, hệ thống tự xác nhận và
                chuyển S-coins cho mentor.
              </InfoRow>
              <InfoRow icon={<MessageSquareWarning />} title="Khiếu nại">
                Bấm &quot;Báo sự cố&quot; trong Booking của tôi hoặc gửi email tới{' '}
                <CopyEmail email={PLATFORM_OPERATOR.email} />. Mentor có 24 giờ để phản hồi, sau đó
                SkillSwap ra quyết định trong 48 giờ.
              </InfoRow>
              <InfoRow icon={<Lock />} title="Thông tin cá nhân">
                Mentor thấy tên hiển thị và lời nhắn của bạn để chuẩn bị buổi học. Thông tin thanh
                toán do PayOS xử lý, SkillSwap không lưu số thẻ.{' '}
                <Link className={styles.textLink} href={privacyHref}>
                  Xem Chính sách bảo mật
                </Link>
                .
              </InfoRow>
              <InfoRow icon={<Building2 />} title="Đơn vị cung cấp nền tảng">
                {/* TODO(legal): fill PLATFORM_OPERATOR in src/constants/legal.ts before launch. */}
                {PLATFORM_OPERATOR.operatorName} · Mã số thuế {PLATFORM_OPERATOR.taxCode} ·{' '}
                {PLATFORM_OPERATOR.address} · {PLATFORM_OPERATOR.email}
              </InfoRow>
            </ul>
          </section>
        </div>

        {/* Summary */}
        <aside className={styles.summary} aria-labelledby="checkout-summary-title">
          <div className={styles.card}>
            <div className={styles.summaryHead}>
              <h2 id="checkout-summary-title">Chi tiết thanh toán</h2>
              {checkout.previewLoading && (
                <LoaderCircle className={styles.spin} aria-label="Đang tính lại số tiền" />
              )}
            </div>

            {checkout.previewError && !preview ? (
              <div className={styles.inlineAlert} role="alert">
                <p>{checkout.previewError}</p>
                <button type="button" className={styles.textButton} onClick={checkout.retryPreview}>
                  Thử lại
                </button>
              </div>
            ) : !preview ? (
              <div className={styles.summarySkeleton} aria-hidden="true" />
            ) : (
              <>
                <dl className={styles.lines}>
                  <div>
                    <dt>
                      Giá buổi học
                      <small>Đã gồm phí nền tảng</small>
                    </dt>
                    <dd>{formatScoin(price)}</dd>
                  </div>
                  {couponDiscount > 0 && (
                    <div>
                      <dt>Mã {checkout.appliedCode}</dt>
                      <dd className={styles.minus}>−{formatScoin(couponDiscount)}</dd>
                    </div>
                  )}
                  {campaign > 0 && (
                    <div>
                      <dt>Ưu đãi chương trình</dt>
                      <dd className={styles.minus}>−{formatScoin(campaign)}</dd>
                    </div>
                  )}
                  {userCredit > 0 && (
                    <div>
                      <dt>
                        Trừ từ số dư S-coins
                        <small>Tự động dùng số dư bạn có</small>
                      </dt>
                      <dd className={styles.minus}>−{formatScoin(userCredit)}</dd>
                    </div>
                  )}
                </dl>

                <div className={styles.stack} role="presentation">
                  <span className={styles.stackPay} style={{ flexGrow: payable / barTotal }} />
                  <span
                    className={styles.stackDiscount}
                    style={{ flexGrow: (couponDiscount + campaign) / barTotal }}
                  />
                  <span
                    className={styles.stackCredit}
                    style={{ flexGrow: userCredit / barTotal }}
                  />
                </div>

                <div className={styles.total}>
                  <span>Còn phải trả</span>
                  <strong>
                    {formatScoin(payable)}
                    <small> S-coins</small>
                  </strong>
                </div>
                {saved > 0 && (
                  <span className={styles.savedPill}>
                    Bạn tiết kiệm {formatScoin(saved)} S-coins
                  </span>
                )}
                <p className={styles.disclaimer}>
                  {preview.disclaimer?.trim() ||
                    'Số tiền ước tính. Hệ thống kiểm tra lại mã khi bạn bấm thanh toán.'}
                </p>
              </>
            )}

            {deadline && (
              <p className={styles.deadline}>
                <Clock aria-hidden="true" />
                Thanh toán trước {formatWhen(deadline)} để giữ chỗ. Quá hạn, lịch hẹn tự hủy.
              </p>
            )}

            <label className={`${styles.consent} ${checkout.consent ? styles.consentOn : ''}`}>
              <input
                type="checkbox"
                checked={checkout.consent}
                onChange={(event) => checkout.setConsent(event.target.checked)}
              />
              <span>
                Tôi đã đọc và đồng ý với{' '}
                <Link className={styles.textLink} href={termsHref}>
                  Điều khoản sử dụng
                </Link>
                ,{' '}
                <a className={styles.textLink} href={`#${REFUND_SECTION_ID}`}>
                  Chính sách hủy &amp; hoàn tiền
                </a>{' '}
                và{' '}
                <Link className={styles.textLink} href={privacyHref}>
                  Chính sách bảo mật
                </Link>{' '}
                của SkillSwap.
              </span>
            </label>

            {checkout.payError && (
              <div className={styles.inlineAlert} role="alert">
                <p>{checkout.payError.message}</p>
                {checkout.payError.retryable && (
                  <button
                    type="button"
                    className={styles.textButton}
                    disabled={!checkout.consent || paying}
                    onClick={() => void checkout.pay()}
                  >
                    Thử lại
                  </button>
                )}
              </div>
            )}

            {payButton(styles.payButton, !checkout.consent ? consentHelpId : undefined)}
            {!checkout.consent && (
              <p id={consentHelpId} className={styles.payHelp}>
                Đánh dấu đồng ý ở trên để tiếp tục.
              </p>
            )}
            <p className={styles.secure}>
              <Lock aria-hidden="true" />
              Thanh toán an toàn qua PayOS. Hóa đơn lưu trong Booking của tôi.
            </p>
          </div>
        </aside>
      </div>

      {/* Phone: amount + pay button stay reachable while scrolling. */}
      <div className={styles.bottomBar}>
        <div>
          <span>Còn phải trả</span>
          <strong>{preview ? `${formatScoin(payable)} S-coins` : '—'}</strong>
        </div>
        {checkout.consent ? (
          payButton(styles.bottomPay)
        ) : (
          <a className={styles.bottomHint} href="#checkout-summary-title">
            Đồng ý điều khoản để thanh toán
          </a>
        )}
      </div>
    </section>
  );
}
