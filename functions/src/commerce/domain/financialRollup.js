'use strict';

function rollupError(code) {
    const error = new Error(code);
    error.code = code;
    return error;
}

function toDateKey(value) {
    const date = value instanceof Date
        ? value
        : typeof value?.toDate === 'function'
            ? value.toDate()
            : new Date(value);
    if (!Number.isFinite(date.getTime())) {
        throw rollupError('COMMERCE_FINANCIAL_ROLLUP_DATE_INVALID');
    }
    return date.toISOString().slice(0, 10);
}

function buildFinancialRollupDelta(fact) {
    if (!fact || !['capture', 'refund', 'refund_reversal'].includes(fact.type)) {
        throw rollupError('COMMERCE_FINANCIAL_ROLLUP_TYPE_INVALID');
    }
    if (!Number.isSafeInteger(fact.amountCents) || fact.amountCents <= 0) {
        throw rollupError('COMMERCE_FINANCIAL_ROLLUP_AMOUNT_INVALID');
    }
    const currency = String(fact.currency || '').trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(currency)) {
        throw rollupError('COMMERCE_FINANCIAL_ROLLUP_CURRENCY_INVALID');
    }
    const capturedCents = fact.type === 'capture' ? fact.amountCents : 0;
    const refundedCents = fact.type === 'refund'
        ? fact.amountCents
        : (fact.type === 'refund_reversal' ? -fact.amountCents : 0);
    return Object.freeze({
        dateKey: toDateKey(fact.effectiveAt),
        currency,
        capturedCents,
        refundedCents,
        netCents: capturedCents - refundedCents,
        factCount: 1
    });
}

function writeFinancialRollups(transaction, {
    refs,
    fact,
    updatedAt,
    increment
}) {
    if (typeof transaction?.set !== 'function' || typeof increment !== 'function') {
        throw rollupError('COMMERCE_FINANCIAL_ROLLUP_DEPENDENCY_INVALID');
    }
    const delta = buildFinancialRollupDelta(fact);
    const amounts = {
        capturedCents: increment(delta.capturedCents),
        refundedCents: increment(delta.refundedCents),
        netCents: increment(delta.netCents),
        factCount: increment(delta.factCount)
    };
    transaction.set(refs.financialDaily(delta.dateKey, delta.currency), {
        schemaVersion: 2,
        dateKey: delta.dateKey,
        currency: delta.currency,
        ...amounts,
        updatedAt
    }, { merge: true });
    transaction.set(refs.financialTotals(delta.currency), {
        schemaVersion: 2,
        currency: delta.currency,
        ...amounts,
        updatedAt
    }, { merge: true });
    return delta;
}

module.exports = {
    buildFinancialRollupDelta,
    toDateKey,
    writeFinancialRollups
};
