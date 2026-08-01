'use strict';

const crypto = require('node:crypto');

const ADMIN_PAYMENT_LINK_CHANNEL = 'admin_payment_link';
const MIN_EXPIRY_MINUTES = 30;
const MAX_EXPIRY_MINUTES = 24 * 60;

function paymentLinkError(code, field = null) {
    const error = new Error(field ? `${code}:${field}` : code);
    error.code = code;
    if (field) error.field = field;
    return error;
}

function assertTokenSecret(secret) {
    if (typeof secret !== 'string' || secret.length < 32) {
        throw paymentLinkError('COMMERCE_ADMIN_PAYMENT_LINK_SECRET_INVALID');
    }
}

function normalizeExpiryMinutes(value) {
    if (
        !Number.isSafeInteger(value) ||
        value < MIN_EXPIRY_MINUTES ||
        value > MAX_EXPIRY_MINUTES
    ) {
        throw paymentLinkError('COMMERCE_ADMIN_PAYMENT_LINK_EXPIRY_INVALID');
    }
    return value;
}

function expiresAtFromMinutes(value, nowMillis = Date.now()) {
    const minutes = normalizeExpiryMinutes(value);
    if (!Number.isSafeInteger(nowMillis) || nowMillis <= 0) {
        throw paymentLinkError('COMMERCE_ADMIN_PAYMENT_LINK_CLOCK_INVALID');
    }
    return new Date(nowMillis + (minutes * 60 * 1000)).toISOString();
}

function tokenPayload(orderId, paymentLink) {
    if (
        typeof orderId !== 'string' ||
        orderId.length < 8 ||
        paymentLink?.version !== 1 ||
        !Number.isSafeInteger(paymentLink.tokenVersion) ||
        paymentLink.tokenVersion < 1 ||
        typeof paymentLink.tokenNonce !== 'string' ||
        !/^[A-Za-z0-9_-]{16,128}$/.test(paymentLink.tokenNonce)
    ) {
        throw paymentLinkError('COMMERCE_ADMIN_PAYMENT_LINK_TOKEN_STATE_INVALID');
    }
    return [
        'seconde-vie-payment-link-v1',
        orderId,
        String(paymentLink.tokenVersion),
        paymentLink.tokenNonce
    ].join(':');
}

function createPaymentLinkToken({ orderId, paymentLink, secret }) {
    assertTokenSecret(secret);
    return crypto
        .createHmac('sha256', secret)
        .update(tokenPayload(orderId, paymentLink), 'utf8')
        .digest('base64url');
}

function verifyPaymentLinkToken({ orderId, paymentLink, secret, token }) {
    if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{40,64}$/.test(token)) {
        return false;
    }
    const expected = createPaymentLinkToken({ orderId, paymentLink, secret });
    const receivedBuffer = Buffer.from(token, 'utf8');
    const expectedBuffer = Buffer.from(expected, 'utf8');
    return receivedBuffer.length === expectedBuffer.length &&
        crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
}

function createPaymentLinkState({ actorUid, email = null, tokenNonce, now }) {
    if (
        typeof actorUid !== 'string' ||
        actorUid.length < 8 ||
        typeof tokenNonce !== 'string' ||
        !/^[A-Za-z0-9_-]{16,128}$/.test(tokenNonce) ||
        typeof now !== 'string' ||
        !Number.isSafeInteger(Date.parse(now))
    ) {
        throw paymentLinkError('COMMERCE_ADMIN_PAYMENT_LINK_STATE_INVALID');
    }
    return Object.freeze({
        version: 1,
        tokenVersion: 1,
        tokenNonce,
        createdBy: actorUid,
        emailHint: email || null,
        customerDetailsStatus: 'pending',
        createdAt: now,
        tokenUpdatedAt: now
    });
}

function rotatePaymentLinkState(paymentLink, { tokenNonce, actorUid, now }) {
    tokenPayload('order_placeholder', paymentLink);
    if (
        typeof tokenNonce !== 'string' ||
        !/^[A-Za-z0-9_-]{16,128}$/.test(tokenNonce) ||
        typeof actorUid !== 'string' ||
        actorUid.length < 8 ||
        typeof now !== 'string' ||
        !Number.isSafeInteger(Date.parse(now))
    ) {
        throw paymentLinkError('COMMERCE_ADMIN_PAYMENT_LINK_ROTATION_INVALID');
    }
    return {
        ...paymentLink,
        tokenVersion: paymentLink.tokenVersion + 1,
        tokenNonce,
        tokenUpdatedAt: now,
        tokenUpdatedBy: actorUid
    };
}

function derivePaymentLinkStatus(order, nowMillis = Date.now()) {
    if (order?.checkout?.channel !== ADMIN_PAYMENT_LINK_CHANNEL) {
        throw paymentLinkError('COMMERCE_ADMIN_PAYMENT_LINK_ORDER_INVALID');
    }
    if (order.payment?.status === 'succeeded' || order.checkout?.closeReason === 'paid') {
        return 'paid';
    }
    if (order.checkout?.closeReason === 'expired') return 'expired';
    if (order.checkout?.closeReason === 'canceled' || order.payment?.status === 'canceled') {
        return 'canceled';
    }
    if (order.checkout?.status === 'needs_review' || order.payment?.status === 'needs_review') {
        return 'needs_review';
    }
    const expiresAtMillis = Date.parse(order.checkout?.expiresAt);
    if (Number.isSafeInteger(expiresAtMillis) && expiresAtMillis <= nowMillis) {
        return 'expired';
    }
    if (order.checkout?.paymentLink?.customerDetailsStatus === 'complete') {
        return ['requires_action', 'processing'].includes(order.payment?.status)
            ? 'payment_in_progress'
            : 'ready_to_pay';
    }
    return 'active';
}

function buildPaymentLinkUrl({ siteUrl, orderId, paymentLink, secret }) {
    const origin = String(siteUrl || '').replace(/\/$/, '');
    if (!/^https?:\/\//.test(origin)) {
        throw paymentLinkError('COMMERCE_ADMIN_PAYMENT_LINK_SITE_URL_INVALID');
    }
    const token = createPaymentLinkToken({ orderId, paymentLink, secret });
    return `${origin}/payer/${encodeURIComponent(orderId)}/${encodeURIComponent(token)}`;
}

module.exports = {
    ADMIN_PAYMENT_LINK_CHANNEL,
    MAX_EXPIRY_MINUTES,
    MIN_EXPIRY_MINUTES,
    buildPaymentLinkUrl,
    createPaymentLinkState,
    createPaymentLinkToken,
    derivePaymentLinkStatus,
    expiresAtFromMinutes,
    normalizeExpiryMinutes,
    rotatePaymentLinkState,
    verifyPaymentLinkToken
};
