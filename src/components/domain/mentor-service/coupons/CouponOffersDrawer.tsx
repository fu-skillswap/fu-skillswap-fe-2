/**
 * @file CouponOffersDrawer.tsx
 * @description Right side sheet "Ưu đãi SkillSwap tài trợ" (bottom sheet below 768px), read-only:
 * the coupons from GET /api/me/coupons with the mentor services each one fits, and a
 * "Cơ chế hoạt động" tab. Mentees enter the code at checkout; there is no apply action.
 */

'use client';

import {
  couponBadgeText,
  couponCap,
  couponFitsService,
  formatScoin,
  isNearlyExhaustedQuota,
} from '@/lib/coupon';
import type {
  BookingCancellationRefundPolicy,
  MentorServiceManagementResponse,
} from '@/models/auth';
import type { UserCouponView } from '@/models/coupon';
import { ChevronRight, CircleHelp, X } from 'lucide-react';
import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { CouponHowItWorks } from './CouponHowItWorks';
import styles from './couponOffers.module.css';

const FOCUSABLE =
  'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

/** Tabs of the drawer. */
export type CouponDrawerTab = 'offers' | 'how';
const TAB_ORDER: CouponDrawerTab[] = ['offers', 'how'];

export interface CouponOffersDrawerProps {
  open: boolean;
  /** Coupons with quota left, from GET /api/me/coupons. */
  coupons: UserCouponView[];
  services: MentorServiceManagementResponse[];
  /** Element that opened the drawer; focus returns to it (or to `fallbackFocusId`) on close. */
  trigger: HTMLElement | null;
  fallbackFocusId?: string;
  /** Tab shown when the drawer opens (default "Ưu đãi"). */
  initialTab?: CouponDrawerTab;
  /** Refund percentages for "Khi buổi học bị hủy"; null keeps the generic wording. */
  refundPolicy?: BookingCancellationRefundPolicy | null;
  /** Ví S-coins history route, linked from "Cơ chế hoạt động". */
  walletHref: string;
  onClose: () => void;
}

export function CouponOffersDrawer(props: CouponOffersDrawerProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!props.open || !mounted) return null;
  return createPortal(<DrawerContent {...props} />, document.body);
}

function DrawerContent({
  coupons,
  services,
  trigger,
  fallbackFocusId,
  initialTab = 'offers',
  refundPolicy = null,
  walletHref,
  onClose,
}: CouponOffersDrawerProps) {
  const panelRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();
  const [tab, setTab] = useState<CouponDrawerTab>(initialTab);
  const tabIdBase = useId();
  const tabRefs = useRef<Partial<Record<CouponDrawerTab, HTMLButtonElement | null>>>({});
  const tabId = (value: CouponDrawerTab) => `${tabIdBase}-tab-${value}`;
  const panelId = (value: CouponDrawerTab) => `${tabIdBase}-panel-${value}`;

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Focus trap, Esc, scroll lock; focus returns to the trigger on unmount.
  useEffect(() => {
    const handleKeyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;
      const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || !panelRef.current.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyboard);
    headingRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyboard);
      const target =
        trigger && trigger.isConnected
          ? trigger
          : fallbackFocusId
            ? document.getElementById(fallbackFocusId)
            : null;
      target?.focus();
    };
  }, [trigger, fallbackFocusId]);

  /** Switches tab; `focusTab` moves focus to the new tab button (keyboard / entry card). */
  const selectTab = (next: CouponDrawerTab, focusTab = false) => {
    setTab(next);
    if (focusTab) window.requestAnimationFrame(() => tabRefs.current[next]?.focus());
  };

  const onTabKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    const index = TAB_ORDER.indexOf(tab);
    let next: CouponDrawerTab | null = null;
    if (event.key === 'ArrowRight') next = TAB_ORDER[(index + 1) % TAB_ORDER.length];
    else if (event.key === 'ArrowLeft')
      next = TAB_ORDER[(index - 1 + TAB_ORDER.length) % TAB_ORDER.length];
    else if (event.key === 'Home') next = TAB_ORDER[0];
    else if (event.key === 'End') next = TAB_ORDER[TAB_ORDER.length - 1];
    if (!next) return;
    event.preventDefault();
    selectTab(next, true);
  };

  return (
    <div className={styles.overlay} role="presentation" onMouseDown={() => onClose()}>
      <aside
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className={styles.listHeader}>
          <div>
            <h2 id={titleId} ref={headingRef} tabIndex={-1} className={styles.listTitle}>
              Ưu đãi SkillSwap tài trợ
            </h2>
            <p className={styles.listSub}>
              SkillSwap trả phần giảm, bạn vẫn nhận đủ giá dịch vụ. Mentee nhập mã khi thanh toán.
            </p>
          </div>
          <button
            type="button"
            className={styles.closeOnGradient}
            aria-label="Đóng ưu đãi"
            onClick={onClose}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
          <div className={styles.tabList} role="tablist" aria-label="Ưu đãi SkillSwap tài trợ">
            {TAB_ORDER.map((value) => (
              <button
                key={value}
                ref={(element) => {
                  tabRefs.current[value] = element;
                }}
                id={tabId(value)}
                type="button"
                role="tab"
                className={styles.tab}
                aria-selected={tab === value}
                aria-controls={panelId(value)}
                tabIndex={tab === value ? 0 : -1}
                onClick={() => selectTab(value)}
                onKeyDown={onTabKeyDown}
              >
                {value === 'offers' ? `Ưu đãi (${coupons.length})` : 'Cơ chế hoạt động'}
              </button>
            ))}
          </div>
        </header>

        {tab === 'how' ? (
          <div
            id={panelId('how')}
            role="tabpanel"
            aria-labelledby={tabId('how')}
            className={styles.tabPanel}
          >
            <CouponHowItWorks
              services={services}
              coupons={coupons}
              refundPolicy={refundPolicy}
              walletHref={walletHref}
              onShowOffers={() => selectTab('offers', true)}
            />
          </div>
        ) : (
          <div
            id={panelId('offers')}
            role="tabpanel"
            aria-labelledby={tabId('offers')}
            className={styles.tabPanel}
          >
            <ul className={styles.body} aria-label="Danh sách ưu đãi">
              <li>
                <button
                  type="button"
                  className={styles.howEntry}
                  onClick={() => selectTab('how', true)}
                >
                  <CircleHelp className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                  <span className={styles.howEntryText}>
                    <strong>Áp mã có lợi gì, tiền đi thế nào?</strong> Xem cơ chế hoạt động.
                  </span>
                  <ChevronRight className="h-5 w-5 shrink-0 text-text-muted" aria-hidden="true" />
                </button>
              </li>
              {coupons.map((coupon) => (
                <CouponTicket key={coupon.id} coupon={coupon} services={services} />
              ))}
            </ul>
          </div>
        )}
      </aside>
    </div>
  );
}

function CouponTicket({
  coupon,
  services,
}: {
  coupon: UserCouponView;
  services: MentorServiceManagementResponse[];
}) {
  const badge = couponBadgeText(coupon);
  const fitting = services.filter((service) => couponFitsService(coupon, service));
  const runningLow = isNearlyExhaustedQuota(coupon);
  const description = coupon.description?.trim();

  return (
    <li className={`${styles.ticket} ${fitting.length ? styles.ticketApplied : ''}`}>
      <div className={styles.stub}>
        <span className={`${styles.stubBadge} ${badge.length > 5 ? styles.stubBadgeLong : ''}`}>
          {badge}
        </span>
        <span className={styles.stubCap}>{couponCap(coupon)}</span>
      </div>
      <div className={styles.ticketMain}>
        <div className={styles.ticketTop}>
          <h3 className={styles.ticketTitle}>{coupon.title}</h3>
          {runningLow && (
            <span className={`${styles.statusPill} ${styles.pillNew}`}>Sắp hết suất</span>
          )}
        </div>
        {description && <p className={styles.meta}>{description}</p>}
        {coupon.minOrderValueScoin != null && coupon.minOrderValueScoin > 0 && (
          <p className={styles.meta}>
            Dịch vụ từ {formatScoin(coupon.minOrderValueScoin)} S-coins (giá mentee thấy)
          </p>
        )}
        {fitting.length ? (
          <p className={`${styles.metaStrong} ${styles.metaApplied}`}>
            Dùng được cho: {fitting.map((service) => service.title).join(', ')}
          </p>
        ) : (
          <p className={styles.metaStrong}>Chưa có dịch vụ nào của bạn đủ điều kiện.</p>
        )}
        {coupon.quotaTotal != null && (
          <p className={styles.metaStrong}>
            Còn {formatScoin(coupon.remainingQuota ?? coupon.quotaTotal)}/
            {formatScoin(coupon.quotaTotal)} suất trên toàn hệ thống
          </p>
        )}
        <div className={styles.ticketFooter}>
          <span className={styles.codeChip}>{coupon.code}</span>
        </div>
      </div>
    </li>
  );
}
