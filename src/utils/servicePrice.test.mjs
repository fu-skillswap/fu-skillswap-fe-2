/**
 * Unit tests for `getServicePriceDisplay`. No test runner is configured in this repo, so these use
 * Node's built-in runner (Node ≥ 22.18 strips the TypeScript types of the imported module):
 *   node --test src/utils/servicePrice.test.mjs
 */

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getServicePriceDisplay } from './servicePrice.ts';

test('no coupon fields: keeps today behaviour (final = priceScoin)', () => {
  assert.deepEqual(getServicePriceDisplay({ priceScoin: 69300 }), {
    original: 69300,
    final: 69300,
    hasDiscount: false,
    discount: 0,
    isFree: false,
  });
});

test('no coupon fields and free service', () => {
  const result = getServicePriceDisplay({ priceScoin: 0 });
  assert.equal(result.final, 0);
  assert.equal(result.hasDiscount, false);
  assert.equal(result.isFree, true);
});

test('null coupon fields behave like missing ones', () => {
  const result = getServicePriceDisplay({
    priceScoin: 50000,
    originalPriceScoin: null,
    discountedPriceScoin: null,
    couponDiscountScoin: null,
    hasCouponDiscount: null,
    couponCode: null,
  });
  assert.deepEqual(result, {
    original: 50000,
    final: 50000,
    hasDiscount: false,
    discount: 0,
    isFree: false,
  });
});

test('full discount to 0 (69.300 → 0, WELCOME70K)', () => {
  const result = getServicePriceDisplay({
    priceScoin: 0,
    originalPriceScoin: 69300,
    discountedPriceScoin: 0,
    couponDiscountScoin: 69300,
    hasCouponDiscount: true,
    couponCode: 'WELCOME70K',
    couponTitle: 'Chào bạn mới',
    couponRemainingQuota: 12,
  });
  assert.deepEqual(result, {
    original: 69300,
    final: 0,
    hasDiscount: true,
    discount: 69300,
    code: 'WELCOME70K',
    title: 'Chào bạn mới',
    remainingQuota: 12,
    isFree: true,
  });
});

test('partial discount uses the API discounted price', () => {
  const result = getServicePriceDisplay({
    priceScoin: 55000,
    originalPriceScoin: 66000,
    discountedPriceScoin: 55000,
    couponDiscountScoin: 11000,
    hasCouponDiscount: true,
    couponCode: 'CHAOK19',
  });
  assert.equal(result.original, 66000);
  assert.equal(result.final, 55000);
  assert.equal(result.discount, 11000);
  assert.equal(result.hasDiscount, true);
  assert.equal(result.isFree, false);
  assert.equal(result.code, 'CHAOK19');
  assert.equal('remainingQuota' in result, false);
});

test('discountedPriceScoin missing: final = max(0, original - discount)', () => {
  const partial = getServicePriceDisplay({
    priceScoin: 66000,
    couponDiscountScoin: 11000,
    hasCouponDiscount: true,
  });
  assert.equal(partial.original, 66000);
  assert.equal(partial.final, 55000);

  const overDiscount = getServicePriceDisplay({
    originalPriceScoin: 10000,
    couponDiscountScoin: 20000,
    hasCouponDiscount: true,
  });
  assert.equal(overDiscount.final, 0);
  assert.equal(overDiscount.isFree, true);
});

test('quota 0 is kept as 0, not dropped or turned into null', () => {
  const result = getServicePriceDisplay({
    originalPriceScoin: 30000,
    discountedPriceScoin: 20000,
    couponDiscountScoin: 10000,
    hasCouponDiscount: true,
    couponCode: 'LASTONE',
    couponRemainingQuota: 0,
  });
  assert.equal(result.hasDiscount, true);
  assert.equal(result.remainingQuota, 0);
});

test('null quota stays null (unlimited/unknown)', () => {
  const result = getServicePriceDisplay({
    originalPriceScoin: 30000,
    couponDiscountScoin: 10000,
    hasCouponDiscount: true,
    couponRemainingQuota: null,
  });
  assert.equal(result.remainingQuota, null);
});

test('hasCouponDiscount false or zero discount: no discount shown', () => {
  const flagOff = getServicePriceDisplay({
    priceScoin: 30000,
    couponDiscountScoin: 10000,
    hasCouponDiscount: false,
    couponCode: 'X',
  });
  assert.equal(flagOff.hasDiscount, false);
  assert.equal(flagOff.final, 30000);
  assert.equal(flagOff.code, undefined);

  const zero = getServicePriceDisplay({
    priceScoin: 30000,
    couponDiscountScoin: 0,
    hasCouponDiscount: true,
  });
  assert.equal(zero.hasDiscount, false);
  assert.equal(zero.discount, 0);
});
