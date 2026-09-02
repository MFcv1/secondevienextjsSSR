'use strict';

const { compareTimestamps } = require('../admin/dashboardProjection');

function projectionError(code) {
    const error = new Error(code);
    error.code = code;
    return error;
}

function planNewsletterProjection({
    currentCount,
    ledger,
    previousPresent = false,
    present,
    sourceUpdateTime,
    eventId
}) {
    if (!Number.isSafeInteger(currentCount) || currentCount < 0) {
        throw projectionError('ADMIN_NEWSLETTER_SUMMARY_INVALID');
    }
    if (
        ledger?.eventId === eventId ||
        compareTimestamps(sourceUpdateTime, ledger?.sourceUpdateTime) <= 0
    ) {
        return { outcome: 'noop', activeCount: currentCount, delta: 0 };
    }
    const delta = Number(present === true) - Number(
        ledger ? ledger.present === true : previousPresent === true
    );
    const activeCount = currentCount + delta;
    if (!Number.isSafeInteger(activeCount) || activeCount < 0) {
        throw projectionError('ADMIN_NEWSLETTER_SUMMARY_UNDERFLOW');
    }
    return { outcome: 'apply', activeCount, delta };
}

module.exports = { planNewsletterProjection, projectionError };
