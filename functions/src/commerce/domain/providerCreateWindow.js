'use strict';

// Stripe may prune an idempotency key after 24 hours. Keep a one-hour margin,
// anchored to the immutable attempt creation time, never its last retry.
const PROVIDER_CREATE_WINDOW_MS = 23 * 60 * 60 * 1000;

function assertProviderCreateWindow(attempt, clock) {
    const createdAt = Date.parse(attempt?.createdAt);
    const now = Date.parse(clock.now());
    if (!Number.isFinite(createdAt) || !Number.isFinite(now) ||
        now < createdAt || now - createdAt >= PROVIDER_CREATE_WINDOW_MS) {
        const error = new Error('COMMERCE_PROVIDER_RECONCILIATION_REQUIRED');
        error.code = 'COMMERCE_PROVIDER_RECONCILIATION_REQUIRED';
        throw error;
    }
}

module.exports = { assertProviderCreateWindow, PROVIDER_CREATE_WINDOW_MS };
