'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { canonicalize, hashPayload } = require('../../../functions/src/commerce/domain/idempotency');
const { buildAmounts, validateMoneyInvariants } = require('../../../functions/src/commerce/domain/money');
const { reduceOrder, validateOrderV2 } = require('../../../functions/src/commerce/domain/orderState');
const { fixedClock, makeLine } = require('../fixtures/order-v2.cjs');
const { createOrderV2 } = require('../../../functions/src/commerce/domain/orderState');

function createPrng(seed) {
    let state = seed >>> 0;
    return () => {
        state = ((state * 1664525) + 1013904223) >>> 0;
        return state / 0x100000000;
    };
}

function integer(random, min, max) {
    return Math.floor(random() * (max - min + 1)) + min;
}

test('property: integer-cent algebra is closed over generated valid amounts', () => {
    const random = createPrng(0x5ec0de);
    for (let index = 0; index < 500; index += 1) {
        const itemsCents = integer(random, 1, 5_000_000);
        const shippingCents = integer(random, 0, 100_000);
        const taxCents = integer(random, 0, 200_000);
        const discountCents = integer(random, 0, itemsCents + shippingCents + taxCents);
        const totalCents = itemsCents + shippingCents + taxCents - discountCents;
        const capturedCents = integer(random, 0, totalCents);
        const refundedCents = integer(random, 0, capturedCents);
        const amounts = buildAmounts({
            itemsCents,
            shippingCents,
            taxCents,
            discountCents,
            capturedCents,
            refundedCents
        });
        assert.equal(validateMoneyInvariants(amounts), true);
        assert.equal(amounts.totalCents, totalCents);
        assert.equal(amounts.netCents, capturedCents - refundedCents);
    }
});

test('property: non-terminal payment events never release stock or regress success', () => {
    const random = createPrng(0x1d3a);
    const eventTypes = [
        'payment_method_refused',
        'payment_requires_confirmation',
        'payment_requires_action',
        'payment_processing'
    ];
    for (let sample = 0; sample < 120; sample += 1) {
        const unitAmountCents = integer(random, 100, 100_000);
        const quantity = integer(random, 1, 5);
        let order = createOrderV2({
            userId: `owner-property-${String(sample).padStart(4, '0')}`,
            clientOrderId: `client-order-${String(sample).padStart(4, '0')}`,
            requestHash: String(sample).padStart(64, '0'),
            policyVersion: 'policy-property-1',
            items: [makeLine({ unitAmountCents, quantity })],
            clock: fixedClock()
        });
        for (let step = 0; step < 30; step += 1) {
            order = reduceOrder(order, {
                type: eventTypes[integer(random, 0, eventTypes.length - 1)]
            }, { clock: fixedClock(`2026-07-26T10:${String(step).padStart(2, '0')}:00.000Z`) });
            assert.equal(order.inventorySummary.heldQty, quantity);
            assert.equal(order.inventorySummary.releasedQty, 0);
        }
        order = reduceOrder(order, {
            type: 'payment_succeeded',
            amountCents: order.amounts.totalCents,
            currency: 'EUR'
        }, { clock: fixedClock('2026-07-26T11:00:00.000Z') });
        const stateVersion = order.stateVersion;
        const afterOldEvent = reduceOrder(order, {
            type: eventTypes[integer(random, 0, eventTypes.length - 1)]
        }, { clock: fixedClock('2026-07-26T09:00:00.000Z') });
        assert.strictEqual(afterOldEvent, order);
        assert.equal(afterOldEvent.stateVersion, stateVersion);
        assert.equal(validateOrderV2(afterOldEvent), true);
    }
});

test('property: canonical hashes ignore object key order but preserve payload meaning', () => {
    const random = createPrng(0xc0ffee);
    for (let index = 0; index < 300; index += 1) {
        const a = integer(random, 0, 1_000_000);
        const b = integer(random, 0, 1_000_000);
        const left = { command: 'refund', payload: { a, b }, index };
        const right = { index, payload: { b, a }, command: 'refund' };
        assert.equal(canonicalize(left), canonicalize(right));
        assert.equal(hashPayload(left), hashPayload(right));
        assert.notEqual(hashPayload(left), hashPayload({ ...right, index: index + 1 }));
    }
});
