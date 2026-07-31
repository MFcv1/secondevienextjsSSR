'use strict';

const { createOrderV2 } = require('../../../functions/src/commerce/domain/orderState');

const FIXED_TIME = '2026-07-26T10:00:00.000Z';

function fixedClock(value = FIXED_TIME) {
    return { now: () => value };
}

function makeLine(overrides = {}) {
    return {
        lineId: 'line-0001',
        cartLineId: 'cart-line-0001',
        cartRevision: 1,
        inventoryKey: 'inventory-key-0001',
        productId: 'product-0001',
        collectionName: 'furniture',
        variantId: null,
        titleSnapshot: 'Fauteuil de test',
        unitAmountCents: 12500,
        quantity: 1,
        ...overrides
    };
}

function makeOrder(overrides = {}) {
    const order = createOrderV2({
        userId: 'owner-uid-0001',
        clientOrderId: 'client-order-0001',
        requestHash: 'a'.repeat(64),
        policyVersion: 'policy-0001',
        items: [makeLine()],
        shippingCents: 1500,
        customerSnapshot: { email: 'client@example.test' },
        shippingSnapshot: { country: 'FR' },
        deliverySnapshot: {
            id: 'delivery-carrier',
            shippingCents: 1500,
            policyVersion: 'policy-0001'
        },
        expiresAt: '2026-07-26T11:00:00.000Z',
        clock: fixedClock()
    });
    return {
        ...order,
        ...overrides
    };
}

module.exports = {
    FIXED_TIME,
    fixedClock,
    makeLine,
    makeOrder
};
