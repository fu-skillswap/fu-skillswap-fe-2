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

const SERVICE = { serviceId: 's1', isFree: false, publicPriceScoin: 16500 };

test('couponFitsService', () => {
  const coupon = { remainingQuota: 5, minOrderValueScoin: 18000 };
  assert.equal(couponFitsService(coupon, SERVICE), true); // 18.150 with surcharge
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
