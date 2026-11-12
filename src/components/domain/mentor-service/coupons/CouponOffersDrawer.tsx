/**
 * @file CouponOffersDrawer.tsx
 * @description Right side sheet "Ưu đãi SkillSwap tài trợ" (bottom sheet below 768px). A list view
 * of SkillSwap-funded coupons and an apply view that replaces it in the same dialog.
 */

'use client';

import {
  appliedOfferFor,
  canApplyTo,
  formatOfferDate,
  formatOfferDay,
  formatScoin,
  menteePriceAfter,
  menteePriceOf,
  offerBadge,
  offerCap,
  offerState,
} from '@/lib/coupon';
import { ApiClientError } from '@/models/apiClient';
import type {
  BookingCancellationRefundPolicy,
  MentorServiceManagementResponse,
} from '@/models/auth';
import type { MentorCouponOffer } from '@/models/coupon';
import { couponRepo } from '@/repositories/couponRepo';
import { showSuccess } from '@/utils/toast';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, CircleHelp, ShieldCheck, X } from 'lucide-react';
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
import { MENTOR_COUPON_OFFERS_QUERY_KEY } from './useMentorCouponOffers';

const APPLY_FALLBACK_ERROR = 'Chưa áp được mã. Thử lại sau ít phút.';
const STOP_FALLBACK_ERROR = 'Chưa ngừng áp được mã. Thử lại sau ít phút.';
const FOCUSABLE =
  'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

function apiMessage(reason: unknown, fallback: string) {
  if (reason instanceof ApiClientError && reason.message.trim()) return reason.message.trim();
  return fallback;
}

function titlesOf(ids: readonly string[], services: MentorServiceManagementResponse[]) {
  return ids
    .map((id) => services.find((service) => service.serviceId === id)?.title)
    .filter((title): title is string => Boolean(title))
    .join(', ');
}

/** "Đến dd/MM/yyyy · mỗi mentee n lần" | "dd/MM – dd/MM/yyyy" (+ " · dịch vụ từ … S-coins"). */
function offerMeta(offer: MentorCouponOffer, scheduled: boolean) {
  let text = scheduled
    ? `${formatOfferDay(offer.startAt)} – ${formatOfferDate(offer.endAt)}`
    : `Đến ${formatOfferDate(offer.endAt)}`;
  if (!scheduled && offer.quotaPerUser != null && offer.quotaPerUser > 0) {
    text += ` · mỗi mentee ${offer.quotaPerUser} lần`;
  }
  if (offer.minOrderValueScoin != null && offer.minOrderValueScoin > 0) {
    text += ` · dịch vụ từ ${formatScoin(offer.minOrderValueScoin)} S-coins`;
  }
  return text;
}

function OfferStub({ offer, scheduled }: { offer: MentorCouponOffer; scheduled: boolean }) {
  const badge = offerBadge(offer);
  return (
    <div className={`${styles.stub} ${scheduled ? styles.stubScheduled : ''}`}>
      <span className={`${styles.stubBadge} ${badge.length > 5 ? styles.stubBadgeLong : ''}`}>
        {badge}
      </span>
      <span className={styles.stubCap}>{offerCap(offer)}</span>
    </div>
  );
}

function Spinner() {
  return <span className={styles.spinner} aria-hidden="true" />;
}

type View = { kind: 'list' } | { kind: 'apply'; couponId: string };

/** Tabs of the list view. */
export type CouponDrawerTab = 'offers' | 'how';
const TAB_ORDER: CouponDrawerTab[] = ['offers', 'how'];

export interface CouponOffersDrawerProps {
  open: boolean;
  /** Visible offers (ended ones already removed), in display order. */
  offers: MentorCouponOffer[];
  services: MentorServiceManagementResponse[];
  /** Service whose card opened the drawer: pre-checked in the apply view, target of "Ngừng áp". */
  contextServiceId: string | null;
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
  /** Called after a successful PUT, to reload the mentor services. */
  onChanged: () => void | Promise<void>;
}

export function CouponOffersDrawer(props: CouponOffersDrawerProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!props.open || !mounted) return null;
  return createPortal(<DrawerContent {...props} />, document.body);
}

function DrawerContent({
  offers,
  services,
  contextServiceId,
  trigger,
  fallbackFocusId,
  initialTab = 'offers',
  refundPolicy = null,
  walletHref,
  onClose,
  onChanged,
}: CouponOffersDrawerProps) {
  const queryClient = useQueryClient();
  const panelRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();
  const [view, setView] = useState<View>({ kind: 'list' });
  const [tab, setTab] = useState<CouponDrawerTab>(initialTab);
  const tabIdBase = useId();
  const tabRefs = useRef<Partial<Record<CouponDrawerTab, HTMLButtonElement | null>>>({});
  const tabId = (value: CouponDrawerTab) => `${tabIdBase}-tab-${value}`;
  const panelId = (value: CouponDrawerTab) => `${tabIdBase}-panel-${value}`;

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
  const [confirmStopId, setConfirmStopId] = useState<string | null>(null);
  const [stoppingId, setStoppingId] = useState<string | null>(null);
  const [stopError, setStopError] = useState<{ couponId: string; message: string } | null>(null);
  const viewKey = view.kind === 'apply' ? `apply-${view.couponId}` : 'list';

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

  // Move focus to the heading of the view that just appeared.
  useEffect(() => {
    headingRef.current?.focus();
  }, [viewKey]);

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: MENTOR_COUPON_OFFERS_QUERY_KEY }),
      Promise.resolve(onChanged()),
    ]);
  };

  const applyOffer =
    view.kind === 'apply' ? offers.find((o) => o.couponId === view.couponId) : null;

  const stopTarget = (offer: MentorCouponOffer) => {
    const applied = offer.appliedServiceIds ?? [];
    if (contextServiceId && applied.includes(contextServiceId)) return [contextServiceId];
    return applied;
  };

  const stopApplying = async (offer: MentorCouponOffer) => {
    if (stoppingId) return;
    const removed = stopTarget(offer);
    const remaining = (offer.appliedServiceIds ?? []).filter((id) => !removed.includes(id));
    setStoppingId(offer.couponId);
    setStopError(null);
    try {
      const result = await couponRepo.setCouponServices(offer.couponId, remaining);
      if (result === null) throw new Error('not-deployed');
      showSuccess(
        `Đã ngừng áp ${offer.code}. Mentee trả giá gốc cho ${titlesOf(removed, services) || 'dịch vụ'}.`,
      );
      setConfirmStopId(null);
      await refresh();
    } catch (reason) {
      setStopError({ couponId: offer.couponId, message: apiMessage(reason, STOP_FALLBACK_ERROR) });
    } finally {
      setStoppingId(null);
    }
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
        {applyOffer ? (
          <ApplyView
            key={applyOffer.couponId}
            offer={applyOffer}
            offers={offers}
            services={services}
            contextServiceId={contextServiceId}
            titleId={titleId}
            headingRef={headingRef}
            onBack={() => setView({ kind: 'list' })}
            onClose={onClose}
            onApplied={async (serviceIds) => {
              showSuccess(`Đã áp ${applyOffer.code} cho ${titlesOf(serviceIds, services)}.`);
              onClose();
              await refresh();
            }}
          />
        ) : (
          <>
            <header className={styles.listHeader}>
              <div>
                <h2 id={titleId} ref={headingRef} tabIndex={-1} className={styles.listTitle}>
                  Ưu đãi SkillSwap tài trợ
                </h2>
                <p className={styles.listSub}>
                  SkillSwap trả phần giảm, bạn vẫn nhận đủ giá dịch vụ. Mỗi dịch vụ áp 1 mã.
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
                    {value === 'offers' ? `Ưu đãi (${offers.length})` : 'Cơ chế hoạt động'}
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
                  offers={offers}
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
                        <strong>Áp mã có lợi gì, tiền đi thế nào?</strong> Xem cơ chế trước khi áp.
                      </span>
                      <ChevronRight
                        className="h-5 w-5 shrink-0 text-text-muted"
                        aria-hidden="true"
                      />
                    </button>
                  </li>
                  {offers.map((offer) => (
                    <OfferTicket
                      key={offer.couponId}
                      offer={offer}
                      services={services}
                      confirmingStop={confirmStopId === offer.couponId}
                      stopping={stoppingId === offer.couponId}
                      stopError={stopError?.couponId === offer.couponId ? stopError.message : null}
                      stopServiceTitles={titlesOf(stopTarget(offer), services) || 'dịch vụ'}
                      onApply={() => {
                        setConfirmStopId(null);
                        setView({ kind: 'apply', couponId: offer.couponId });
                      }}
                      onAskStop={() => {
                        setStopError(null);
                        setConfirmStopId(offer.couponId);
                      }}
                      onCancelStop={() => setConfirmStopId(null)}
                      onConfirmStop={() => void stopApplying(offer)}
                    />
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </aside>
    </div>
  );
}

function OfferTicket({
  offer,
  services,
  confirmingStop,
  stopping,
  stopError,
  stopServiceTitles,
  onApply,
  onAskStop,
  onCancelStop,
  onConfirmStop,
}: {
  offer: MentorCouponOffer;
  services: MentorServiceManagementResponse[];
  confirmingStop: boolean;
  stopping: boolean;
  stopError: string | null;
  stopServiceTitles: string;
  onApply: () => void;
  onAskStop: () => void;
  onCancelStop: () => void;
  onConfirmStop: () => void;
}) {
  const keepRef = useRef<HTMLButtonElement>(null);
  const scheduled = offerState(offer) === 'scheduled';
  const appliedIds = offer.appliedServiceIds ?? [];
  const appliedTitles = titlesOf(appliedIds, services);
  const applied = appliedIds.length > 0;

  useEffect(() => {
    if (confirmingStop) keepRef.current?.focus();
  }, [confirmingStop]);

  const pill = applied
    ? { className: styles.pillApplied, label: 'Đang áp' }
    : offer.isNew
      ? { className: styles.pillNew, label: 'Mới' }
      : scheduled
        ? { className: styles.pillScheduled, label: `Mở từ ${formatOfferDay(offer.startAt)}` }
        : null;

  let detail: React.ReactNode = null;
  if (applied) {
    detail = (
      <p className={`${styles.metaStrong} ${styles.metaApplied}`}>
        Đang áp cho: {appliedTitles || `${appliedIds.length} dịch vụ`}
      </p>
    );
  } else if (scheduled) {
    detail = (
      <p className={styles.metaStrong}>Áp trước, mã tự chạy từ {formatOfferDay(offer.startAt)}</p>
    );
  } else if (offer.quotaTotal != null) {
    detail = (
      <p className={styles.metaStrong}>
        Còn {formatScoin(offer.remainingQuota ?? offer.quotaTotal)}/{formatScoin(offer.quotaTotal)}{' '}
        suất trên toàn hệ thống
      </p>
    );
  }

  return (
    <li className={`${styles.ticket} ${applied ? styles.ticketApplied : ''}`}>
      <OfferStub offer={offer} scheduled={scheduled} />
      <div className={styles.ticketMain}>
        <div className={styles.ticketTop}>
          <h3 className={styles.ticketTitle}>{offer.title}</h3>
          {pill && <span className={`${styles.statusPill} ${pill.className}`}>{pill.label}</span>}
        </div>
        <p className={styles.meta}>{offerMeta(offer, scheduled)}</p>
        {detail}

        <div className={styles.ticketFooter}>
          <span className={styles.codeChip}>{offer.code}</span>
          {!confirmingStop && (
            <div className={styles.actions}>
              {applied ? (
                <>
                  <button
                    type="button"
                    className={`${styles.btn} ${styles.btnDangerText}`}
                    onClick={onAskStop}
                  >
                    Ngừng áp
                  </button>
                  <button
                    type="button"
                    className={`${styles.btn} ${styles.btnOutline}`}
                    onClick={onApply}
                  >
                    Đổi dịch vụ
                  </button>
                </>
              ) : scheduled ? (
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnOutline}`}
                  onClick={onApply}
                >
                  Đăng ký trước
                </button>
              ) : (
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnPrimary}`}
                  onClick={onApply}
                >
                  Áp cho dịch vụ
                </button>
              )}
            </div>
          )}
        </div>

        {confirmingStop && (
          <div className={styles.confirm} role="group" aria-label={`Ngừng áp ${offer.code}`}>
            <p className={styles.confirmText}>
              Ngừng áp {offer.code} cho {stopServiceTitles}? Mentee đã thanh toán giữ nguyên giá.
            </p>
            {stopError && (
              <p className={`${styles.errorAlert} mt-2`} role="alert">
                {stopError}
              </p>
            )}
            <div className={styles.confirmActions}>
              <button
                ref={keepRef}
                type="button"
                className={`${styles.btn} ${styles.btnOutline}`}
                disabled={stopping}
                onClick={onCancelStop}
              >
                Giữ mã
              </button>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnDanger}`}
                disabled={stopping}
                aria-busy={stopping}
                onClick={onConfirmStop}
              >
                {stopping && <Spinner />}
                Ngừng áp
              </button>
            </div>
          </div>
        )}
      </div>
    </li>
  );
}

function initialSelection(
  offer: MentorCouponOffer,
  services: MentorServiceManagementResponse[],
  contextServiceId: string | null,
) {
  const eligibleIds = services
    .filter((service) => canApplyTo(offer, service).eligible)
    .map((service) => service.serviceId);
  const selected = new Set(
    (offer.appliedServiceIds ?? []).filter((id) => eligibleIds.includes(id)),
  );
  if (contextServiceId && eligibleIds.includes(contextServiceId)) selected.add(contextServiceId);
  if (eligibleIds.length === 1) selected.add(eligibleIds[0]);
  return selected;
}

function ApplyView({
  offer,
  offers,
  services,
  contextServiceId,
  titleId,
  headingRef,
  onBack,
  onClose,
  onApplied,
}: {
  offer: MentorCouponOffer;
  offers: MentorCouponOffer[];
  services: MentorServiceManagementResponse[];
  contextServiceId: string | null;
  titleId: string;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  onBack: () => void;
  onClose: () => void;
  onApplied: (serviceIds: string[]) => Promise<void>;
}) {
  const [selected, setSelected] = useState(() =>
    initialSelection(offer, services, contextServiceId),
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submittingRef = useRef(false);
  const scheduled = offerState(offer) === 'scheduled';
  const otherOffers = offers.filter((item) => item.couponId !== offer.couponId);
  // Keep the service order of the page; selected ids that are no longer listed are dropped.
  const selectedIds = services.map((service) => service.serviceId).filter((id) => selected.has(id));
  const count = selectedIds.length;
  // One price in the note only when every selected service has the same price.
  const priceForNote = (() => {
    const prices = new Set(
      services
        .filter((service) => selected.has(service.serviceId))
        .map((service) => service.publicPriceScoin ?? 0),
    );
    return prices.size === 1 ? [...prices][0] : null;
  })();

  const toggle = (serviceId: string) => {
    setError(null);
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(serviceId)) next.delete(serviceId);
      else next.add(serviceId);
      return next;
    });
  };

  const submit = async () => {
    if (!count || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setError(null);
    try {
      const result = await couponRepo.setCouponServices(offer.couponId, selectedIds);
      if (result === null) throw new Error('not-deployed');
      await onApplied(selectedIds);
    } catch (reason) {
      setError(apiMessage(reason, APPLY_FALLBACK_ERROR));
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const submitLabel = !count
    ? 'Chọn ít nhất 1 dịch vụ'
    : scheduled
      ? `Đăng ký trước cho ${count} dịch vụ`
      : `Áp mã cho ${count} dịch vụ`;

  return (
    <>
      <header className={styles.applyHeader}>
        <div className={styles.applyTopBar}>
          <button type="button" className={styles.backButton} onClick={onBack}>
            <ChevronLeft className="h-4.5 w-4.5" aria-hidden="true" />
            Tất cả ưu đãi
          </button>
          <button
            type="button"
            className={styles.closeOnWhite}
            aria-label="Đóng ưu đãi"
            onClick={onClose}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <h2 id={titleId} ref={headingRef} tabIndex={-1} className={styles.applyTitle}>
          Áp {offer.code} cho dịch vụ
        </h2>
        <div className={styles.summary}>
          <OfferStub offer={offer} scheduled={scheduled} />
          <div className={styles.summaryMain}>
            <p className={styles.ticketTitle}>{offer.title}</p>
            <p className={styles.meta}>{offerMeta(offer, scheduled)}</p>
          </div>
        </div>
      </header>

      <form
        className="flex min-h-0 flex-1 flex-col"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <div className={styles.body}>
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Chọn dịch vụ</legend>
            <ul className={styles.serviceList}>
              {services.map((service) => {
                const eligibility = canApplyTo(offer, service);
                const checked = eligibility.eligible && selected.has(service.serviceId);
                const before = menteePriceOf(service);
                const after = menteePriceAfter(offer, before);
                const other = checked ? appliedOfferFor(service.serviceId, otherOffers) : null;
                const rowClass = !eligibility.eligible
                  ? styles.serviceRowDisabled
                  : checked
                    ? styles.serviceRowChecked
                    : '';
                return (
                  <li key={service.serviceId}>
                    <label className={`${styles.serviceRow} ${rowClass}`}>
                      <input
                        type="checkbox"
                        className={styles.checkbox}
                        checked={checked}
                        disabled={!eligibility.eligible || submitting}
                        onChange={() => toggle(service.serviceId)}
                      />
                      <span className={styles.serviceInfo}>
                        <span className={styles.serviceTitle}>{service.title}</span>
                        {eligibility.eligible ? (
                          <span className={styles.servicePrice}>
                            {formatScoin(service.publicPriceScoin)} S-coins · Mentee trả{' '}
                            <strong>{formatScoin(after)}</strong>{' '}
                            <s className={styles.strike}>{formatScoin(before)}</s>
                          </span>
                        ) : (
                          <span className={styles.servicePrice}>{eligibility.reason}</span>
                        )}
                        {other && (
                          <span className={styles.replaceNote}>
                            Sẽ thay mã {other.code} đang áp.
                          </span>
                        )}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </fieldset>

          <p className={styles.safeNote}>
            <ShieldCheck aria-hidden="true" />
            <span>
              Bạn vẫn nhận đủ{' '}
              {priceForNote != null ? `${formatScoin(priceForNote)} S-coins` : 'giá dịch vụ'} mỗi
              buổi. SkillSwap chi trả phần giảm. Ngừng áp lúc nào cũng được, mentee đã thanh toán
              giữ nguyên giá.
            </span>
          </p>

          {error && (
            <p className={styles.errorAlert} role="alert">
              {error}
            </p>
          )}
        </div>

        <footer className={styles.footer}>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnLarge} ${styles.btnOutline}`}
            disabled={submitting}
            onClick={onBack}
          >
            Hủy
          </button>
          <button
            type="submit"
            className={`${styles.btn} ${styles.btnLarge} ${styles.btnPrimary}`}
            disabled={!count || submitting}
            aria-busy={submitting}
          >
            {submitting && <Spinner />}
            {submitLabel}
          </button>
        </footer>
      </form>
    </>
  );
}
