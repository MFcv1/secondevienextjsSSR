'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const {
    ADMIN_PAYMENT_LINK_CHANNEL,
    buildPaymentLinkUrl,
    createPaymentLinkState,
    createPaymentLinkToken,
    derivePaymentLinkStatus,
    expiresAtFromMinutes,
    rotatePaymentLinkState,
    verifyPaymentLinkToken
} = require('../../../functions/src/commerce/domain/adminPaymentLink');

const SECRET = 'test-payment-link-secret-with-at-least-thirty-two-characters';
const NOW = '2026-08-01T10:00:00.000Z';

function paymentLinkState() {
    return createPaymentLinkState({
        actorUid: 'admin_test_123',
        email: 'client@example.com',
        tokenNonce: 'nonce_abcdefghijklmnop',
        now: NOW
    });
}

function order(overrides = {}) {
    return {
        checkout: {
            channel: ADMIN_PAYMENT_LINK_CHANNEL,
            status: 'active',
            closeReason: null,
            expiresAt: '2026-08-01T12:00:00.000Z',
            paymentLink: paymentLinkState(),
            ...(overrides.checkout || {})
        },
        payment: {
            status: 'awaiting_method',
            ...(overrides.payment || {})
        }
    };
}

test('payment link token is deterministic, opaque and invalidated by rotation', () => {
    const initial = paymentLinkState();
    const token = createPaymentLinkToken({
        orderId: 'ord_payment_link_123',
        paymentLink: initial,
        secret: SECRET
    });
    assert.match(token, /^[A-Za-z0-9_-]{40,64}$/);
    assert.equal(verifyPaymentLinkToken({
        orderId: 'ord_payment_link_123',
        paymentLink: initial,
        secret: SECRET,
        token
    }), true);

    const rotated = rotatePaymentLinkState(initial, {
        tokenNonce: 'nonce_qrstuvwxyzabcdef',
        actorUid: 'admin_test_123',
        now: '2026-08-01T10:05:00.000Z'
    });
    assert.equal(rotated.tokenVersion, 2);
    assert.equal(verifyPaymentLinkToken({
        orderId: 'ord_payment_link_123',
        paymentLink: rotated,
        secret: SECRET,
        token
    }), false);
});

test('payment link URL contains no email or customer data', () => {
    const url = buildPaymentLinkUrl({
        siteUrl: 'https://example.com/',
        orderId: 'ord_payment_link_123',
        paymentLink: paymentLinkState(),
        secret: SECRET
    });
    assert.match(url, /^https:\/\/example\.com\/payer\/ord_payment_link_123\/[A-Za-z0-9_-]+$/);
    assert.equal(url.includes('client%40example.com'), false);
    assert.equal(url.includes('client@example.com'), false);
});

test('expiry stays bounded between thirty minutes and twenty-four hours', () => {
    assert.equal(
        expiresAtFromMinutes(30, Date.parse(NOW)),
        '2026-08-01T10:30:00.000Z'
    );
    assert.equal(
        expiresAtFromMinutes(1440, Date.parse(NOW)),
        '2026-08-02T10:00:00.000Z'
    );
    assert.throws(() => expiresAtFromMinutes(29, Date.parse(NOW)));
    assert.throws(() => expiresAtFromMinutes(1441, Date.parse(NOW)));
});

test('status derivation is monotonic for active, expired, canceled and paid links', () => {
    assert.equal(derivePaymentLinkStatus(order(), Date.parse(NOW)), 'active');
    assert.equal(derivePaymentLinkStatus(order(), Date.parse('2026-08-01T12:00:00.000Z')), 'expired');
    assert.equal(derivePaymentLinkStatus(order({
        checkout: { closeReason: 'canceled', status: 'closed' },
        payment: { status: 'canceled' }
    }), Date.parse(NOW)), 'canceled');
    assert.equal(derivePaymentLinkStatus(order({
        checkout: { closeReason: 'paid', status: 'closed' },
        payment: { status: 'succeeded' }
    }), Date.parse('2026-08-03T12:00:00.000Z')), 'paid');
});

test('completed customer details expose a payment-ready status', () => {
    const state = paymentLinkState();
    assert.equal(derivePaymentLinkStatus(order({
        checkout: {
            paymentLink: { ...state, customerDetailsStatus: 'complete' }
        }
    }), Date.parse(NOW)), 'ready_to_pay');
});
