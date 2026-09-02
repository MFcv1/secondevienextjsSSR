'use strict';

const { compareTimestamps } = require('./dashboardProjection');

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;
const SOURCE_KINDS = new Set(['legacy', 'commerce']);

function historyError(code, field = null) {
    const error = new Error(field ? `${code}:${field}` : code);
    error.code = code;
    return error;
}

function safeCents(value, field) {
    if (!Number.isSafeInteger(value)) throw historyError('ADMIN_FINANCE_HISTORY_AMOUNT_INVALID', field);
    return value;
}

function normalizeFinancialHistorySource(sourceKind, value) {
    if (!SOURCE_KINDS.has(sourceKind)) throw historyError('ADMIN_FINANCE_HISTORY_SOURCE_INVALID');
    if (!value) return null;
    const dateKey = String(value.dateKey || '').trim();
    if (!DATE_KEY.test(dateKey)) throw historyError('ADMIN_FINANCE_HISTORY_DATE_INVALID');
    if (sourceKind === 'commerce') {
        const currency = String(value.currency || '').trim().toUpperCase();
        if (currency !== 'EUR') return { dateKey, revenueCents: 0, ignored: true };
        return { dateKey, revenueCents: safeCents(Number(value.netCents || 0), 'netCents') };
    }
    const euros = Number(value.totalRevenue || 0);
    if (!Number.isFinite(euros)) throw historyError('ADMIN_FINANCE_HISTORY_AMOUNT_INVALID', 'totalRevenue');
    return { dateKey, revenueCents: safeCents(Math.round(euros * 100), 'totalRevenue') };
}

function planFinancialHistorySource({
    existingSource,
    nextContribution,
    sourceUpdateTime,
    eventId
}) {
    if (
        existingSource?.eventId === eventId ||
        compareTimestamps(sourceUpdateTime, existingSource?.sourceUpdateTime) <= 0
    ) {
        return { outcome: 'noop', deltaCents: 0, nextSource: existingSource || null };
    }
    const previousCents = safeCents(Number(existingSource?.revenueCents || 0), 'previous');
    const nextCents = safeCents(Number(nextContribution?.revenueCents || 0), 'next');
    return {
        outcome: 'apply',
        deltaCents: nextCents - previousCents,
        nextSource: {
            revenueCents: nextCents,
            tombstone: nextContribution === null,
            sourceUpdateTime,
            eventId
        }
    };
}

module.exports = {
    normalizeFinancialHistorySource,
    planFinancialHistorySource
};
