/**
 * Unit tests for the pure coupon helpers. No test runner is configured in this repo, so these use
 * Node's built-in runner (Node ≥ 22.18 strips the TypeScript types of the imported module):
 *   node --test src/lib/coupon.test.mjs
 */

import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  MENTEE_SURCHARGE_BPS,
  couponFitsService,
  pickMoneyFlowExample,
  couponMoneyFlow,
  menteePriceAfter,
  couponRule,
  walletCouponLabel,
  offerState,
  offerBadge,
  offerCap,
  canApplyTo,
  appliedOfferFor,
  visibleOffers,
  pickOfferMoneyFlowExample,
  menteePriceOf,
  serviceMoneyFlow,
} from './coupon.ts';

const CHAOK19 = { discountType: 'PERCENT', discountValue: 20, maxDiscountScoin: 3000 };
const ONTAPCK = { discountType: 'PERCENT', discountValue: 100, maxDiscountScoin: 20000 };

test('surcharge is 10% in basis points', () => {
  assert.equal(MENTEE_SURCHARGE_BPS, 1000);
});

test('couponMoneyFlow: 16.500 + 10%, CHAOK19 20% capped at 3.000', () => {
  assert.deepEqual(couponMoneyFlow(16500, 1000, CHAOK19), {
    priceWithSurcharge: 18150,
    discount: 3000,
    menteePays: 15150,
    mentorGets: 16500,
    platformFee: 1650,
  });
});

test('couponMoneyFlow: ONTAPCK 100% capped at 20.000 covers the whole session', () => {
  const flow = couponMoneyFlow(16500, 1000, ONTAPCK);
  assert.equal(flow.discount, 18150);
  assert.equal(flow.menteePays, 0);
  assert.equal(flow.mentorGets, 16500);
  assert.equal(flow.platformFee, 1650);
});

test('couponMoneyFlow: fixed discount and no offer', () => {
  const fixed = couponMoneyFlow(16500, 1000, {
    discountType: 'FIXED',
    discountValue: 2000,
    maxDiscountScoin: null,
  });
  assert.equal(fixed.discount, 2000);
  assert.equal(fixed.menteePays, 16150);
  const none = couponMoneyFlow(16500, 1000, null);
  assert.equal(none.discount, 0);
  assert.equal(none.menteePays, 18150);
});

test('couponMoneyFlow: parts always add up', () => {
  for (const price of [0, 1, 999, 16500, 123457]) {
    const flow = couponMoneyFlow(price, 1000, CHAOK19);
    assert.equal(flow.menteePays + flow.discount, flow.priceWithSurcharge);
    assert.equal(flow.mentorGets + flow.platformFee, flow.priceWithSurcharge);
  }
});

test('menteePriceAfter never goes below 0', () => {
  assert.equal(
    menteePriceAfter({ discountType: 'FIXED', discountValue: 5000, maxDiscountScoin: null }, 1500),
    0,
  );
});

test('couponRule', () => {
  assert.equal(couponRule(CHAOK19), '20%, tối đa 3.000 S-coins');
  assert.equal(
    couponRule({ discountType: 'FIXED', discountValue: 2000, maxDiscountScoin: null }),
    '2.000 S-coins',
  );
});

test('walletCouponLabel', () => {
  assert.equal(walletCouponLabel({ originType: 'RELEASE', memo: 'Buổi học' }), null);
  assert.equal(
    walletCouponLabel({ originType: 'COUPON_BONUS', memo: 'Coupon CHAOK19' }),
    'SkillSwap tài trợ mã CHAOK19',
  );
  assert.equal(
    walletCouponLabel({ sourceType: 'COUPON', memo: 'Tài trợ mã CHAOK19 cho booking' }),
    'SkillSwap tài trợ mã CHAOK19',
  );
  assert.equal(
    walletCouponLabel({ sourceType: 'COUPON', memo: 'Coupon discount share' }),
    'Coupon discount share',
  );
});

// publicPriceScoin already includes the 10% mentee surcharge (Swagger): 16.500 base → 18.150.
const SERVICE = { serviceId: 's1', isFree: false, publicPriceScoin: 18150 };

test('couponFitsService', () => {
  const coupon = { remainingQuota: 5, minOrderValueScoin: 18000 };
  assert.equal(couponFitsService(coupon, SERVICE), true); // mentee price 18.150
  assert.equal(couponFitsService({ ...coupon, minOrderValueScoin: 18200 }, SERVICE), false);
  assert.equal(couponFitsService({ ...coupon, remainingQuota: 0 }, SERVICE), false);
  assert.equal(couponFitsService(coupon, { ...SERVICE, isFree: true }), false);
  assert.equal(couponFitsService({ ...coupon, applicableServiceIds: ['s2'] }, SERVICE), false);
  assert.equal(couponFitsService({ ...coupon, applicableServiceIds: ['s1'] }, SERVICE), true);
});

test('pickMoneyFlowExample takes the largest discount on the first fitting service', () => {
  const free = { serviceId: 'f', isFree: true, publicPriceScoin: 0 };
  const a = { ...CHAOK19, code: 'A', remainingQuota: null, minOrderValueScoin: null };
  const b = { ...ONTAPCK, code: 'B', remainingQuota: null, minOrderValueScoin: null };
  const example = pickMoneyFlowExample([free, SERVICE], [a, b]);
  assert.equal(example?.service.serviceId, 's1');
  assert.equal(example?.coupon.code, 'B');
  assert.equal(pickMoneyFlowExample([free], [a]), null);
});

// --- Mentor coupon opt-in ---

const NOW = Date.parse('2026-11-13T05:00:00Z');
const offer = (overrides = {}) => ({
  couponId: 'c1',
  code: 'CHAOK19',
  title: 'Chào K19',
  description: null,
  discountType: 'PERCENT',
  discountValue: 20,
  maxDiscountScoin: 3000,
  minOrderValueScoin: null,
  startAt: '2026-11-01T00:00:00Z',
  endAt: '2026-11-30T16:59:59Z',
  quotaTotal: 500,
  remainingQuota: 120,
  quotaPerUser: 1,
  isNew: false,
  appliedServiceIds: [],
  ...overrides,
});
const paid = {
  serviceId: 's1',
  title: 'CV',
  isFree: false,
  basePriceScoin: 16500,
  publicPriceScoin: 18150,
  estimatedMentorPayoutScoin: 14850,
};
const free = { serviceId: 's2', title: 'Chat', isFree: true, publicPriceScoin: 0 };

test('menteePriceAfter: PERCENT capped and FIXED on the mentee price', () => {
  assert.equal(menteePriceAfter(offer(), 18150), 15150);
  assert.equal(menteePriceAfter(offer({ maxDiscountScoin: null }), 18150), 14520);
  assert.equal(
    menteePriceAfter(offer({ discountType: 'FIXED', discountValue: 2000 }), 18150),
    16150,
  );
});

test('offerState', () => {
  assert.equal(offerState(offer(), NOW), 'running');
  assert.equal(offerState(offer({ startAt: '2026-12-01T00:00:00Z' }), NOW), 'scheduled');
  assert.equal(offerState(offer({ endAt: '2026-11-10T00:00:00Z' }), NOW), 'ended');
  assert.equal(offerState(offer({ remainingQuota: 0 }), NOW), 'ended');
});

test('offerBadge and offerCap', () => {
  assert.equal(offerBadge(offer()), '-20%');
  assert.equal(offerBadge(offer({ discountValue: 100 })), '-100%');
  assert.equal(offerBadge(offer({ discountType: 'FIXED', discountValue: 2000 })), '-2.000');
  assert.equal(offerCap(offer()), 'tối đa 3.000');
  assert.equal(offerCap(offer({ discountType: 'FIXED', discountValue: 2000 })), 'S-coins');
});

test('canApplyTo: free services and minimum on the mentee price', () => {
  assert.deepEqual(canApplyTo(offer(), paid), { eligible: true, reason: null });
  assert.equal(canApplyTo(offer(), free).reason, 'Miễn phí, không cần mã');
  // Mentee price 18.150: a 20.000 minimum is not met, 18.000 is.
  assert.equal(
    canApplyTo(offer({ minOrderValueScoin: 20000 }), paid).reason,
    'Cần giá từ 20.000 S-coins',
  );
  assert.equal(canApplyTo(offer({ minOrderValueScoin: 18000 }), paid).eligible, true);
});

test('appliedOfferFor returns the offer listing the service', () => {
  const a = offer({ couponId: 'a' });
  const b = offer({ couponId: 'b', appliedServiceIds: ['s1'] });
  assert.equal(appliedOfferFor('s1', [a, b]), b);
  assert.equal(appliedOfferFor('s9', [a, b]), null);
  assert.equal(appliedOfferFor('s1', null), null);
});

test('visibleOffers hides ended, orders new → running → scheduled', () => {
  const ended = offer({ couponId: 'ended', remainingQuota: 0 });
  const scheduled = offer({ couponId: 'scheduled', startAt: '2026-12-01T00:00:00Z' });
  const running = offer({ couponId: 'running' });
  const fresh = offer({ couponId: 'fresh', isNew: true });
  assert.deepEqual(
    visibleOffers([ended, scheduled, running, fresh], NOW).map((o) => o.couponId),
    ['fresh', 'running', 'scheduled'],
  );
});

test('pickOfferMoneyFlowExample prefers the applied offer', () => {
  const big = offer({ couponId: 'big', discountValue: 100, maxDiscountScoin: 20000 });
  const applied = offer({ couponId: 'applied', appliedServiceIds: ['s1'] });
  assert.equal(pickOfferMoneyFlowExample([free, paid], [big, applied], NOW).coupon, applied);
  assert.equal(pickOfferMoneyFlowExample([free, paid], [offer(), big], NOW).coupon, big);
  assert.equal(pickOfferMoneyFlowExample([free], [big], NOW), null);
});

test('menteePriceOf uses publicPriceScoin as is (no second surcharge)', () => {
  assert.equal(menteePriceOf(paid), 18150);
  assert.equal(menteePriceOf(free), 0);
});

test('serviceMoneyFlow uses the API prices and adds up', () => {
  assert.deepEqual(serviceMoneyFlow(paid, CHAOK19), {
    basePrice: 16500,
    priceWithSurcharge: 18150,
    discount: 3000,
    menteePays: 15150,
    mentorGets: 14850,
    platformFee: 3300,
  });
  const none = serviceMoneyFlow({ ...paid, estimatedMentorPayoutScoin: null }, null);
  assert.equal(none.discount, 0);
  assert.equal(none.mentorGets, 16500);
  assert.equal(serviceMoneyFlow(free, CHAOK19).priceWithSurcharge, 0);
});
