'use strict';

const { hashPayload } = require('./idempotency');

function projectionError(code, detail) {
    const error = new Error(detail ? `${code}:${detail}` : code);
    error.code = code;
    if (detail) error.detail = detail;
    return error;
}

function effectiveIso(value) {
    if (value && typeof value.toDate === 'function') return value.toDate().toISOString();
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) {
        throw projectionError('COMMERCE_FINANCIAL_FACT_DATE_INVALID');
    }
    return date.toISOString();
}

function normalizeFact(fact) {
    if (
        !fact ||
        fact.schemaVersion !== 2 ||
        typeof fact.effectId !== 'string' ||
        typeof fact.orderId !== 'string' ||
        !['capture', 'refund', 'refund_reversal'].includes(fact.type) ||
        !Number.isSafeInteger(fact.amountCents) ||
        fact.amountCents <= 0 ||
        typeof fact.currency !== 'string' ||
        !/^[A-Z]{3}$/.test(fact.currency) ||
        typeof fact.providerObjectId !== 'string'
    ) {
        throw projectionError('COMMERCE_FINANCIAL_FACT_INVALID');
    }
    return {
        schemaVersion: 2,
        effectId: fact.effectId,
        orderId: fact.orderId,
        type: fact.type,
        amountCents: fact.amountCents,
        currency: fact.currency,
        connectedAccountId: fact.connectedAccountId || null,
        providerObjectId: fact.providerObjectId,
        effectiveAt: effectiveIso(fact.effectiveAt),
        commandId: fact.commandId || null
    };
}

function emptyAmounts() {
    return { capturedCents: 0, refundedCents: 0, netCents: 0 };
}

function addFact(target, fact) {
    if (fact.type === 'capture') target.capturedCents += fact.amountCents;
    if (fact.type === 'refund') target.refundedCents += fact.amountCents;
    if (fact.type === 'refund_reversal') target.refundedCents -= fact.amountCents;
    target.netCents = target.capturedCents - target.refundedCents;
}

function sortedRecord(map) {
    return Object.fromEntries([...map.entries()].sort(([left], [right]) => left.localeCompare(right)));
}

function buildFinancialProjection(facts, { builtAt = null } = {}) {
    if (!Array.isArray(facts)) throw projectionError('COMMERCE_FINANCIAL_FACTS_INVALID');
    const byEffect = new Map();
    for (const source of facts) {
        if (source?.status && source.status !== 'succeeded') continue;
        const fact = normalizeFact(source);
        const existing = byEffect.get(fact.effectId);
        if (existing && hashPayload(existing) !== hashPayload(fact)) {
            throw projectionError('COMMERCE_FINANCIAL_FACT_DUPLICATE_CONFLICT', fact.effectId);
        }
        byEffect.set(fact.effectId, fact);
    }
    const normalizedFacts = [...byEffect.values()].sort((left, right) => (
        left.effectiveAt.localeCompare(right.effectiveAt) ||
        left.effectId.localeCompare(right.effectId)
    ));
    const currencies = new Map();
    const days = new Map();
    const orders = new Map();
    const accounts = new Map();
    for (const fact of normalizedFacts) {
        if (!currencies.has(fact.currency)) currencies.set(fact.currency, emptyAmounts());
        addFact(currencies.get(fact.currency), fact);
        const dayKey = `${fact.effectiveAt.slice(0, 10)}:${fact.currency}`;
        if (!days.has(dayKey)) {
            days.set(dayKey, {
                date: fact.effectiveAt.slice(0, 10),
                currency: fact.currency,
                ...emptyAmounts()
            });
        }
        addFact(days.get(dayKey), fact);
        const orderKey = `${fact.orderId}:${fact.currency}`;
        if (!orders.has(orderKey)) {
            orders.set(orderKey, {
                orderId: fact.orderId,
                currency: fact.currency,
                ...emptyAmounts()
            });
        }
        addFact(orders.get(orderKey), fact);
        const accountKey = `${fact.connectedAccountId || 'platform'}:${fact.currency}`;
        if (!accounts.has(accountKey)) {
            accounts.set(accountKey, {
                connectedAccountId: fact.connectedAccountId,
                currency: fact.currency,
                ...emptyAmounts()
            });
        }
        addFact(accounts.get(accountKey), fact);
    }
    const divergences = [...orders.values()]
        .filter((entry) => entry.refundedCents > entry.capturedCents)
        .map((entry) => ({
            code: 'REFUND_EXCEEDS_CAPTURE',
            orderId: entry.orderId,
            currency: entry.currency,
            capturedCents: entry.capturedCents,
            refundedCents: entry.refundedCents
        }))
        .sort((left, right) => left.orderId.localeCompare(right.orderId));
    const content = {
        schemaVersion: 2,
        source: 'commerce_financial_facts',
        factCount: normalizedFacts.length,
        currencies: sortedRecord(currencies),
        days: sortedRecord(days),
        orders: sortedRecord(orders),
        accounts: sortedRecord(accounts),
        divergences
    };
    return Object.freeze({
        ...content,
        projectionHash: hashPayload(content),
        builtAt
    });
}

module.exports = {
    buildFinancialProjection,
    normalizeFact
};
